import { UploadResponse } from "./interface.ts"


export function process_upload_results_to_map(data: UploadResponse[])
{
    const map_of_file_path_to_file_id: Record<string, string> = {}
    data.forEach(uploaded_file =>
    {
        map_of_file_path_to_file_id[uploaded_file.file_path] = uploaded_file.id
    })

    return JSON.stringify(map_of_file_path_to_file_id)
}
