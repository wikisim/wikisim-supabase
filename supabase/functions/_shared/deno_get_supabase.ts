import { createClient } from "jsr:@supabase/supabase-js@2.44.2"


import { supabase_anon_key, supabase_url } from "../_core/src/supabase/constants.ts"
import type { Database } from "../_core/src/supabase/interface.ts"


export function deno_get_supabase_as_user(auth_header: string)
{
    return createClient<Database>(supabase_url, supabase_anon_key, {
        global:
        {
            headers: { Authorization: auth_header },
        },
    })
}


export function deno_get_supabase_service_role()
{
    const supabase_service_role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabase_service_role)
    {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY env var not set")
    }
    return createClient<Database>(supabase_url, supabase_service_role)
}


export type SupabaseClient = ReturnType<typeof deno_get_supabase_as_user>
