# Supabase Edge Function Deployment Guide

Suggest installing Denoland extension for Deno support in VS Code: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno

## Prerequisites
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login to Supabase: `supabase login`
3. Link the project: `supabase link --project-ref sfkgqscbwofiphfxhnxg`

## Deploy the Edge Function

From the project root, run:
```bash
supabase functions deploy compute_field_values
```

## Test the Function

```bash
curl -X POST 'https://sfkgqscbwofiphfxhnxg.supabase.co/functions/v1/compute_field_values' \
  -H 'Authorization: Bearer PROJECT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "batch": [
      {
        "id": "1",
        "title": "<h1>Title</h1>",
        "description": "<p>Description <em>text</em></p>"
      }
    ]
  }'
```

## Environment Variables (if needed)
Create a `.env.local` file in your functions directory:
```
CUSTOM_VAR=value
```

## Adding JavaScript Dependencies
To add npm packages to your Edge Function:

1. Create an `import_map.json` file:
```json
{
  "imports": {
    "tiptap": "https://esm.sh/@tiptap/core@2.0.0"
  }
}
```

2. Update your function to use the import map:
```typescript
// At the top of index.ts
import { Editor } from "tiptap"
```

3. Deploy with the import map:
```bash
supabase functions deploy compute_field_values --import-map ./import_map.json
```

## Performance Considerations
- Edge Functions may have a 30-second timeout
- Functions may auto-scale based on demand
- Cold starts may add ~100-200ms latency
