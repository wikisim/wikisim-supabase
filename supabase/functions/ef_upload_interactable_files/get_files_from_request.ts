import { FormFile, multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts"

import { ERRORS } from "../_core/src/errors.ts"
import { MAX_INTERACTABLE_SIZE } from "../_core/src/supabase/constants.ts"
import { respond } from "../_shared/respond.ts"


type GetFilesFromRequestReturn = Response | FormFile[]
export async function get_files_from_request(req: Request): Promise<GetFilesFromRequestReturn>
{
    const payload = await multiParser(req)
    // Check payload and payload.files exist
    if (!payload || !payload.files)
    {
        return respond(400, { ef_error: ERRORS.ERR43.message } )
    }

    const { files: files_multipart_form } = payload

    // Check files are all FormFile and not arrays
    const files1 = Object.values(files_multipart_form)// as unknown as FormFile[]
    const files: FormFile[] = []
    for (const file_or_files of files1)
    {
        if (Array.isArray(file_or_files))
        {
            console.error("files_map has arrays in it:", files_multipart_form)
            return respond(400, { ef_error: ERRORS.ERR44.message + ` Got map containing list of length ${file_or_files.length}` } )
        }
        files.push(file_or_files)
    }

    // Check total size of files is within limits
    let total_size = 0
    files.forEach(file =>
    {
        total_size += file.size
    })
    if (total_size > MAX_INTERACTABLE_SIZE.BYTES)
    {
        console.error("Total file size exceeds limit:", total_size, "bytes")
        return respond(400, { ef_error: ERRORS.ERR45.message.replace("%", MAX_INTERACTABLE_SIZE.MEGA_BYTES.toString()) } )
    }

    return files
}
