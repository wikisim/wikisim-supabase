// Shared between
// wikisim-supabase/supabase/functions/_shared/deno_get_content_type.ts
// wikisim-server/src/deno_get_content_type.ts

// deno-lint-ignore no-import-prefix
import { contentType } from "jsr:@std/media-types@1.1.0"


export function deno_get_content_type(file_path: string): string | undefined
{
    // contentType from std/media-types only accepts the file extension
    const file_extension = file_path.split(".").slice(-1)[0]
    let content_type = contentType(file_extension)

    if (!content_type)
    {
        console.error(`Could not determine content type for file "${file_path}" with extension "${file_extension}"`)

        if (file_extension === "shx") content_type = "application/x-shx"
    }

    return content_type
}
