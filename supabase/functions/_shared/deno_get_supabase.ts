// Shared between
// wikisim-supabase/supabase/functions/_shared/deno_get_supabase.ts
// wikisim-server/src/deno_get_supabase.ts

// deno-lint-ignore no-import-prefix
import { createClient } from "jsr:@supabase/supabase-js@2.44.2"

import { Database, supabase_anon_key, supabase_url } from "./core.ts"


// // Prefer the env vars injected by Supabase at runtime so that local dev
// // (where JWTs are signed by the local instance) and production both use the
// // matching endpoint.  Fall back to the hardcoded constants for contexts where
// // the env vars are not available (e.g. wikisim-server).
// const runtime_url  = (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_URL"))  || supabase_url
// const runtime_anon = (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_ANON_KEY")) || supabase_anon_key
const runtime_url  = supabase_url
const runtime_anon = supabase_anon_key


export function deno_get_supabase_as_anon()
{
    return createClient<Database>(runtime_url, runtime_anon)
}


export function deno_get_supabase_as_user(auth_header: string)
{
    return createClient<Database>(runtime_url, runtime_anon, {
        global:
        {
            headers: { Authorization: auth_header },
        },
    })
}


export function deno_get_supabase_service_role(supabase_service_role_level?: string)
{
    supabase_service_role_level ||= Deno.env.get("SECRET_ROLE_UPLOAD_INTERACTABLE_FILES_KEY")
    if (!supabase_service_role_level)
    {
        throw new Error("SECRET_ROLE_UPLOAD_INTERACTABLE_FILES_KEY env var not set")
    }
    return createClient<Database>(supabase_url, supabase_service_role_level)
}


export function deno_get_supabase_clients(auth_header: string | null, supabase_service_role_level?: string)
{
    const user_or_anon = auth_header
        ? deno_get_supabase_as_user(auth_header)
        : deno_get_supabase_as_anon()

    return {
        user_or_anon,
        service_role: deno_get_supabase_service_role(supabase_service_role_level),
    }
}


export type SupabaseClient = ReturnType<typeof deno_get_supabase_as_user>
export type SupabaseClients = ReturnType<typeof deno_get_supabase_clients>
