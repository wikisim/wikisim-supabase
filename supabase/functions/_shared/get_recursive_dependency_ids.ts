import { IdAndVersion, OrderedUniqueIdAndVersionList } from "../_core/src/data/id.ts"
import { DataComponent, NewDataComponent } from "../_core/src/data/interface.ts"
import { deno_get_referenced_ids_from_tiptap } from "./deno_get_referenced_ids_from_tiptap.ts"
import { PartialDataComponent } from "./interface.ts"


interface GetRecursiveDependencyIdsArgs
{
    data_component: DataComponent | NewDataComponent
    get_data_components_by_id_and_version: (id_and_versions: IdAndVersion[]) => Promise<PartialDataComponent[]>
}
export async function get_recursive_dependency_ids(args: GetRecursiveDependencyIdsArgs): Promise<IdAndVersion[]>
{
    const direct_ids = deno_get_referenced_ids_from_tiptap(args.data_component.input_value || "")

    const referenced_data_components_by_id: Record<string, PartialDataComponent> = {}
    if (args.data_component.value_type === "function")
    {
        const referenced_data_components = await args.get_data_components_by_id_and_version(direct_ids)
        for (const dc of referenced_data_components)
        {
            if (!dc) continue
            referenced_data_components_by_id[dc.id.to_str()] = dc
        }

    }

    const all_ids = new OrderedUniqueIdAndVersionList()

    for (const id of direct_ids)
    {
        const referenced_dc = referenced_data_components_by_id[id.to_str()]
        if (
            referenced_dc
            && referenced_dc.recursive_dependency_ids?.length
            // Only include recursive dependencies of functions as other types
            // should have their result_value already computed.
            && referenced_dc.value_type === "function"
        )
        {
            for (const rec_id of referenced_dc.recursive_dependency_ids)
            {
                all_ids.add(rec_id)
            }
        }

        all_ids.add(id)
    }

    return all_ids.get_all()
}
