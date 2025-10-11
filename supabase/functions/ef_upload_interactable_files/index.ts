// Run this locally with:
//    deno run --allow-net --allow-env --allow-read index.ts
// Also can run debugger through visual studio code .vscode/launch.json config "Debug Deno Server"

import { ERRORS } from "../_core/src/errors.ts"
import {
    deno_get_supabase_clients
} from "../_shared/deno_get_supabase.ts"
import { CORS_headers_sans_content_type, respond } from "../_shared/respond.ts"
import { get_files_from_request } from "./get_files_from_request.ts"
import { process_upload_results_to_map } from "./process_upload_results_to_map.ts"
import { upload_files_to_storage } from "./upload_files_to_storage.ts"


Deno.serve(async req =>
{
    const server_secret = Deno.env.get("SERVER_SECRET")
    const supabase_service_role_level = Deno.env.get("SECRET_ROLE_UPLOAD_INTERACTABLE_FILES_KEY")
    if (!server_secret)
    {
        console.error("SERVER_SECRET not set in env")
        return respond(500, { ef_error: ERRORS.ERR18_upload_interactable.message })
    }

    if (!supabase_service_role_level)
    {
        console.error("SECRET_ROLE_UPLOAD_INTERACTABLE_FILES_KEY not set in env")
        return respond(500, { ef_error: ERRORS.ERR18_upload_interactable.message + " (supabase service role level access)" })
    }

    // Handle CORS
    if (req.method === "OPTIONS")
    {
        return new Response("ok", { headers: CORS_headers_sans_content_type })
    }

    try
    {
        // Get the Authorization: Bearer <token> header.
        const auth_header = req.headers.get("Authorization")
        // Type guard as this should have already been validated by Supabase
        if (!auth_header)
        {
            return respond(401, { ef_error: ERRORS.ERR28_upload_interactable.message })
        }

        // Make a supabase client using the auth_header so that RLS policies are applied.
        const supabase = deno_get_supabase_clients(auth_header, supabase_service_role_level)

        // Check auth token is valid by getting user
        const { data: { user }, error: user_error } = await supabase.user_or_anon.auth.getUser()
        if (user_error || !user)
        {
            console.error("Error getting user from auth header:", user_error)
            return respond(401, { ef_error: ERRORS.ERR28_upload_interactable.message } )
        }

        const files = await get_files_from_request(req)
        if (files instanceof Response) return files  // early return on error

        const upload_results = await upload_files_to_storage(supabase, files, server_secret)
        if (upload_results.error) return respond(500, { ef_error: ERRORS.ERR29_upload_interactable.message })

        const map_of_file_path_to_file_id = process_upload_results_to_map(upload_results.data)

        return new Response(map_of_file_path_to_file_id, {
            headers: { ...CORS_headers_sans_content_type, "Content-Type": "application/json" }
        })
    }
    catch (error)
    {
        console.error("Unexpected error in ef_upload_interactable_files:", error, (error as Error).stack)
        return respond(500, { ef_error: ERRORS.ERR29_upload_interactable.message } )
    }
})
