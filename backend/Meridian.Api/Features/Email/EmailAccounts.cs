using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Sockets;
using MailKit.Net.Smtp;
using MailKit.Security;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.DataProtection;
using MimeKit;

namespace Meridian.Api.Features.Email;

/// <summary>A row of <c>public.email_accounts</c> (the password is encrypted by the API).</summary>
public sealed class EmailAccount
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Provider { get; set; } = "custom";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; }
    public string SmtpSecurity { get; set; } = "ssl";
    public string Username { get; set; } = string.Empty;
    public string PasswordEncrypted { get; set; } = string.Empty;
    public DateTimeOffset? VerifiedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

/// <summary>What the web app sees about a connected email: never the password.</summary>
public sealed record EmailAccountView(bool Connected, string? Email, string? DisplayName, string? Provider, string? Host, int? Port, string? Security, DateTimeOffset? VerifiedAt)
{
    public static readonly EmailAccountView None = new(false, null, null, null, null, null, null, null);

    public static EmailAccountView From(EmailAccount a) =>
        new(true, a.Email, a.DisplayName, a.Provider, a.SmtpHost, a.SmtpPort, a.SmtpSecurity, a.VerifiedAt);
}

public sealed record SmtpServer(string Host, int Port, string Security);

public static class EmailProviders
{
    /// <summary>Known providers: the server settings come from here, not from the browser.</summary>
    public static readonly IReadOnlyDictionary<string, SmtpServer> Presets = new Dictionary<string, SmtpServer>
    {
        ["gmail"] = new("smtp.gmail.com", 465, "ssl"),
        ["outlook"] = new("smtp-mail.outlook.com", 587, "starttls"),
        ["office365"] = new("smtp.office365.com", 587, "starttls"),
        ["yahoo"] = new("smtp.mail.yahoo.com", 465, "ssl"),
        ["zoho"] = new("smtp.zoho.com", 465, "ssl"),
    };

    /// <summary>Ports a custom mail server may use (blocks probing arbitrary services).</summary>
    public static readonly int[] AllowedPorts = [25, 465, 587, 2525];
}

public sealed class ConnectEmailRequest : IValidatableObject
{
    [Required, EmailAddress, StringLength(320)] public string Email { get; init; } = string.Empty;
    [StringLength(120)] public string? DisplayName { get; init; }
    [Required, StringLength(20)] public string Provider { get; init; } = "gmail";
    [StringLength(253)] public string? Host { get; init; }
    public int? Port { get; init; }
    [StringLength(10)] public string? Security { get; init; }
    [StringLength(320)] public string? Username { get; init; }
    [Required, StringLength(200, MinimumLength = 1)] public string Password { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Provider != "custom" && !EmailProviders.Presets.ContainsKey(Provider))
            yield return new ValidationResult("Choose an email provider.", ["provider"]);
        if (Provider == "custom")
        {
            if (string.IsNullOrWhiteSpace(Host)) yield return new ValidationResult("Enter the mail server (SMTP host).", ["host"]);
            if (Port is null || !EmailProviders.AllowedPorts.Contains(Port.Value))
                yield return new ValidationResult("The port must be 465, 587, 25 or 2525.", ["port"]);
            if (Security is not ("ssl" or "starttls")) yield return new ValidationResult("Choose SSL or STARTTLS.", ["security"]);
        }
    }

    public SmtpServer Server() => Provider == "custom"
        ? new SmtpServer(Host!.Trim().ToLowerInvariant(), Port!.Value, Security!)
        : EmailProviders.Presets[Provider];
}

public sealed class SendEmailRequest : IValidatableObject
{
    [Required, MinLength(1), MaxLength(10)] public List<string> To { get; init; } = [];
    [MaxLength(10)] public List<string>? Cc { get; init; }
    [Required, StringLength(200, MinimumLength = 1, ErrorMessage = "Add a subject (up to 200 characters).")] public string Subject { get; init; } = string.Empty;
    [Required, StringLength(20000, MinimumLength = 1, ErrorMessage = "The message is empty or too long.")] public string Body { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var check = new EmailAddressAttribute();
        foreach (var address in To.Concat(Cc ?? []))
            if (string.IsNullOrWhiteSpace(address) || !check.IsValid(address.Trim()))
                yield return new ValidationResult($"\"{address}\" isn't a valid email address.", ["to"]);
    }
}

/// <summary>A problem the user can fix (wrong password, server unreachable, …), with a readable message.</summary>
public sealed class EmailProblemException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

/// <summary>Stores each user's mail account (encrypted) and sends through it with SMTP.</summary>
public sealed class EmailAccountService(SupabaseRestClient db, IDataProtectionProvider protection, ILogger<EmailAccountService> logger)
{
    private const string Table = "email_accounts";
    private readonly IDataProtector _protector = protection.CreateProtector("Meridian.Email.Password.v1");

    public async Task<EmailAccount?> GetAsync(Guid userId, CancellationToken ct)
    {
        try
        {
            var result = await db.ListAsync<EmailAccount>(Table, $"select=*&user_id=eq.{userId}&limit=1", ct);
            return result.Items.FirstOrDefault();
        }
        catch (SupabaseException e) when (e.Code is "PGRST205" or "42P01")
        {
            throw new EmailProblemException(503, "Email sending isn't set up yet. Run supabase/email-update.sql in the Supabase SQL Editor.");
        }
    }

    /// <summary>Signs in to the mail server with the details (no email is sent), then saves them.</summary>
    public async Task<EmailAccount> ConnectAsync(Guid userId, ConnectEmailRequest request, CancellationToken ct)
    {
        var server = request.Server();
        await EnsurePublicHostAsync(server.Host, ct);
        var username = string.IsNullOrWhiteSpace(request.Username) ? request.Email.Trim() : request.Username.Trim();
        await WithClientAsync(server, username, request.Password, (_, _) => Task.CompletedTask, ct);

        var account = new EmailAccount
        {
            UserId = userId,
            Email = request.Email.Trim().ToLowerInvariant(),
            DisplayName = request.DisplayName?.Trim() ?? string.Empty,
            Provider = request.Provider,
            SmtpHost = server.Host,
            SmtpPort = server.Port,
            SmtpSecurity = server.Security,
            Username = username,
            PasswordEncrypted = _protector.Protect(request.Password),
            VerifiedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        try
        {
            var saved = await db.UpsertAsync(Table, [account], ct, conflictColumn: "user_id");
            return saved.FirstOrDefault() ?? account;
        }
        catch (SupabaseException e) when (e.Code is "PGRST205" or "42P01")
        {
            throw new EmailProblemException(503, "Email sending isn't set up yet. Run supabase/email-update.sql in the Supabase SQL Editor.");
        }
    }

    public Task<int> DisconnectAsync(Guid userId, CancellationToken ct) => db.DeleteWhereAsync(Table, $"user_id=eq.{userId}", ct);

    public async Task SendAsync(EmailAccount account, SendEmailRequest request, CancellationToken ct)
    {
        string password;
        try
        {
            password = _protector.Unprotect(account.PasswordEncrypted);
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            // The API's encryption keys changed (e.g. moved to another server).
            throw new EmailProblemException(409, "Please connect your email again in Settings → Email.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(account.DisplayName, account.Email));
        message.To.AddRange(request.To.Select(a => MailboxAddress.Parse(a.Trim())));
        if (request.Cc is { Count: > 0 }) message.Cc.AddRange(request.Cc.Select(a => MailboxAddress.Parse(a.Trim())));
        message.Subject = request.Subject.Trim();
        var body = request.Body.Trim();
        message.Body = new BodyBuilder
        {
            TextBody = body,
            HtmlBody = $"<div style=\"font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;color:#102C32\">{WebUtility.HtmlEncode(body).Replace("\n", "<br>")}</div>",
        }.ToMessageBody();

        var server = new SmtpServer(account.SmtpHost, account.SmtpPort, account.SmtpSecurity);
        await WithClientAsync(server, account.Username, password, (client, token) => client.SendAsync(message, token), ct);
    }

    private async Task WithClientAsync(SmtpServer server, string username, string password, Func<SmtpClient, CancellationToken, Task> action, CancellationToken ct)
    {
        using var client = new SmtpClient { Timeout = 20000 };
        try
        {
            var security = server.Security == "ssl" ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(server.Host, server.Port, security, ct);
            await client.AuthenticateAsync(username, password, ct);
            await action(client, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (AuthenticationException)
        {
            throw new EmailProblemException(400,
                "The email or app password is wrong. For Gmail and Yahoo use an app password (not your normal password).");
        }
        catch (SmtpCommandException e) when (e.ErrorCode == SmtpErrorCode.RecipientNotAccepted)
        {
            throw new EmailProblemException(400, $"The mail server refused the address {e.Mailbox?.Address}.");
        }
        catch (SmtpCommandException e)
        {
            logger.LogWarning("SMTP command failed ({Status}): {Message}", e.StatusCode, e.Message);
            throw new EmailProblemException(502, "Your mail server refused the message. Please try again later.");
        }
        catch (Exception e) when (e is SocketException or SslHandshakeException or SmtpProtocolException or IOException or TimeoutException
                                      or OperationCanceledException && !ct.IsCancellationRequested)
        {
            logger.LogWarning("Could not reach mail server {Host}:{Port} ({Type})", server.Host, server.Port, e.GetType().Name);
            throw new EmailProblemException(502, "Couldn't reach your mail server. Check the server settings and try again.");
        }
    }

    /// <summary>Custom servers must be public: no localhost or private-network addresses.</summary>
    private static async Task EnsurePublicHostAsync(string host, CancellationToken ct)
    {
        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(host, ct);
        }
        catch (SocketException)
        {
            throw new EmailProblemException(400, $"The mail server \"{host}\" wasn't found. Check the name.");
        }
        if (addresses.Length == 0 || addresses.Any(IsPrivate))
            throw new EmailProblemException(400, "That mail server address isn't allowed.");
    }

    internal static bool IsPrivate(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip) || ip.Equals(IPAddress.Any) || ip.Equals(IPAddress.IPv6Any)) return true;
        if (ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
            return ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || ip.IsIPv6UniqueLocal;
        var b = ip.GetAddressBytes();
        return b[0] == 10 || b[0] == 127 || b[0] == 0
               || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
               || (b[0] == 192 && b[1] == 168)
               || (b[0] == 169 && b[1] == 254)
               || (b[0] == 100 && b[1] >= 64 && b[1] <= 127);
    }
}
