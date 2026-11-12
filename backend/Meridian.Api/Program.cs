using Microsoft.AspNetCore.DataProtection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Meridian.Api.Features.Auth;
using Meridian.Api.Features.Crm;
using Meridian.Api.Infrastructure.Errors;
using Meridian.Api.Infrastructure.Json;
using Meridian.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---- Supabase ---------------------------------------------------------------
builder.Services.AddOptions<SupabaseOptions>()
    .BindConfiguration(SupabaseOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();
var supabase = builder.Configuration.GetSection(SupabaseOptions.SectionName).Get<SupabaseOptions>()
    ?? throw new InvalidOperationException("Missing 'Supabase' configuration section.");

builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<SupabaseUserTokenHandler>();
builder.Services.AddHttpClient<SupabaseRestClient>(client =>
    {
        client.BaseAddress = new Uri($"{supabase.RestUrl}/");
        client.Timeout = TimeSpan.FromSeconds(30);
    })
    .AddHttpMessageHandler<SupabaseUserTokenHandler>();
// Stable name so encrypted values (sign-in challenges, email app passwords) survive restarts.
builder.Services.AddDataProtection().SetApplicationName("Meridian.Api");
builder.Services.AddScoped<Meridian.Api.Features.Email.EmailAccountService>();

// ---- WhatsApp (local link service, see whatsapp-service/) ---------------------
builder.Services.AddOptions<Meridian.Api.Features.WhatsApp.WhatsAppOptions>()
    .BindConfiguration(Meridian.Api.Features.WhatsApp.WhatsAppOptions.SectionName);
builder.Services.AddHttpClient<Meridian.Api.Features.WhatsApp.WhatsAppClient>(client => client.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddSingleton<Meridian.Api.Features.Auth.OtpChallenges>();
builder.Services.AddScoped<Meridian.Api.Features.Users.ProfileStore>();
builder.Services.AddScoped<Meridian.Api.Features.Users.CurrentUser>();
builder.Services.AddHttpClient<SupabaseStorageClient>(client =>
    {
        client.BaseAddress = new Uri($"{supabase.BaseUrl}/storage/v1/");
        client.Timeout = TimeSpan.FromSeconds(60);
    })
    .AddHttpMessageHandler<SupabaseUserTokenHandler>();
builder.Services.AddHttpClient<SupabaseAuthClient>(client =>
{
    client.BaseAddress = new Uri($"{supabase.AuthUrl}/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ---- Authentication: verify Supabase-issued JWTs locally (keys from the project's JWKS) ----
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = supabase.AuthUrl; // discovery: {AuthUrl}/.well-known/openid-configuration
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = supabase.AuthUrl,
            ValidAudience = "authenticated",
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "email",
            RoleClaimType = "role",
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthController.RateLimitPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    // Email: connecting (signs in to the mail server) and sending, per signed-in user.
    options.AddPolicy(Meridian.Api.Features.Email.EmailController.SendPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
    // WhatsApp sends: per signed-in user, kept low to protect the linked number.
    options.AddPolicy(Meridian.Api.Features.WhatsApp.WhatsAppController.SendPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 15, Window = TimeSpan.FromMinutes(1) }));
});

// ---- MVC, errors, docs ------------------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new LenientDateOnlyConverter());
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    });
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient(SupabaseHealthCheck.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(5));
builder.Services.AddHealthChecks()
    .AddCheck<SupabaseHealthCheck>("supabase");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithExposedHeaders(CrmControllerBase<Meridian.Api.Features.Leads.Lead>.TotalCountHeader)));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // /openapi/v1.json
}

// /health: "Healthy" only when the API is up *and* Supabase can be reached (503 + reason otherwise).
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "text/plain";
        var details = string.Join(Environment.NewLine, report.Entries.Select(e => $"{e.Key}: {e.Value.Status} - {e.Value.Description}"));
        await context.Response.WriteAsync($"{report.Status}{Environment.NewLine}{details}");
    },
});
app.MapControllers();

app.Run();
