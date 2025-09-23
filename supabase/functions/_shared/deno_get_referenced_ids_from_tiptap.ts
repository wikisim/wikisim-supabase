import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

import { IdAndVersion } from "../_core/src/data/id.ts"
import {
    shared_get_referenced_ids_from_tiptap,
} from "../_core/src/rich_text/shared_get_referenced_ids_from_tiptap.ts"


export function deno_get_referenced_ids_from_tiptap(tiptap_text: string): IdAndVersion[]
{
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const parser = new DOMParser()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return shared_get_referenced_ids_from_tiptap(parser, tiptap_text)
}
