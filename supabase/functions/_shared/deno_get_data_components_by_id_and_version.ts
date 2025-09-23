import { hydrate_list_of_ids } from "../_core/src/data/convert_between_json.ts"
import { make_or_clause_for_ids } from "../_core/src/data/fetch_from_db_utils.ts"
import { IdAndVersion } from "../_core/src/data/id.ts"
import { ValueType } from "../_core/src/data/interface.ts"
import { ERRORS } from "../_core/src/errors.ts"
import type { SupabaseClient } from "./deno_get_supabase.ts"
import { PartialDataComponent } from "./interface.ts"



export function factory_get_data_components_by_id_and_version(supabase: SupabaseClient)
{
    const get_data_components_by_id_and_version = async (id_and_versions: IdAndVersion[]): Promise<PartialDataComponent[]> =>
    {
        if (id_and_versions.length === 0) return []

        const { data, error } = await supabase
            .from("data_components_history")
            .select("id, version_number, value_type, recursive_dependency_ids")
            .or(make_or_clause_for_ids(id_and_versions))

        if (error)
        {
            console.error("Error fetching data components by id and version:", error)
            throw ERRORS.ERR37.message
        }

        if (data.length !== id_and_versions.length)
        {
            console.error("Some data components not found:", { requested: id_and_versions, found: data })
            throw ERRORS.ERR38.message
        }

        const partial_dcs: PartialDataComponent[] = data.map(dc => ({
            id: new IdAndVersion(dc.id, dc.version_number),
            value_type: dc.value_type as ValueType,
            recursive_dependency_ids: hydrate_list_of_ids(dc.recursive_dependency_ids),
        }))

        return partial_dcs
    }

    return get_data_components_by_id_and_version
}
