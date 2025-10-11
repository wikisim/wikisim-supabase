// Run with: deno run --allow-env --allow-net --allow-read supabase/migrations/2025_10_06_02_create_storage.js

import { contentType } from "jsr:@std/media-types"
import { createClient } from "npm:@supabase/supabase-js"

import {
    INTERACTABLES_FILES_BUCKET,
    MAX_INTERACTABLE_SIZE,
} from "../functions/_core/src/supabase/constants.ts"
import { hash_sha256_hex } from "../functions/_shared/deno_hash_file_content.ts"


// Initialize the Supabase client
const project_ref_id = "sfkgqscbwofiphfxhnxg"
const project_anonymous_key = "sb_publishable_XWsGRSpmju8qjodw4gIU8A_O_mHUR1H"
const project_service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const server_secret = Deno.env.get("SERVER_SECRET")
const access_token = Deno.env.get("ACCESS_TOKEN")
const refresh_token = Deno.env.get("REFRESH_TOKEN")
if (!project_service_role_key)
{
    throw new Error(`Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Get from https://supabase.com/dashboard/project/${project_ref_id}/settings/api-keys.`)
}
if (!server_secret)
{
    throw new Error(`Missing SERVER_SECRET environment variable. Get from ws_private.app_secrets table https://supabase.com/dashboard/project/${project_ref_id}/editor/848581.`)
}
if (!access_token)
{
    throw new Error(`Missing ACCESS_TOKEN environment variable. Get from signing into wikisim.org and then using JSON.parse(localStorage.getItem("sb-${project_ref_id}-auth-token")).access_token`)
}
if (!refresh_token)
{
    throw new Error(`Missing REFRESH_TOKEN environment variable. Get from signing into wikisim.org and then using JSON.parse(localStorage.getItem("sb-${project_ref_id}-auth-token")).refresh_token`)
}

const supabase_service_role = createClient(`https://${project_ref_id}.supabase.co`, project_service_role_key)
const supabase_user = createClient(`https://${project_ref_id}.supabase.co`, project_anonymous_key)
// Set the session using the access token
const set_auth = await supabase_user.auth.setSession({
    access_token,
    refresh_token,
})

if (set_auth.error)
{
    throw new Error(`Error setting auth session: ${set_auth.error.message}`)
}
console.log("set_auth successful for user id: ", set_auth.data.user.id)



async function create_bucket()
{
    const { data, error } = await supabase_service_role.storage.createBucket(INTERACTABLES_FILES_BUCKET, {
        public: true,
        fileSizeLimit: MAX_INTERACTABLE_SIZE.BYTES,
    })

    if (error) {
        console.error("Error creating bucket:", error.message)
    } else {
        console.log("Bucket created successfully:", data)
    }
}



async function upload_demo_interactable()
{
    async function upload_file(file_path)
    {
        try {
            await Deno.stat(file_path)
        } catch {
            console.error(`File "${file_path}" does not exist.`)
            return
        }

        const file_buffer = await Deno.readFile(file_path)
        // We do not include the file extension in the storage file name
        const file_hash_file_name = await hash_sha256_hex(file_buffer.buffer)

        console.log(`Uploading file "${file_path}" as "${file_hash_file_name}"...`)

        const { data, error } = await supabase_service_role.storage
        // const { data, error } = await supabase_user.storage
            .from(INTERACTABLES_FILES_BUCKET)
            .upload(file_hash_file_name, file_buffer, {
                contentType: contentType(file_path),
                upsert: false,
            })

        if (error) {
            console.error(`Error uploading file "${file_path}": `, error.message)
            return
        }
        console.log(`File "${file_path}" uploaded successfully: `, data)

        // Correct owner and owner_id in storage.objects table to match the user
        const { data: update_data, error: update_error } = await supabase_user
            .rpc("set_owner_of_file", {
                server_secret,
                file_id: data.id
            })

        if (update_error) {
            console.error(`Error updating owner for file "${file_path}": `, update_error.message)
            // Show roll back file upload too
            return
        }
        console.log(`Owner updated successfully for file "${file_path}": `, update_data)
    }


    await upload_file("./demo_interactable/index.html")
    await upload_file("./demo_interactable/script.js")
    await upload_file("./demo_interactable/style.css")
    await upload_file("./demo_interactable/assets/wikisim.png"),

    console.log("Demo files uploaded.")
}


async function post_demo_interactable()
{
    async function get_file_data(file_path)
    {
        try {
            await Deno.stat(file_path)
        } catch {
            console.error(`File "${file_path}" does not exist.`)
            return
        }

        const file_buffer = await Deno.readFile(file_path)

        return { file_path, file_buffer }
    }


    const files = [
        await get_file_data("./demo_interactable/index.html"),
        await get_file_data("./demo_interactable/script.js"),
        await get_file_data("./demo_interactable/style.css"),
        await get_file_data("./demo_interactable/assets/wikisim.png"),
    ]

    // Create FormData and append files
    const form_data = new FormData()
    files.forEach(file => {
        if (!file) return // type guard
        const blob = new Blob(
            [ file.file_buffer ],
            { type: contentType(file.file_path) }
        )
        form_data.append(file.file_path, blob)
    })


    // Do a normal HTTP post to http://0.0.0.0:8000/
    const response = await fetch("http://0.0.0.0:8000/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            // Note: Do not set Content-Type header when using FormData
            // otherwise the boundary will not be set and this will prevent
            // the form data from being parsed correctly.
            // "Content-Type": "multipart/form-data",
        },
        body: form_data,
    })

    console.log("Response status:", response.status)
    const response_data = await response.json()
    console.log("Response data:", response_data)
}


// create_bucket()
// create_bucket_rls_policies()
upload_demo_interactable()
// post_demo_interactable()
