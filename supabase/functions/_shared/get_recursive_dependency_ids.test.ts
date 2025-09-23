/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"

import { IdAndVersion } from "../_core/src/data/id.ts"
import type { DataComponent } from "../_core/src/data/interface.ts"
import {
    data_component_all_fields_set,
    tiptap_mention_chip,
} from "../_core/src/test/fixtures.ts"
import {
    get_recursive_dependency_ids,
} from "./get_recursive_dependency_ids.ts"



Deno.test(`prepare_data_component_for_db_insert for undefined value_type`, async () =>
{
    const tiptap_component_1 = tiptap_mention_chip({ id: new IdAndVersion(1, 1), title: "Test" })
    const tiptap_component_2 = tiptap_mention_chip({ id: new IdAndVersion(2, 1), title: "Test" })

    const data_component: DataComponent = data_component_all_fields_set({
        value_type: undefined,
        input_value: `(1 + ${tiptap_component_1}) / ${tiptap_component_1} + ${tiptap_component_2}`,
    })

    const result = await get_recursive_dependency_ids(data_component)

    assertEquals(result, [
        new IdAndVersion(1, 1),
        new IdAndVersion(2, 1),
    ], `recursive_dependency_ids should contain both referenced ids but not duplicates`)
})
