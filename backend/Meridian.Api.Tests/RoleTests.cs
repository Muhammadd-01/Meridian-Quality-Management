using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Security.Claims;
using System.Text;
using Meridian.Api.Features.Users;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;

namespace Meridian.Api.Tests;

public class RoleTests
{
    private static readonly Guid UserId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    /// <summary>Answers every Supabase call with the given profiles JSON array.</summary>
    private sealed class FakeSupabase(string json) : HttpMessageHandler
    {
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") });
        }
    }

    private static (RequireRoleFilter Filter, ActionExecutingContext Context, FakeSupabase Db) Setup(string? role, bool active, params string[] allowed)
    {
        var json = role is null ? "[]" : $$"""[{"id":"{{UserId}}","email":"a@b.test","full_name":"A","app_role":"{{role}}","is_active":{{(active ? "true" : "false")}}}]""";
        var db = new FakeSupabase(json);
        var http = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", UserId.ToString())], "test")) };
        var accessor = new HttpContextAccessor { HttpContext = http };
        var store = new ProfileStore(new SupabaseRestClient(new HttpClient(db) { BaseAddress = new Uri("http://supabase.test/rest/v1/") }));
        var filter = new RequireRoleFilter(allowed, new CurrentUser(accessor, store));
        var context = new ActionExecutingContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor()), [], new Dictionary<string, object?>(), controller: new object());
        return (filter, context, db);
    }

    private static async Task<(bool NextCalled, int? Status, string? Code)> Run(RequireRoleFilter filter, ActionExecutingContext context)
    {
        var nextCalled = false;
        await filter.OnActionExecutionAsync(context, () =>
        {
            nextCalled = true;
            return Task.FromResult(new ActionExecutedContext(context, [], controller: new object()));
        });
        var result = context.Result as ObjectResult;
        var problem = result?.Value as ProblemDetails;
        return (nextCalled, result?.StatusCode, problem?.Extensions.TryGetValue("code", out var c) == true ? c as string : null);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("CEO", true)]
    [InlineData("Manager", true)]
    [InlineData("Employee", false)]
    public async Task Only_admin_ceo_and_manager_may_delete(string role, bool allowed)
    {
        var (filter, context, _) = Setup(role, active: true, AppRoles.CanDeleteRecords);
        var (next, status, code) = await Run(filter, context);
        Assert.Equal(allowed, next);
        if (!allowed)
        {
            Assert.Equal(403, status);
            Assert.Equal("forbidden_role", code);
        }
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("CEO", true)]
    [InlineData("Manager", false)]
    [InlineData("Employee", false)]
    public async Task Only_admin_and_ceo_may_manage_users(string role, bool allowed)
    {
        var (filter, context, _) = Setup(role, active: true, AppRoles.CanManageUsers);
        Assert.Equal(allowed, (await Run(filter, context)).NextCalled);
    }

    [Fact]
    public async Task Inactive_accounts_are_refused_even_as_admin()
    {
        var (filter, context, _) = Setup("Admin", active: false);
        var (next, status, code) = await Run(filter, context);
        Assert.False(next);
        Assert.Equal(403, status);
        Assert.Equal("account_inactive", code);
    }

    [Fact]
    public async Task Users_without_a_profile_are_refused()
    {
        var (filter, context, _) = Setup(null, active: false);
        Assert.Equal("account_inactive", (await Run(filter, context)).Code);
    }

    [Fact]
    public async Task Any_active_role_passes_when_no_roles_are_listed()
    {
        var (filter, context, _) = Setup("Employee", active: true);
        Assert.True((await Run(filter, context)).NextCalled);
    }

    [Fact]
    public async Task Profile_is_loaded_once_per_request()
    {
        var (_, context, _) = Setup("Manager", active: true);
        var db = new FakeSupabase($$"""[{"id":"{{UserId}}","app_role":"Manager","is_active":true}]""");
        var store = new ProfileStore(new SupabaseRestClient(new HttpClient(db) { BaseAddress = new Uri("http://supabase.test/rest/v1/") }));
        var user = new CurrentUser(new HttpContextAccessor { HttpContext = context.HttpContext }, store);

        // Two filters on one action (e.g. [RequireRole] on the class and on the method) share the request's CurrentUser.
        Assert.True((await Run(new RequireRoleFilter([], user), context)).NextCalled);
        Assert.True((await Run(new RequireRoleFilter(AppRoles.CanDeleteRecords, user), context)).NextCalled);
        Assert.Equal("Manager", await user.RoleAsync(CancellationToken.None));
        Assert.Equal(1, db.Calls);
    }

    [Theory]
    [InlineData("ceo", "CEO")]
    [InlineData(" manager ", "Manager")]
    [InlineData("ADMIN", "Admin")]
    [InlineData("owner", null)]
    [InlineData(null, null)]
    public void Role_names_are_normalised(string? input, string? expected) => Assert.Equal(expected, AppRoles.Normalize(input));

    [Theory]
    [InlineData("+923001234567", true)]
    [InlineData("+14155550123", true)]
    [InlineData("03001234567", false)]      // local format must be converted to +92… first
    [InlineData("+92 300 1234567", false)]  // spaces are removed before sending
    [InlineData("+0123456789", false)]
    [InlineData(null, true)]                // phone is optional
    public void Phone_numbers_must_be_international(string? phone, bool valid)
    {
        var request = new CreateUserRequest { FullName = "Sara Ali", Email = "sara@example.test", Role = "Employee", Password = "Str0ng!pass", Phone = phone };
        Assert.Equal(valid, Validator.TryValidateObject(request, new ValidationContext(request), new List<ValidationResult>(), validateAllProperties: true));
    }

    [Theory]
    [InlineData("Employee", "Str0ng!pass", true)]
    [InlineData("Superuser", "Str0ng!pass", false)]
    [InlineData("Manager", "alllowercase", false)]
    public void Create_user_request_is_validated(string role, string password, bool valid)
    {
        var request = new CreateUserRequest { FullName = "Sara Ali", Email = "sara@example.test", Role = role, Password = password };
        var results = new List<ValidationResult>();
        Assert.Equal(valid, Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true));
    }
}
