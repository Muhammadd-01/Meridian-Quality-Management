using Meridian.Api.Features.Auth;
using Meridian.Api.Features.Users;
using Microsoft.AspNetCore.DataProtection;

namespace Meridian.Api.Tests;

public class OtpAndAvatarTests
{
    private static OtpChallenges Challenges() => new(new EphemeralDataProtectionProvider());

    [Fact]
    public void Challenge_round_trips_user_and_email()
    {
        var challenges = Challenges();
        var id = Guid.NewGuid();
        var read = challenges.Read(challenges.Create(id, "sara@example.test"));
        Assert.Equal((id, "sara@example.test"), read);
    }

    [Fact]
    public void Tampered_or_foreign_challenges_are_rejected()
    {
        var token = Challenges().Create(Guid.NewGuid(), "sara@example.test");
        Assert.Null(Challenges().Read(token));                // different key ring (another server / restart)
        Assert.Null(Challenges().Read("not-a-challenge"));
        var own = Challenges();
        var valid = own.Create(Guid.NewGuid(), "a@b.test");
        Assert.Null(own.Read(valid[..^4] + "AAAA"));          // modified
    }

    [Theory]
    [InlineData("muhammad@gmail.com", "mu******@gmail.com")]
    [InlineData("ab@x.io", "ab***@x.io")]
    [InlineData("a@x.io", "a***@x.io")]
    public void Emails_are_masked(string email, string expected) => Assert.Equal(expected, OtpChallenges.Mask(email));

    [Theory]
    [InlineData("123456", "N3w!password", true)]
    [InlineData(" 12345678 ", "N3w!password", true)]
    [InlineData("12ab56", "N3w!password", false)]   // code must be digits
    [InlineData("123456", "short1!", false)]        // too short
    [InlineData("123456", "alllowercase", false)]   // too simple
    public void Change_password_request_is_validated(string code, string password, bool valid)
    {
        var request = new ChangePasswordRequest { Code = code, NewPassword = password };
        var ok = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(request,
            new System.ComponentModel.DataAnnotations.ValidationContext(request), [], validateAllProperties: true);
        Assert.Equal(valid, ok);
    }

    [Fact]
    public void Image_signatures_are_checked()
    {
        Assert.True(MeController.LooksLike("jpg", [0xFF, 0xD8, 0xFF, 0xE0, 0, 0]));
        Assert.True(MeController.LooksLike("png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0]));
        Assert.True(MeController.LooksLike("webp", "RIFF\0\0\0\0WEBPVP8 "u8.ToArray()));
        Assert.False(MeController.LooksLike("png", "<script>alert(1)</script>"u8.ToArray()));
        Assert.False(MeController.LooksLike("jpg", [0x89, 0x50, 0x4E, 0x47]));
    }
}
