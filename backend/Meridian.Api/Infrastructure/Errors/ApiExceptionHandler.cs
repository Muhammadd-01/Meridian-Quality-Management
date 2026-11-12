using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Meridian.Api.Infrastructure.Errors;

/// <summary>Converts unhandled exceptions into RFC 7807 problem responses.</summary>
public sealed class ApiExceptionHandler(IProblemDetailsService problemDetails, ILogger<ApiExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            SupabaseException e => new ProblemDetails
            {
                Status = (int)e.StatusCode,
                Title = e.Message,
                Detail = e.Detail,
                Extensions = { ["code"] = e.Code },
            },
            HttpRequestException or TaskCanceledException when !cancellationToken.IsCancellationRequested => new ProblemDetails
            {
                Status = StatusCodes.Status502BadGateway,
                Title = "The database service could not be reached. Please try again.",
            },
            BadHttpRequestException e => new ProblemDetails { Status = e.StatusCode, Title = e.Message },
            UnauthorizedAccessException => new ProblemDetails { Status = StatusCodes.Status401Unauthorized, Title = "Sign in to continue." },
            _ => null,
        };

        if (problem is null)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
            problem = new ProblemDetails { Status = StatusCodes.Status500InternalServerError, Title = "An unexpected error occurred." };
        }
        else if (problem.Status >= 500)
        {
            logger.LogWarning(exception, "Upstream failure for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = problem.Status!.Value;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
