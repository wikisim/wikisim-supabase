
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
