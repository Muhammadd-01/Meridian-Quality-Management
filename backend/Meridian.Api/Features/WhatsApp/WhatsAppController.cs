using System.ComponentModel.DataAnnotations;
using System.Net;
using Meridian.Api.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Meridian.Api.Features.WhatsApp;

public sealed class WhatsAppPhoneRequest
{
    [Required, RegularExpression(AppRoles.PhonePattern, ErrorMessage = "Enter the number in international format, e.g. +923001234567.")]
    public string Phone { get; init; } = string.Empty;
}

public sealed class WhatsAppSendRequest
{
    [Required, RegularExpression(AppRoles.PhonePattern, ErrorMessage = "Enter the number in international format, e.g. +923001234567.")]
    public string Phone { get; init; } = string.Empty;

    [Required, StringLength(4000, MinimumLength = 1, ErrorMessage = "The message must be 1 to 4000 characters.")]
    public string Text { get; init; } = string.Empty;
}

/// <summary>
/// The signed-in user's own linked WhatsApp (QR in Settings) and sending from it.
/// Every active role may use it; each user only ever reaches their own session.
/// </summary>
[ApiController]
[Authorize]
[RequireRole]
[Route("api/whatsapp")]
[Produces("application/json")]
public sealed class WhatsAppController(WhatsAppClient whatsapp, CurrentUser currentUser, ILogger<WhatsAppController> logger) : ControllerBase
{
    public const string SendPolicy = "whatsapp-send";

    private Guid UserId => currentUser.Id ?? throw new UnauthorizedAccessException();

    /// <summary>{ state: disconnected | qr | connecting | connected, qr?, phone?, name?, error? }</summary>
    [HttpGet("status")]
    public Task<IActionResult> Status(CancellationToken ct) => Relay(() => whatsapp.StatusAsync(UserId, ct));

    /// <summary>Starts linking: answers with the QR to scan (or "connected" when already linked).</summary>
    [HttpPost("connect")]
    public Task<IActionResult> Connect(CancellationToken ct) => Relay(() => whatsapp.ConnectAsync(UserId, ct));

    /// <summary>Unlinks this CRM from the user's WhatsApp.</summary>
    [HttpPost("logout")]
    public Task<IActionResult> Logout(CancellationToken ct) => Relay(() => whatsapp.LogoutAsync(UserId, ct));

    /// <summary>Whether a number has a WhatsApp account (needs a linked WhatsApp).</summary>
    [HttpPost("check")]
    [EnableRateLimiting(SendPolicy)]
    public Task<IActionResult> Check(WhatsAppPhoneRequest request, CancellationToken ct) => Relay(() => whatsapp.CheckAsync(UserId, request.Phone, ct));

    /// <summary>Sends a text message from the user's linked WhatsApp. Limited to a few per minute.</summary>
    [HttpPost("send")]
    [EnableRateLimiting(SendPolicy)]
    public async Task<IActionResult> Send(WhatsAppSendRequest request, CancellationToken ct)
    {
        var result = await Relay(() => whatsapp.SendTextAsync(UserId, request.Phone, request.Text.Trim(), ct));
        if (result is OkObjectResult) logger.LogInformation("WhatsApp message sent by {UserId}", currentUser.Id);
        return result;
    }

    private async Task<IActionResult> Relay(Func<Task<WhatsAppResult>> call)
    {
        WhatsAppResult r;
        try
        {
            r = await call();
        }
        catch (WhatsAppUnavailableException)
        {
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "WhatsApp isn't available right now. Please try again shortly.",
                extensions: new Dictionary<string, object?> { ["code"] = "whatsapp_unavailable" });
        }

        if (r.Status == HttpStatusCode.OK) return Ok(r.Body);
        return r.Error switch
        {
            "not_connected" => Problem(statusCode: StatusCodes.Status409Conflict, title: "Link your WhatsApp in Settings first.",
                extensions: new Dictionary<string, object?> { ["code"] = "whatsapp_not_linked" }),
            "not_on_whatsapp" => Problem(statusCode: StatusCodes.Status404NotFound, title: "This number isn't on WhatsApp.",
                extensions: new Dictionary<string, object?> { ["code"] = "not_on_whatsapp" }),
            "invalid_phone" => Problem(statusCode: StatusCodes.Status400BadRequest, title: "That phone number isn't valid."),
            "invalid_text" => Problem(statusCode: StatusCodes.Status400BadRequest, title: "The message is empty or too long."),
            _ => Problem(statusCode: StatusCodes.Status502BadGateway, title: "WhatsApp couldn't complete that. Please try again."),
        };
    }
}
