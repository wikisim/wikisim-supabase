import {
    DBDataComponentInsertV2Returns,
    DBDataComponentUpdateV2Returns,
} from "../_core/src/supabase/index.ts"



type EFInsertDataComponentV2Response =
{
    ef_data: DBDataComponentInsertV2Returns
    ef_error?: undefined
} | {
    ef_data?: undefined
    ef_error: string
}

type EFUpdateDataComponentV2Response =
{
    ef_data: DBDataComponentUpdateV2Returns
    ef_error?: undefined
} | {
    ef_data?: undefined
    ef_error: string
}

type EFUpsertReturn = DBDataComponentInsertV2Returns | DBDataComponentUpdateV2Returns | string


export const CORS_headers_sans_content_type = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const CORS_headers = {
    ...CORS_headers_sans_content_type,
    "Content-Type": "application/json",
}


export function respond(status: number, resp: EFInsertDataComponentV2Response | EFUpdateDataComponentV2Response)
{
    let body: EFUpsertReturn | undefined = undefined
    if (status < 400)
    {
        if (resp.ef_data !== undefined) body = resp.ef_data
    }
    else
    {
        if (resp.ef_error !== undefined) body = resp.ef_error
    }

    if (body === undefined)
    {
        status = 500
        console.error("Mismatched response and status code in ef_insert_data_component_v2:", resp, status)
        body = "ERR20. Internal server error - mismatched response and status code"
    }

    if (status >= 400)
    {
        return new Response(
            JSON.stringify({ code: status, message: body }),
            { status, headers: CORS_headers }
        )
    }

    return new Response(
        JSON.stringify(body),
        { status, headers: CORS_headers }
    )
}
