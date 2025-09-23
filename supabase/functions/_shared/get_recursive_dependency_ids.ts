import { IdAndVersion } from "../_core/src/data/id.ts"
import { DataComponent, NewDataComponent } from "../_core/src/data/interface.ts"
import { deno_get_referenced_ids_from_tiptap } from "./deno_get_referenced_ids_from_tiptap.ts"


export async function get_recursive_dependency_ids(data_component: DataComponent | NewDataComponent): Promise<IdAndVersion[]>
{
    const ids = deno_get_referenced_ids_from_tiptap(data_component.input_value || "")

    await Promise.resolve() // only to satisfy deno-lint

    return ids
}
