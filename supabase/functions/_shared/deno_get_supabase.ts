import { createClient } from "npm:@supabase/supabase-js@2.44.2"
// import { createClient } from "https://deno.land/x/supabase@v2.44.2/mod.ts"


import { supabase_anon_key, supabase_url } from "../_core/src/supabase/constants.ts"
import type { Database } from "../_core/src/supabase/interface.ts"


export function deno_get_supabase(auth_header: string)
{
    return createClient<Database>(supabase_url, supabase_anon_key, {
        global:
        {
            headers: { Authorization: auth_header },
        },
    })
}


export type SupabaseClient = ReturnType<typeof deno_get_supabase>
