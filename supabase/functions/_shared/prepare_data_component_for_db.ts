import {
    flatten_data_component_to_json,
    flatten_new_data_component_to_json,
} from "../_core/src/data/convert_between_json.ts"
import {
    DataComponent,
    is_data_component,
    NewDataComponent,
} from "../_core/src/data/interface.ts"
import { ERRORS } from "../_core/src/errors.ts"
import { calculate_result_value } from "../_core/src/evaluator/index.ts"
import type {
    DBDataComponentInsertV2ArgsComponent,
    DBDataComponentUpdateV2ArgsComponent,
} from "../_core/src/supabase/index.ts"
import {
    deno_convert_tiptap_to_javascript,
} from "./deno_convert_tiptap_to_javascript.ts"
import {
    deno_convert_tiptap_to_plain_text,
} from "./deno_convert_tiptap_to_plain.ts"
import { get_recursive_dependency_ids } from "./get_recursive_dependency_ids.ts"
import { GetPartialDataComponentsByIdAndVersion } from "./interface.ts"



export async function prepare_data_component_for_db_insert (
    data_component: DataComponent | NewDataComponent,
    get_data_components_by_id_and_version: GetPartialDataComponentsByIdAndVersion,
): Promise<DBDataComponentInsertV2ArgsComponent>
{
    const recursive_dependency_ids = await get_recursive_dependency_ids({ data_component, get_data_components_by_id_and_version })
    data_component.recursive_dependency_ids = recursive_dependency_ids

    const result_value_response = await calculate_result_value({
        component: data_component,
        data_components_by_id_and_version: {},
        convert_tiptap_to_javascript: deno_convert_tiptap_to_javascript,
        evaluate_code_in_sandbox: undefined,
    })

    if (result_value_response?.error)
    {
        console.error("Error calculating result value:", result_value_response.error)
        throw ERRORS.ERR27
    }
    const p_result_value = result_value_response?.result ?? null

    const row = is_data_component(data_component)
        ? flatten_data_component_to_json(data_component)
        : flatten_new_data_component_to_json(data_component)

    let p_id: number | null = null
    if ("id" in row) p_id = row.id

    const p_plain_title = deno_convert_tiptap_to_plain_text(row.title)
    const p_plain_description = deno_convert_tiptap_to_plain_text(row.description)

    const args: DBDataComponentInsertV2ArgsComponent = {
        p_owner_id: row.owner_id,
        p_comment: row.comment,
        p_bytes_changed: row.bytes_changed,
        p_version_type: row.version_type,
        p_version_rolled_back_to: row.version_rolled_back_to,
        p_title: row.title,
        p_description: row.description,
        p_label_ids: row.label_ids,
        p_input_value: row.input_value,
        p_result_value,
        p_recursive_dependency_ids: row.recursive_dependency_ids,
        p_value_type: row.value_type,
        p_value_number_display_type: row.value_number_display_type,
        p_value_number_sig_figs: row.value_number_sig_figs,
        p_datetime_range_start: row.datetime_range_start,
        p_datetime_range_end: row.datetime_range_end,
        p_datetime_repeat_every: row.datetime_repeat_every,
        p_units: row.units,
        p_dimension_ids: row.dimension_ids,
        p_function_arguments: row.function_arguments,
        p_scenarios: row.scenarios,
        p_plain_title,
        p_plain_description,
        p_test_run_id: row.test_run_id,
        p_id,
    }

    return args
}



export async function prepare_data_component_for_db_update (
    data_component: DataComponent,
    get_data_components_by_id_and_version: GetPartialDataComponentsByIdAndVersion,
): Promise<DBDataComponentUpdateV2ArgsComponent>
{
    const {
        // deno-lint-ignore no-unused-vars
        p_test_run_id, p_id, p_owner_id,
        ...insert_args
    } = await prepare_data_component_for_db_insert(data_component, get_data_components_by_id_and_version)

    const args: DBDataComponentUpdateV2ArgsComponent = {
        ...insert_args,
        p_id: data_component.id.id,
        p_version_number: data_component.id.version,
    }

    return args
}
