using System.ComponentModel.DataAnnotations;
using System.Net;
using Meridian.Api.Features.Email;

namespace Meridian.Api.Tests;

public class EmailTests
{
    private static bool Valid(object request) =>
        Validator.TryValidateObject(request, new ValidationContext(request), [], validateAllProperties: true);

    [Theory]
    [InlineData("127.0.0.1", true)]
    [InlineData("10.1.2.3", true)]
    [InlineData("172.20.0.5", true)]
    [InlineData("192.168.1.10", true)]
    [InlineData("169.254.169.254", true)]   // cloud metadata
    [InlineData("::1", true)]
    [InlineData("fd00::1", true)]
    [InlineData("142.250.153.108", false)]  // a public mail server
    [InlineData("172.32.0.1", false)]       // just outside 172.16/12
    public void Private_addresses_are_blocked_for_custom_mail_servers(string ip, bool isPrivate) =>
        Assert.Equal(isPrivate, EmailAccountService.IsPrivate(IPAddress.Parse(ip)));

    [Fact]
    public void Known_providers_use_their_own_server_settings()
    {
        var gmail = new ConnectEmailRequest { Email = "me@gmail.com", Provider = "gmail", Password = "app-pass", Host = "evil.example", Port = 22 };
        Assert.True(Valid(gmail));
        Assert.Equal(new SmtpServer("smtp.gmail.com", 465, "ssl"), gmail.Server()); // browser-supplied host/port ignored
    }

    [Theory]
    [InlineData("mail.company.com", 587, "starttls", true)]
    [InlineData("mail.company.com", 22, "ssl", false)]      // not a mail port
    [InlineData("", 465, "ssl", false)]                      // host required
    [InlineData("mail.company.com", 465, "none", false)]     // must be encrypted
    public void Custom_servers_are_validated(string host, int port, string security, bool valid) =>
        Assert.Equal(valid, Valid(new ConnectEmailRequest { Email = "me@company.com", Provider = "custom", Host = host, Port = port, Security = security, Password = "x" }));

    [Fact]
    public void Send_requests_check_every_address()
    {
        Assert.True(Valid(new SendEmailRequest { To = ["sara@indus.test"], Subject = "Hi", Body = "Hello" }));
        Assert.False(Valid(new SendEmailRequest { To = ["not-an-email"], Subject = "Hi", Body = "Hello" }));
        Assert.False(Valid(new SendEmailRequest { To = [], Subject = "Hi", Body = "Hello" }));
        Assert.False(Valid(new SendEmailRequest { To = ["a@b.test"], Subject = "", Body = "Hello" }));
    }
}
