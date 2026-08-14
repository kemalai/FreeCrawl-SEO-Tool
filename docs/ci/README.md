# CI/CD Integration

Run FreeCrawl's headless CLI as a quality gate in your pipeline — crawl a
deploy, fail the build on broken links, validate the sitemap, and catch SEO
regressions between releases.

Two ready-to-adapt templates live next to this file:

| File                                                         | Platform       |
| ------------------------------------------------------------ | -------------- |
| [`github-actions-example.yml`](./github-actions-example.yml) | GitHub Actions |
| [`gitlab-ci-example.yml`](./gitlab-ci-example.yml)           | GitLab CI/CD   |

Both crawl `TARGET_URL`, fail when 4xx/5xx URLs exceed `BROKEN_LINK_THRESHOLD`,
validate the sitemap (advisory), and upload the crawl as an artifact.

## How the CLI is built in CI

The runner clones the source and builds only the CLI and the packages it
imports:

```bash
npm ci --ignore-scripts        # skip the Playwright download — undici crawl needs no Chromium
npx tsc -b apps/cli            # builds shared-types → db → core → cli via project references
node apps/cli/dist/index.js <url> [options]
```

> `npm run build:cli` compiles **only** `apps/cli` and does **not** build the
> workspace packages the CLI imports, so the crawl would fail to resolve
> `@freecrawl/core` at runtime. Use `npx tsc -b apps/cli`, which follows the
> project references and builds the dependency graph in order — while skipping
> the heavy Electron desktop build. Drop `--ignore-scripts` only if you enable
> JS rendering via a `--config` file (that path needs Chromium).

## Exit-code contract

Every command returns a CI-friendly exit code, so most gates need no scripting:

| Command                    | `0`                | `1`                                                                   | `2`                      |
| -------------------------- | ------------------ | --------------------------------------------------------------------- | ------------------------ |
| `<url>` (crawl)            | clean — no 4xx/5xx | a 4xx/5xx was found, the seed was unreachable, or nothing was fetched | —                        |
| `compare <before> <after>` | no differences     | at least one diff category is non-zero                                | a project failed to open |
| `validate-sitemap <url>`   | valid              | validation warnings                                                   | fetch failure            |
| `audit-robots <url>`       | URL allowed        | URL disallowed                                                        | invalid URL              |

## Gate variants

**Zero-tolerance (no script).** Let the crawl's own exit code fail the step —
any 4xx/5xx fails the build:

```yaml
- run: node apps/cli/dist/index.js "$TARGET_URL" --max 5000
```

**Threshold (what the templates do).** Tolerate up to N broken URLs. Run the
crawl with `--json` (append `|| true` so the CLI's exit code doesn't pre-empt
the gate), then count 4xx/5xx from the summary's `byStatus` map:

```bash
node apps/cli/dist/index.js "$TARGET_URL" --max 5000 --json > summary.json || true
node -e "
  const s = require('./summary.json');
  const by = (s.summary && s.summary.byStatus) || {};
  let n = 0;
  for (const [code, count] of Object.entries(by)) if (Number(code) >= 400) n += count;
  if (n > Number(process.env.BROKEN_LINK_THRESHOLD)) { console.error('too many broken:', n); process.exit(1); }
"
```

Reading `byStatus` (a `{ '200': 1234, '404': 5, … }` map) is robust against the
full dump's column layout and avoids parsing a multi-MB file just to count.

## Regression gating with `compare`

Fail a deploy when SEO metrics regress against a known-good baseline. Keep a
baseline `.seoproject` (from a previous green run, restored from cache or an
artifact store), crawl the new deploy into a fresh project, then diff:

```bash
node apps/cli/dist/index.js "$TARGET_URL" --max 5000 --db new.seoproject
node apps/cli/dist/index.js compare baseline.seoproject new.seoproject
# exit 1 → a page changed status / title / meta / h1 / canonical / indexability
```

`compare` runs the same engine as the desktop Compare dialog and exits `1` on
any non-zero diff category, so it drops straight into a pipeline gate. Promote
`new.seoproject` to the new baseline when the pipeline passes.

## Reproducible config

Export your settings once from the desktop app (Settings → Export Settings) and
commit the JSON, then feed it to every run so CI crawls exactly like your
desktop audits:

```bash
node apps/cli/dist/index.js "$TARGET_URL" --config freecrawl.config.json --max 5000
```

Per-flag overrides still win over the file, so `--max` can differ per run while
the shared config stays fixed.
