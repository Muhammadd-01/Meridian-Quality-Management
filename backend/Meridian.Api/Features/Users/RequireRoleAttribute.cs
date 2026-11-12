using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Meridian.Api.Features.Users;

/// <summary>
/// Allows the action only for signed-in users with an active profile and, when
/// roles are given, one of those roles. Answers 403 with a readable reason otherwise.
/// (Row Level Security enforces the same rules in the database.)
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public sealed class RequireRoleAttribute : TypeFilterAttribute
{
    public RequireRoleAttribute(params string[] roles) : base(typeof(RequireRoleFilter))
    {
        Arguments = [roles];
    }
}

internal sealed class RequireRoleFilter(string[] roles, CurrentUser currentUser) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var profile = await currentUser.ProfileAsync(context.HttpContext.RequestAborted);
        if (profile is null || !profile.IsActive)
        {
            context.Result = Forbidden("Your account is not active yet. Ask an Admin or CEO to activate it.", "account_inactive");
            return;
        }
        if (roles.Length > 0 && !roles.Contains(profile.AppRole))
        {
            context.Result = Forbidden($"Your role ({profile.AppRole}) is not allowed to do this.", "forbidden_role");
            return;
        }
        await next();
    }

    public static ObjectResult Forbidden(string title, string code)
    {
        var problem = new ProblemDetails { Status = StatusCodes.Status403Forbidden, Title = title };
        problem.Extensions["code"] = code;
        return new ObjectResult(problem) { StatusCode = StatusCodes.Status403Forbidden, ContentTypes = { "application/problem+json" } };
    }
}
