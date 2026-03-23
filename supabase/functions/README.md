# Supabase Edge Function Deployment Guide

Suggest installing Denoland extension for Deno support in VS Code: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
Which also needs the deno CLI: https://deno.land/manual/getting_started/installation
Deno, should already be enabled for this workspace (via .vscode/settings.json)

## Local dev problems

May need to store dependencies manually in the deno cache with:
```bash
deno cache https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts
```

## Prerequisites
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login to Supabase: `supabase login` when prompted, enter your access token from https://app.supabase.com/account/tokens (create one if you haven't already and then store it securely locally)
3. Check it worked: `supabase projects list`
4. Link the project: `supabase link --project-ref sfkgqscbwofiphfxhnxg`

## Call the Function Locally

todo

## Deploy the Edge Functions

### Automated Deployment via GitHub Actions

Edge functions are automatically deployed when pushing to the `main` branch after all tests and linting pass. The deployment workflow is defined in `.github/workflows/run_tests_deploy.yaml`.

#### Required GitHub Secrets

Add the following secrets to: https://github.com/wikisim/wikisim-supabase/settings/secrets/actions

| Secret Name                   | Description                                                                    | Where to get it                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_ACCESS_TOKEN`       | Personal access token for authenticating the Supabase CLI                      | https://app.supabase.com/account/tokens — create a new token and store it securely                                             |
| `SUPABASE_EDGE_SERVER_SECRET` | Runtime secret used by edge functions to authenticate internal server calls    | Retrieved from the `ws_private.app_secrets` table in the database                                                              |
| `SUPABASE_EDGE_UPLOAD_KEY`    | API key granting the upload-interactable-files edge function access to storage | Supabase Dashboard → Project Settings → API Keys https://supabase.com/dashboard/project/sfkgqscbwofiphfxhnxg/settings/api-keys |

### Manual Deployment

To deploy all edge functions from the project root, run:
```bash
supabase secrets set --env-file .env
supabase functions deploy
```

## Call the Function in Production

```bash
curl -X POST 'https://sfkgqscbwofiphfxhnxg.supabase.co/functions/v1/ef_insert_data_component_v2' \
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
Create a `.env` file in your functions directory by renaming the `.env*.placeholder`
files and then populate them with the appropriate values.

## Performance Considerations
- Edge Functions may have a 30-second timeout
- Functions may auto-scale based on demand
- Cold starts may add ~100-200ms latency
