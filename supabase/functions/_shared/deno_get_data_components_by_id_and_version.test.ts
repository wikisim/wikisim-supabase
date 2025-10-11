/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "@std/assert"

import { IdAndVersion } from "../_core/src/data/id.ts"
import { ERRORS } from "../_core/src/errors.ts"
import {
    factory_get_data_components_by_id_and_version,
} from "./deno_get_data_components_by_id_and_version.ts"
import { PartialDataComponent } from "./interface.ts"


function make_mock_supabase({ data, error }: { data: any, error: any })
{
    return {
        from: () => ({
            select: () => ({
                or: () => Promise.resolve({ data, error }),
            }),
        }),
    } as any
}


Deno.test("returns undefined if input is empty", async () =>
{
    const supabase = make_mock_supabase({ data: [], error: null })
    const get_data_components_by_id_and_version = factory_get_data_components_by_id_and_version(supabase)
    const result = await get_data_components_by_id_and_version([])
    assertEquals(result, [])
})


Deno.test("returns correct PartialDataComponent array if Supabase returns matching data", async () =>
{
    const id_and_versions = [new IdAndVersion(1, 2), new IdAndVersion(3, 4)]
    const supabase = make_mock_supabase({
        data: [
            { id: 1, version_number: 2, value_type: "number", recursive_dependency_ids: ["5v1"] },
            { id: 3, version_number: 4, value_type: "string", recursive_dependency_ids: [] },
        ],
        error: null,
    })
    const get_data_components_by_id_and_version = factory_get_data_components_by_id_and_version(supabase)
    const result = await get_data_components_by_id_and_version(id_and_versions)
    assertEquals(result.length, 2)
    assertEquals(result[0]!.id.id, 1)
    assertEquals(result[0]!.id.version, 2)
    assertEquals(result[0]!.value_type, "number")
    assertEquals(result[0]!.recursive_dependency_ids![0]!.id, 5)
    assertEquals(result[1]!.id.id, 3)
    assertEquals(result[1]!.id.version, 4)
    assertEquals(result[1]!.value_type, "string")
    assertEquals(result[1]!.recursive_dependency_ids, undefined)
})


Deno.test("throws error if Supabase returns error", async () =>
{
    const id_and_versions = [new IdAndVersion(1, 2)]
    const supabase = make_mock_supabase({ data: null, error: { message: "db error" } })
    const get_data_components_by_id_and_version = factory_get_data_components_by_id_and_version(supabase)

    await async_assert_throws(
        () => get_data_components_by_id_and_version(id_and_versions),
        Error,
        ERRORS.ERR37.message,
    )
})


Deno.test("throws error if Supabase returns fewer results than requested", async () =>
{
    const id_and_versions = [new IdAndVersion(1, 2), new IdAndVersion(3, 4)]
    const supabase = make_mock_supabase({
        data: [
            { id: 1, version_number: 2, value_type: "number", recursive_dependency_ids: [] },
        ],
        error: null,
    })
    const get_data_components_by_id_and_version = factory_get_data_components_by_id_and_version(supabase)

    await async_assert_throws(
        () => get_data_components_by_id_and_version(id_and_versions),
        Error,
        ERRORS.ERR38.message,
    )
})


async function async_assert_throws(
    func: () => Promise<PartialDataComponent[]>,
    Error: ErrorConstructor,
    message: string
): Promise<void>
{
    let error: any = null
    try
    {
        await func()
        throw new Error("Expected error was not thrown")
    }
    catch (e)
    {
        error = e
    }
    assertEquals(error, message)
}
