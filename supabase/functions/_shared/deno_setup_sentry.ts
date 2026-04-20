// deno-lint-ignore no-import-prefix
import { SupabaseClient } from "jsr:@supabase/supabase-js@2.44.2"
// deno-lint-ignore no-import-prefix
import { supabaseIntegration } from "npm:@supabase/sentry-js-integration@0.3"
// deno-lint-ignore no-import-prefix
import * as Sentry from "npm:@sentry/deno@10.49.0"


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

              integrations: [
                supabaseIntegration(SupabaseClient, Sentry, {
                    tracing: true,
                    breadcrumbs: true,
                    errors: true,
                }),
            ],
        })
    }
    else
    {
        console.warn("SENTRY_DSN not set in env, Sentry will not be initialized")
    }
}
