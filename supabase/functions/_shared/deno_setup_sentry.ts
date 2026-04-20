import * as Sentry from "@sentry/deno"


export function setup_sentry(server_name: string): void
{
    const sentry_dsn = Deno.env.get("SENTRY_DSN")
    if (sentry_dsn)
    {
        Sentry.init({
            dsn: sentry_dsn,
            // Adds request headers and IP for users, for more info visit:
            // https://docs.sentry.io/platforms/javascript/guides/deno/configuration/options/#sendDefaultPii
            sendDefaultPii: true,
            serverName: server_name,
        })
    }
    else
    {
        console.warn("SENTRY_DSN not set in env, Sentry will not be initialized")
    }
}
