import { FormFile } from "https://deno.land/x/multiparser@0.114.0/mod.ts"

import { INTERACTABLES_FILES_BUCKET } from "../_core/src/supabase/constants.ts"
import { deno_get_content_type } from "../_shared/deno_get_content_type.ts"
import { SupabaseClients } from "../_shared/deno_get_supabase.ts"
import { hash_sha256_hex } from "../_shared/deno_hash_file_content.ts"
import { SupabaseUploadResponse, UploadResponse } from "./interface.ts"


interface UploadResult
{
    data: UploadResponse[]
    error: boolean
}
export async function upload_files_to_storage(supabase: SupabaseClients, files: FormFile[], server_secret: string): Promise<UploadResult>
{
    console.log(`Uploading ${files.length} files to storage...`, files.map(f => ({ name: f.name, size: f.size, type: f.contentType })))

    const upload_results: UploadResponse[] = []
    for (const file of files)
    {
        const file_path = file.name
        const result = await upload_file(file_path, file.content.buffer as ArrayBuffer, supabase, server_secret)

        if (result) upload_results.push({ file_path, ...result })
        else return { data: upload_results, error: true }  // early return on error
    }

    return { data: upload_results, error: false }
}


async function upload_file(file_path: string, file_buffer: ArrayBuffer, supabase: SupabaseClients, server_secret: string): Promise<SupabaseUploadResponse | undefined>
{
    // We do not include the file extension in the storage file name
    const file_hash_filename = await hash_sha256_hex(file_buffer)

    console.log(`Uploading file "${file_path}" as "${file_hash_filename}"...`)

    let { data, error } = await supabase.service_role.storage
    // const { data, error } = await supabase_user.storage
        .from(INTERACTABLES_FILES_BUCKET)
        .upload(file_hash_filename, file_buffer, {
            contentType: deno_get_content_type(file_path),
            upsert: false,
        })


    if (error)
    {
        // For some reason the type definitions for error are wrong and do not
        // include the statusCode or error properties
        // deno-lint-ignore no-explicit-any
        if ((error as any).statusCode === "409" && error.message === "The resource already exists")
        {
            // 409 is file already exists, which is ok
            // We will just return the existing file ID below
            console.log(`File "${file_path}" is duplicate of previous successful upload`)
        }
        else
        {
            console.error(`Error uploading file "${file_path}": `, error.message)
            return undefined
        }
    }
    else console.log(`File "${file_path}" uploaded successfully: `, data)


    if (data)
    {
        // Correct owner and owner_id in storage.objects table to match the user
        const { data: update_data, error: update_error } = await supabase.user_or_anon
            .rpc("set_owner_of_file", {
                server_secret,
                file_id: data.id
            })

        if (update_error)
        {
            console.error(`Error updating owner for file "${file_path}": `, update_error.message)
            // Should we roll back file upload otherwise owner will never be set?
            return undefined
        }
        console.log(`Owner updated successfully for file "${file_path}": `, update_data)
    }
    else
    {
        // We need to get the file info if it was a duplicate
        const { data: file_metadatas, error: file_metadata_error } = await supabase.user_or_anon
            .from("public_storage_files_metadata")
            .select("file_id")
            .eq("file_hash_filename", file_hash_filename)
            .limit(1)

        if (file_metadata_error || !file_metadatas || file_metadatas.length === 0)
        {
            console.error(`Error fetching metadata for duplicate file "${file_path}": `, file_metadata_error?.message)
            return undefined
        }
        data = {
            id: file_metadatas[0].file_id,
            path: file_hash_filename,
            fullPath: INTERACTABLES_FILES_BUCKET + "/" + file_hash_filename,
        }
    }

    return data
}
