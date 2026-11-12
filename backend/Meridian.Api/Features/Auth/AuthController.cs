using System.Net;
using Meridian.Api.Features.Users;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Meridian.Api.Features.Auth;

/// <summary>
/// Email + password authentication backed by Supabase Auth. Access tokens are
/// short-lived Supabase JWTs (verified locally by the API); refresh tokens rotate.
/// Every session carries the user's CRM role from <c>public.profiles</c>; accounts
/// without an active profile cannot sign in.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(
    SupabaseAuthClient auth,
    ProfileStore profiles,
    OtpChallenges challenges,
    IConfiguration configuration,
    ILogger<AuthController> logger) : ControllerBase
{
    public const string RateLimitPolicy = "auth";

    /// <summary>Two-step sign-in (password, then a code emailed by Supabase). <c>Auth:RequireEmailOtp</c>, default on.</summary>
    private bool RequireEmailOtp => configuration.GetValue("Auth:RequireEmailOtp", true);

    private int EmailOtpLength => Math.Clamp(configuration.GetValue("Auth:EmailOtpLength", 6), 6, 10);

    /// <summary>
    /// Public self sign-up. Off by default (<c>Auth:AllowPublicSignUp</c>): users are
    /// created by an Admin or CEO on the Users page. When on, new accounts start as
    /// inactive Employees until an Admin or CEO activates them.
    /// </summary>
    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicy)]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        if (!configuration.GetValue("Auth:AllowPublicSignUp", false))
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Accounts are created by an Admin or CEO. Ask them to add you.");

        var metadata = new Dictionary<string, string>
        {
            ["full_name"] = request.FullName.Trim(),
            ["company"] = request.Company.Trim(),
        };
        if (!string.IsNullOrWhiteSpace(request.Role)) metadata["role"] = request.Role.Trim();

        try
        {
            var (session, user) = await auth.SignUpAsync(Normalize(request.Email), request.Password, metadata, ct);
            if (session is null)
                return StatusCode(StatusCodes.Status201Created, new RegisterResponse(true, user is null ? null : AuthUser.From(user), null));

            var profile = await profiles.GetAsync(session.User.Id, ct, session.AccessToken);
            var response = profile is { IsActive: true }
                ? new RegisterResponse(false, AuthUser.From(session.User, profile), AuthSession.From(session, profile))
                : new RegisterResponse(false, AuthUser.From(session.User, profile), null, RequiresApproval: true);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (SupabaseException e) when (e.Code is "user_already_exists" or "email_exists")
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "An account with this email already exists. Sign in instead.");
        }
        catch (SupabaseException e) when (e.Code is "weak_password")
        {
            return Problem(statusCode: StatusCodes.Status422UnprocessableEntity, title: e.Message);
        }
    }

    /// <summary>
    /// Step 1: checks the password. Returns the session straight away, or — when
    /// <c>Auth:RequireEmailOtp</c> is on — emails a code and returns an
    /// <see cref="OtpChallengeResponse"/> to finish with <c>verify-otp</c>.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicy)]
    [ProducesResponseType<AuthSession>(StatusCodes.Status200OK)]
    [ProducesResponseType<OtpChallengeResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        try
        {
            var email = Normalize(request.Email);
            var session = await auth.SignInWithPasswordAsync(email, request.Password, ct);
            var profile = await profiles.GetAsync(session.User.Id, ct, session.AccessToken);
            if (profile is not { IsActive: true })
            {
                await TrySignOutAsync(session.AccessToken, ct);
                return Problem(statusCode: StatusCodes.Status403Forbidden,
                    title: "Your account is not active yet. Ask an Admin or CEO to activate it.",
                    extensions: new Dictionary<string, object?> { ["code"] = "account_inactive" });
            }

            if (!RequireEmailOtp) return Ok(AuthSession.From(session, profile));

            // The password session is not handed out: the emailed code creates the real one.
            await TrySignOutAsync(session.AccessToken, ct);
            await auth.SendEmailOtpAsync(email, ct);
            return Ok(new OtpChallengeResponse(true, challenges.Create(session.User.Id, email), OtpChallenges.Mask(email),
                (int)OtpChallenges.Lifetime.TotalSeconds, EmailOtpLength));
        }
        catch (SupabaseException e) when (e.Code is "email_not_confirmed")
        {
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Please confirm your email address first. Check your inbox for the link.",
                extensions: new Dictionary<string, object?> { ["code"] = e.Code });
        }
        catch (SupabaseException e) when (e.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Unauthorized)
        {
            logger.LogInformation("Failed sign-in ({Code})", e.Code);
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Incorrect email or password.",
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_credentials" });
        }
    }

    /// <summary>Step 2: the emailed code plus the challenge from step 1 → a session.</summary>
    [HttpPost("verify-otp")]
    [EnableRateLimiting(RateLimitPolicy)]
    public async Task<ActionResult<AuthSession>> VerifyOtp(VerifyOtpRequest request, CancellationToken ct)
    {
        if (challenges.Read(request.Challenge) is not { } challenge)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Your verification has expired. Please sign in again.",
                extensions: new Dictionary<string, object?> { ["code"] = "otp_challenge_expired" });
        var (userId, email) = challenge;

        GoTrueSession session;
        try
        {
            session = await auth.VerifyEmailOtpAsync(email, request.Code.Trim(), ct);
        }
        catch (SupabaseException e) when (e.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Unauthorized
                                              or HttpStatusCode.Forbidden or HttpStatusCode.NotFound or HttpStatusCode.UnprocessableEntity)
        {
            logger.LogInformation("Invalid sign-in code ({Code})", e.Code);
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "That code is wrong or has expired. Check the latest email or send a new code.",
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_otp" });
        }

        var profile = session.User.Id == userId ? await profiles.GetAsync(session.User.Id, ct, session.AccessToken) : null;
        if (profile is not { IsActive: true })
        {
            await TrySignOutAsync(session.AccessToken, ct);
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Your account is not active yet. Ask an Admin or CEO to activate it.",
                extensions: new Dictionary<string, object?> { ["code"] = "account_inactive" });
        }
        return Ok(AuthSession.From(session, profile));
    }

    /// <summary>Emails a new code (Supabase allows one about every 60 seconds) and renews the challenge.</summary>
    [HttpPost("resend-otp")]
    [EnableRateLimiting(RateLimitPolicy)]
    public async Task<ActionResult<OtpChallengeResponse>> ResendOtp(ResendOtpRequest request, CancellationToken ct)
    {
        if (challenges.Read(request.Challenge) is not { } challenge)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Your verification has expired. Please sign in again.",
                extensions: new Dictionary<string, object?> { ["code"] = "otp_challenge_expired" });
        var (userId, email) = challenge;

        await auth.SendEmailOtpAsync(email, ct);
        return Ok(new OtpChallengeResponse(true, challenges.Create(userId, email), OtpChallenges.Mask(email),
            (int)OtpChallenges.Lifetime.TotalSeconds, EmailOtpLength));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthSession>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        try
        {
            var session = await auth.RefreshAsync(request.RefreshToken, ct);
            var profile = await profiles.GetAsync(session.User.Id, ct, session.AccessToken);
            if (profile is not { IsActive: true })
            {
                // Deactivated while signed in: end the session (401 makes the web app sign out).
                await TrySignOutAsync(session.AccessToken, ct);
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Your account has been deactivated.",
                    extensions: new Dictionary<string, object?> { ["code"] = "account_inactive" });
            }
            return Ok(AuthSession.From(session, profile));
        }
        catch (SupabaseException e) when (e.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Unauthorized or HttpStatusCode.NotFound)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Your session has expired. Please sign in again.",
                extensions: new Dictionary<string, object?> { ["code"] = "session_expired" });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        try
        {
            await auth.SignOutAsync(BearerToken(), ct);
        }
        catch (SupabaseException e) when (e.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.NotFound or HttpStatusCode.Forbidden)
        {
            // Session already gone — signing out is idempotent.
        }
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUser>> Me(CancellationToken ct)
    {
        var user = await auth.GetUserAsync(BearerToken(), ct);
        return Ok(AuthUser.From(user, await profiles.GetAsync(user.Id, ct)));
    }

    /// <summary>Sends a password-reset email. Always 202 so the endpoint cannot be used to discover accounts.</summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting(RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> ForgotPassword(EmailRequest request, CancellationToken ct)
    {
        try
        {
            await auth.SendPasswordRecoveryAsync(Normalize(request.Email), ct);
        }
        catch (SupabaseException e) when (e.StatusCode != HttpStatusCode.TooManyRequests)
        {
            logger.LogWarning("Password recovery request failed ({Code}): {Message}", e.Code, e.Message);
        }
        return Accepted();
    }

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting(RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> ResendConfirmation(EmailRequest request, CancellationToken ct)
    {
        try
        {
            await auth.ResendSignupConfirmationAsync(Normalize(request.Email), ct);
        }
        catch (SupabaseException e) when (e.StatusCode != HttpStatusCode.TooManyRequests)
        {
            logger.LogWarning("Resend confirmation failed ({Code}): {Message}", e.Code, e.Message);
        }
        return Accepted();
    }

    private async Task TrySignOutAsync(string accessToken, CancellationToken ct)
    {
        try
        {
            await auth.SignOutAsync(accessToken, ct);
        }
        catch (SupabaseException)
        {
            // best effort: the session is unusable for CRM data anyway (RLS needs an active profile)
        }
    }

    private string BearerToken() =>
        SupabaseUserTokenHandler.BearerToken(HttpContext) ?? throw new UnauthorizedAccessException();

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
