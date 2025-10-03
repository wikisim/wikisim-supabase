import { z } from "npm:zod"

import {
    hydrate_data_component_from_json,
} from "../_core/src/data/convert_between_json.ts"
import { make_field_validators } from "../_core/src/data/validate_fields.ts"
import { ERRORS } from "../_core/src/errors.ts"
import type {
    EFInsertDataComponentV2Args,
} from "../_core/src/supabase/edge_functions.ts"
import {
    factory_get_data_components_by_id_and_version,
} from "../_shared/deno_get_data_components_by_id_and_version.ts"
import { deno_get_supabase } from "../_shared/deno_get_supabase.ts"
import {
    prepare_data_component_for_db_insert,
} from "../_shared/prepare_data_component_for_db.ts"
import { CORS_headers_sans_content_type, respond } from "../_shared/respond.ts"


type SupabaseClient = ReturnType<typeof deno_get_supabase>


const field_validators = make_field_validators(z)


Deno.serve(async req =>
{
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
            return respond(401, { ef_error: ERRORS.ERR28.message })
        }

        // Make a supabase client using the auth_header so that RLS policies are applied.
        const supabase = deno_get_supabase(auth_header)

        const payload = await req.json()

        return await save_to_db(supabase, payload)
    }
    catch (error)
    {
        console.error("Unexpected error in ef_insert_data_component_v2:", error, (error as Error).stack)
        return respond(500, { ef_error: ERRORS.ERR29_insert.message } )
    }
})



async function save_to_db(supabase: SupabaseClient, payload: EFInsertDataComponentV2Args): Promise<Response>
{
    const { batch } = payload
    const invalid_request_format = !batch || !Array.isArray(batch)
    const invalid_request_number_of_items = !invalid_request_format && (batch.length === 0 || batch.length > 10)
    if (invalid_request_format || invalid_request_number_of_items)
    {
        const ef_error = invalid_request_format
            ? ERRORS.ERR16_insert.message
            : ERRORS.ERR17_insert.message
        return respond(400, { ef_error })
    }

    const get_data_components_by_id_and_version = factory_get_data_components_by_id_and_version(supabase)

    // Handle batch conversion (for efficiency when processing multiple items)
    const component_promises = batch
        .map(r => hydrate_data_component_from_json(r, field_validators))
        .map(r => prepare_data_component_for_db_insert(r, get_data_components_by_id_and_version))
    const components = await Promise.all(component_promises)


    const server_secret = Deno.env.get("SERVER_SECRET")
    if (!server_secret) return respond(500, { ef_error: ERRORS.ERR18_insert.message })


    const response = await supabase.rpc("insert_data_component_v2", { components, server_secret })

    const { error: rpc_error, data: rpc_data } = response
    if (rpc_error)
    {
        console.error("Error inserting data component:", rpc_error)
        let error_message = `${rpc_error.message}`
        if (!error_message.startsWith("ERR")) error_message = ERRORS.ERR19_insert.message // Do not expose to public + error_message
        return respond(response.status || 500, { ef_error: error_message })
    }

    return respond(200, { ef_data: rpc_data } )
}
