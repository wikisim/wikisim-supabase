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

* Run `supabase start`
* Go to the SQL Editor at http://127.0.0.1:54323 and run `INSERT INTO ws_private.app_secrets (key_name) VALUES ('server_secret');` to generate a new server secret.
* Run `SELECT * FROM ws_private.app_secrets;` and copy and paste the secret_value into the `supabase/functions/.env` file for the edge functions
* Run `supabase stop && supabase start`
* To find the email login links, visit http://127.0.0.1:54324
* ~~To find edge function logs, visit Supabase Studio at http://127.0.0.1:54323/project/default/logs/edge-functions-logs~~
* To serve functions locally (with live logs in terminal):
    * `supabase functions serve`
    <!-- * `supabase functions serve --inspect-mode brk` to enable debugging (see below) -->

<!-- ## Debugging Edge Functions

### Command line (inspect mode)

Run the function server with the V8 inspector enabled:
```bash
supabase functions serve --inspect-mode brk
```
* `brk` — pauses on the first line until a debugger attaches (also respects `debugger` statements)
* `detach` — starts the inspector without pausing (useful for attaching mid-flight)

The inspector listens on port **8083**.

### VS Code debugger

1. Place a `debugger` statement (or a breakpoint via the gutter) in your edge function code.
2. Run `supabase functions serve --inspect-mode brk` in the terminal.
3. In VS Code, open the **Run and Debug** panel and launch **"Attach to Supabase Functions"**.
4. VS Code will attach on port 8083 and break at the first `debugger` statement or breakpoint.

> Note: each time a function is invoked it spawns a new isolate — you may need to re-attach after the first breakpoint resolves. -->

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
| `SENTRY_DSN_WIKISIM_SUPABASE`    | Sentry DSN key allowing server to post errors to Sentry | Value from https://wikisim.sentry.io/settings/projects/wikisim-supabase/keys/ |

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
