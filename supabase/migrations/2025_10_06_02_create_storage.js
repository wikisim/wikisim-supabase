// Run with: deno run --allow-env --allow-net --allow-read supabase/migrations/2025_10_06_02_create_storage.js

import { createClient } from "npm:@supabase/supabase-js"

import {
    INTERACTABLES_FILES_BUCKET,
    MAX_INTERACTABLE_SIZE,
    project_ref_id,
} from "../functions/_core/src/supabase/constants.ts"


// Initialize the Supabase client
// Could use service role key or one of the secret API keys like
// `SECRET_ROLE_UPLOAD_INTERACTABLE_FILES_KEY`
const project_service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
if (!project_service_role_key)
{
    throw new Error(`Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Get from https://supabase.com/dashboard/project/${project_ref_id}/settings/api-keys.`)
}

const supabase_service_role = createClient(`https://${project_ref_id}.supabase.co`, project_service_role_key)

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

create_bucket()
