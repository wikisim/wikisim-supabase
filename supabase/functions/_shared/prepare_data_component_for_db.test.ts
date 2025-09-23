/// <reference lib="deno.ns" />
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"

import { DataComponent } from "../_core/src/data/interface.ts"
import { data_component_all_fields_set } from "../_core/src/test/fixtures.ts"
import {
    prepare_data_component_for_db_insert,
    prepare_data_component_for_db_update,
} from "./prepare_data_component_for_db.ts"



Deno.test("prepare_data_component_for_db_insert", async () =>
{
    const data_component: DataComponent = data_component_all_fields_set()

    const result = await prepare_data_component_for_db_insert(data_component, () => Promise.resolve([]))

    assertEquals(result.p_id, data_component.id.id, "p_id should match expected value")
    assert(!("p_version_number" in result), "p_version_number should not be present")
    assertEquals(result.p_owner_id, data_component.owner_id, "p_owner_id should match expected value")
    assert(!("p_editor_id" in result), "p_editor_id should not be present")
    assert(!("p_created_at" in result), "p_created_at should not be present")
    assertEquals(result.p_comment, data_component.comment, "p_comment should match expected value")
    assertEquals(result.p_bytes_changed, data_component.bytes_changed, "p_bytes_changed should match expected value")
    assertEquals(result.p_version_type, data_component.version_type, "p_version_type should match expected value")
    assertEquals(result.p_value_number_display_type, data_component.value_number_display_type, "p_value_number_display_type should match expected value")
    assertEquals(result.p_value_number_sig_figs, data_component.value_number_sig_figs, "p_value_number_sig_figs should match expected value")
    assertEquals(result.p_version_rolled_back_to, data_component.version_rolled_back_to, "p_version_rolled_back_to should match expected value")
    assertEquals(result.p_title, data_component.title, "p_title should match expected value")
    assertEquals(result.p_description, data_component.description, "p_description should match expected value")
    assertEquals(result.p_label_ids, data_component.label_ids, "p_label_ids should match expected value")
    assertEquals(result.p_input_value, data_component.input_value, "p_input_value should match expected value")
    assertEquals(result.p_result_value, data_component.result_value, "p_result_value should match expected value")
    assertEquals(result.p_value_type, data_component.value_type, "p_value_type should match expected value")
    assertEquals(result.p_datetime_range_start, data_component.datetime_range_start!.toISOString(), "p_datetime_range_start should match expected value")
    assertEquals(result.p_datetime_range_end, data_component.datetime_range_end!.toISOString(), "p_datetime_range_end should match expected value")
    assertEquals(result.p_datetime_repeat_every, data_component.datetime_repeat_every, "p_datetime_repeat_every should match expected value")
    assertEquals(result.p_units, data_component.units, "p_units should match expected value")
    assertEquals(result.p_dimension_ids, data_component.dimension_ids!.map(d => d.to_str()), "p_dimension_ids should match expected value")
    assertEquals(result.p_function_arguments, no_ids(data_component.function_arguments), "p_function_arguments should match expected value")
    assertEquals(result.p_scenarios, no_ids(data_component.scenarios) as unknown, "p_scenarios should match expected value")

    assertEquals(data_component.title, "<p>Modified Title</p>", "Assert what component.title was")
    assertEquals(data_component.description, "<p>Modified Description</p>", "Assert what component.description was")
    assertEquals(result.p_plain_title, "Modified Title", "p_plain_title should be calculated from tiptap text")
    assertEquals(result.p_plain_description, "Modified Description", "p_plain_description should be calculated from tiptap text")
    assertEquals(result.p_test_run_id, "test_run_-789", "p_test_run_id should match expected value")
})


Deno.test("prepare_data_component_for_db_update", async () =>
{
    const data_component: DataComponent = data_component_all_fields_set()

    const result = await prepare_data_component_for_db_update(data_component, () => Promise.resolve([]))

    assertEquals(result.p_id, data_component.id.id, "p_id should match expected value")
    assertEquals(result.p_version_number, data_component.id.version, "p_version_number should match expected value")
    assert(!("p_owner_id" in result), "p_owner_id should not be present")
    assert(!("p_editor_id" in result), "p_editor_id should not be present")
    assert(!("p_created_at" in result), "p_created_at should not be present")
    assertEquals(result.p_comment, data_component.comment, "p_comment should match expected value")
    assertEquals(result.p_bytes_changed, data_component.bytes_changed, "p_bytes_changed should match expected value")
    assertEquals(result.p_version_type, data_component.version_type, "p_version_type should match expected value")
    assertEquals(result.p_value_number_display_type, data_component.value_number_display_type, "p_value_number_display_type should match expected value")
    assertEquals(result.p_value_number_sig_figs, data_component.value_number_sig_figs, "p_value_number_sig_figs should match expected value")
    assertEquals(result.p_version_rolled_back_to, data_component.version_rolled_back_to, "p_version_rolled_back_to should match expected value")
    assertEquals(result.p_title, data_component.title, "p_title should match expected value")
    assertEquals(result.p_description, data_component.description, "p_description should match expected value")
    assertEquals(result.p_label_ids, data_component.label_ids, "p_label_ids should match expected value")
    assertEquals(result.p_input_value, data_component.input_value, "p_input_value should match expected value")
    assertEquals(result.p_result_value, data_component.result_value, "p_result_value should match expected value")
    assertEquals(result.p_value_type, data_component.value_type, "p_value_type should match expected value")
    assertEquals(result.p_datetime_range_start, data_component.datetime_range_start!.toISOString(), "p_datetime_range_start should match expected value")
    assertEquals(result.p_datetime_range_end, data_component.datetime_range_end!.toISOString(), "p_datetime_range_end should match expected value")
    assertEquals(result.p_datetime_repeat_every, data_component.datetime_repeat_every, "p_datetime_repeat_every should match expected value")
    assertEquals(result.p_units, data_component.units, "p_units should match expected value")
    assertEquals(result.p_dimension_ids, data_component.dimension_ids!.map(d => d.to_str()), "p_dimension_ids should match expected value")
    assertEquals(result.p_function_arguments, no_ids(data_component.function_arguments), "p_function_arguments should match expected value")
    assertEquals(result.p_scenarios, no_ids(data_component.scenarios) as unknown, "p_scenarios should match expected value")

    assertEquals(data_component.title, "<p>Modified Title</p>", "Assert what component.title was")
    assertEquals(data_component.description, "<p>Modified Description</p>", "Assert what component.description was")
    assertEquals(result.p_plain_title, "Modified Title", "p_plain_title should be calculated from tiptap text")
    assertEquals(result.p_plain_description, "Modified Description", "p_plain_description should be calculated from tiptap text")
    assert(!("p_test_run_id" in result), "p_test_run_id should not be present")
})



Deno.test(`prepare_data_component_for_db_insert for undefined value_type`, async () =>
{
    const data_component: DataComponent = data_component_all_fields_set({
        value_type: undefined,
        input_value: "a + b",
        result_value: "123", // result_value should be left as-is by edge function
    })

    const result = await prepare_data_component_for_db_insert(data_component, () => Promise.resolve([]))

    assertEquals(result.p_result_value, "123", `p_result_value should be left as is when value_type is undefined as should default to "number" type`)
})


Deno.test(`prepare_data_component_for_db_insert for "function" value_type`, async () =>
{
    const data_component: DataComponent = data_component_all_fields_set({
        value_type: "function",
        input_value: "a + b",
        result_value: "", // result_value should be set by edge function
        function_arguments: [
            { id: 0, name: "a" },
            { id: 1, name: "b", default_value: "1" },
        ],
    })

    const result = await prepare_data_component_for_db_insert(data_component, () => Promise.resolve([]))

    assertEquals(result.p_result_value, "(a, b = 1) => a + b", "p_result_value should be calculated for function value_type")
})


function no_ids<T extends { id: number }>(items?: T[]): undefined | (Omit<T, "id">[])
{
    if (!items) return items

    return items.map(({ id: _, ...rest }) => rest)
}
