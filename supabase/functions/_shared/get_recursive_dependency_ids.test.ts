/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"

import { IdAndVersion } from "../_core/src/data/id.ts"
import type { DataComponent } from "../_core/src/data/interface.ts"
import {
    data_component_all_fields_set,
    tiptap_mention_chip
} from "../_core/src/test/fixtures.ts"
import {
    get_recursive_dependency_ids,
} from "./get_recursive_dependency_ids.ts"



Deno.test(`get_recursive_dependency_ids`, async () =>
{
    const partial_data_components: Partial<DataComponent>[] = [
        {
            id: new IdAndVersion(1, 1),
            value_type: undefined,
            input_value: "<p>1</p>",
            result_value: "1",
            recursive_dependency_ids: [],
        },
        {
            id: new IdAndVersion(2, 1),
            value_type: "number",
            input_value: "<p>2</p>",
            result_value: "2",
            recursive_dependency_ids: [],
        },
        {
            id: new IdAndVersion(3, 1),
            value_type: "number",
            input_value: "3 + tiptap1 + tiptap2",
            result_value: "6",
            recursive_dependency_ids: [
                new IdAndVersion(1, 1),
                new IdAndVersion(2, 1),
            ],
        },
        {
            id: new IdAndVersion(4, 1),
            value_type: "function",
            input_value: "4 + tiptap1 + tiptap3",
            result_value: "() => 4 + d1v1 + d3v1", // result == 11
            recursive_dependency_ids: [
                new IdAndVersion(1, 1),
                // id2 should not be included as not referenced directly and
                // id1 & id3 result_value are numbers who are already computed
                // so do not need to reference id2 to get its result_value
                // new IdAndVersion(2, 1),
                new IdAndVersion(3, 1),
            ],
        },
        {
            id: new IdAndVersion(5, 1),
            value_type: "function",
            input_value: "5 + tiptap4() ", // result == 16
            recursive_dependency_ids: [
                // id1 and id3 should be included as referenced indirectly via id4
                new IdAndVersion(1, 1),
                new IdAndVersion(3, 1),
                // Again id2 should not be included as not referenced directly or indirectly
                // new IdAndVersion(2, 1),
                new IdAndVersion(4, 1),
            ],
        },
        {
            id: new IdAndVersion(6, 1),
            value_type: "number",
            input_value: "6 + tiptap5() ",
            result_value: "22",
            recursive_dependency_ids: [
                // When value_type is not "function" then we're storing the
                // direct dependencies only, not indirect ones, to make it
                // easier later on to build a dependency graph of data
                // components.
                new IdAndVersion(5, 1),
            ],
        },
    ]


    const data_components: DataComponent[] = []
    partial_data_components.forEach(dc =>
    {
        dc.input_value = dc.input_value!.replaceAll(/tiptap(\d+)/g, (_match, id_num_str) =>
        {
            const ref_id = parseInt(id_num_str)
            return tiptap_mention_chip({ id: new IdAndVersion(ref_id, 1), title: `title ${ref_id}` })
        })

        data_components.push(data_component_all_fields_set(dc))
    })

    function get_data_components_by_id_and_version(id_and_versions: IdAndVersion[]): Promise<DataComponent[]>
    {
        const data_components_found: DataComponent[] = id_and_versions
            .map(id_and_version =>
            {
                return data_components.find(dc => dc.id.to_str() === id_and_version.to_str())
            })
            .filter((dc): dc is DataComponent => !!dc)
        return Promise.resolve(data_components_found)
    }

    for (const data_component of data_components)
    {
        const result = await get_recursive_dependency_ids({ data_component, get_data_components_by_id_and_version })

        assertEquals(result, data_component.recursive_dependency_ids || [], `recursive_dependency_ids should match expected for data_component id ${data_component.id}`)
    }
})
