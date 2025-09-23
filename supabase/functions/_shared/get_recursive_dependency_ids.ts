import { IdAndVersion } from "../_core/src/data/id.ts"
import { DataComponent, NewDataComponent } from "../_core/src/data/interface.ts"
import { deno_get_referenced_ids_from_tiptap } from "./deno_get_referenced_ids_from_tiptap.ts"


interface GetRecursiveDependencyIdsArgs
{
    data_component: DataComponent | NewDataComponent
    get_data_component_by_id_and_version: (id_and_version: IdAndVersion) => Promise<DataComponent | undefined>
}
export async function get_recursive_dependency_ids(args: GetRecursiveDependencyIdsArgs): Promise<IdAndVersion[]>
{
    const ids = deno_get_referenced_ids_from_tiptap(args.data_component.input_value || "")

    await Promise.resolve() // only to satisfy deno-lint

    return ids
}
