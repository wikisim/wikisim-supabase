
# WikiSim Supabase

[![Tests](https://github.com/wikisim/wikisim-supabase/actions/workflows/run_tests.yaml/badge.svg)](https://github.com/wikisim/wikisim-supabase/actions/workflows/run_tests.yaml)


Supabase migrations and edge functions for WikiSim, an open source platform for data, back of the envelope calculations, and models of complex problems.

## Dev

    git clone --recursive git@github.com:wikisim/wikisim-supabase.git

Install the deno CLI (see [./supabase/functions/README.md](./supabase/functions/README.md))

    pnpm install
    deno install
    pnpm test
    pnpm check

### Add a deno dependency

e.g. to add sentry for error tracking to the deno.lock file:

1. `deno install ...` e.g. `deno install npm:@sentry/deno`
2. `pnpm install`

Notes:

* Re-running `pnpm install` is needed to update the pnpm-lock.yaml file with the
new deno dependency which was added to the package.json.
* When importing this dependency into a file, you need to:
    * preceed it with `// deno-lint-ignore no-import-prefix`
    to avoid warnings about ` Inline 'npm:', 'jsr:' or 'https:' dependency not allowed
    Add it as a dependency in a deno.json or package.json instead and reference it
    here via its bare specifierdeno-lint(no-import-prefix)`
    * add the version number to the import statement, e.g. `import * as Sentry from "npm:@sentry/deno@1.2.3"`



### Pre-push Hook

If you want to ensure your tests, typescript compilation, and linting pass before pushing, you can set up a pre-push hook:
```bash
ln -s $(pwd)/scripts/pre-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

## Migrations

Migrations are currently applied manually via the Supabase web SQL REPL.

## Deployment

The Supabase edge functions should be deployed automatically on pushing to `main` via GitHub Actions.

See [./supabase/functions/README.md](./supabase/functions/README.md) for edge function deployment instructions.
