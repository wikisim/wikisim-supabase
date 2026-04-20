// Shared between
// wikisim-supabase/supabase/functions/_shared/deno_get_content_type.ts
// wikisim-server/src/deno_get_content_type.ts

import { contentType } from "jsr:@std/media-types"

export function deno_get_content_type(file_path: string): string | undefined
{
    // contentType from std/media-types only accepts the file extension
    const file_extension = file_path.split(".").slice(-1)[0]
    // shx should map to application/x-shx
    return contentType(file_extension)
}
