

// Hash file buffer using Web Crypto API
export async function hash_sha256_hex(buffer: ArrayBuffer): Promise<string>
{
    const hash_buffer = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(hash_buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}
