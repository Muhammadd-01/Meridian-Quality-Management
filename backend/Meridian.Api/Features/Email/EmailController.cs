using Meridian.Api.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Meridian.Api.Features.Email;

/// <summary>
/// The signed-in user's own email account (Settings → Email) and sending from it.
/// Every active role may use it; each user only ever reaches their own account.
/// </summary>
[ApiController]
[Authorize]
[RequireRole]
[Route("api/email")]
[Produces("application/json")]
public sealed class EmailController(EmailAccountService accounts, CurrentUser currentUser, ILogger<EmailController> logger) : ControllerBase
{
    public const string SendPolicy = "email-send";

    private Guid UserId => currentUser.Id ?? throw new UnauthorizedAccessException();

    [HttpGet("account")]
    public Task<IActionResult> Account(CancellationToken ct) => Run(async () =>
    {
        var account = await accounts.GetAsync(UserId, ct);
        return Ok(account is null ? EmailAccountView.None : EmailAccountView.From(account));
    });

    /// <summary>Checks the details by signing in to the mail server (nothing is sent), then saves them.</summary>
    [HttpPut("account")]
    [EnableRateLimiting(SendPolicy)]
    public Task<IActionResult> Connect(ConnectEmailRequest request, CancellationToken ct) => Run(async () =>
    {
        var saved = await accounts.ConnectAsync(UserId, request, ct);
        logger.LogInformation("User {UserId} connected email ({Provider})", UserId, request.Provider);
        return Ok(EmailAccountView.From(saved));
    });

    [HttpDelete("account")]
    public Task<IActionResult> Disconnect(CancellationToken ct) => Run(async () =>
    {
        await accounts.DisconnectAsync(UserId, ct);
        return Ok(EmailAccountView.None);
    });

    [HttpPost("send")]
    [EnableRateLimiting(SendPolicy)]
    public Task<IActionResult> Send(SendEmailRequest request, CancellationToken ct) => Run(async () =>
    {
        var account = await accounts.GetAsync(UserId, ct);
        if (account is null)
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Connect your email in Settings first.",
                extensions: new Dictionary<string, object?> { ["code"] = "email_not_connected" });
        await accounts.SendAsync(account, request, ct);
        logger.LogInformation("Email sent by {UserId} to {Count} recipient(s)", UserId, request.To.Count + (request.Cc?.Count ?? 0));
        return Ok(new { sent = true });
    });

    private async Task<IActionResult> Run(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
        }
        catch (EmailProblemException e)
        {
            return Problem(statusCode: e.Status, title: e.Message);
        }
    }
}
