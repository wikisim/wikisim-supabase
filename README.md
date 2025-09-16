
# WikiSim Supabase

[![Tests](https://github.com/wikisim/wikisim-supabase/actions/workflows/run_tests.yaml/badge.svg)](https://github.com/wikisim/wikisim-supabase/actions/workflows/run_tests.yaml)


Supabase migrations and edge functions for WikiSim, an open source platform for data, back of the envelope calculations, and models of complex problems.

## Dev

    git clone --recursive git@github.com:wikisim/wikisim-supabase.git
    pnpm test
    pnpm install
    pnpm check

### Setup

If developing in VisualStudioCode you will need to set it up to use the workspace
version of typescript:
1. open a typescript file
2. open the command palette (Cmd+Shift+P on Mac)
3. type "TypeScript: Select TypeScript Version"
4. select "Use Workspace Version"
5. restart the typescript server (Cmd+Shift+P, "TypeScript: Restart TS Server")

### Pre-push Hook

If you want to ensure your tests, typescript compilation, and linting pass before pushing, you can set up a pre-push hook:
```bash
ln -s $(pwd)/scripts/pre-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```
