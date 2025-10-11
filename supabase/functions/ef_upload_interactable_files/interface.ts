

export interface SupabaseUploadResponse
{
    id: string
    /** file name in bucket */
    path: string
    /** bucket name + file name in bucket */
    fullPath: string
}

export interface UploadResponse extends SupabaseUploadResponse
{
    file_path: string
}
