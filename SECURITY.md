# Security Policy

The FreeCrawl SEO Tool team takes security seriously. We appreciate responsible
disclosure of vulnerabilities and aim to triage all reports promptly.

---

## Supported Versions

Only the latest published release on the `main` branch receives security
fixes. Older versions are not patched — if you are on an older release,
upgrading is the recommended remediation path.

| Version | Supported          |
| ------- | ------------------ |
| Latest stable (currently `0.3.x`) | Yes |
| Older `0.x` releases              | No  |

Release artifacts are published at:
<https://github.com/kemalai/FreeCrawl-SEO-Tool/releases>

---

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**
Public disclosure before a fix is published puts users at risk.

### Preferred channel — GitHub Security Advisories (private)

Report privately via GitHub's built-in coordinated-disclosure flow:

1. Go to <https://github.com/kemalai/FreeCrawl-SEO-Tool/security/advisories>
2. Click **"Report a vulnerability"**
3. Fill in the advisory form with reproduction steps and impact

This creates a private discussion visible only to the maintainers. We will
coordinate a fix, prepare a CVE if applicable, and credit the reporter
(unless you request anonymity) when the patched release goes public.

### Alternative — Email

If you cannot use GitHub Security Advisories, email the maintainer at:

**`kemalacarofficial@gmail.com`**

Use the subject prefix `[FreeCrawl Security]` so the report is routed
correctly. PGP encryption is not currently set up; do not include
exploit code in plain email — link to a private gist or password-protect
an attachment instead.

---

## What to Include in a Report

To help us triage quickly, please include as much of the following as
possible:

- **Affected component** — crawler engine (`@freecrawl/core`), database
  layer (`@freecrawl/db`), desktop shell, MCP server, or CLI
- **Affected version(s)** — output of `Help → About`, or the `version`
  field in `package.json`
- **Operating system + architecture** — Windows 11 / macOS 14 (Intel or
  ARM64) / Linux distro
- **Reproduction steps** — minimal sequence that triggers the issue
- **Proof-of-concept** — screenshot, video, or minimal code
- **Impact assessment** — confidentiality / integrity / availability
  exposure, privilege escalation, data exfiltration, etc.
- **Suggested fix** if you have one (entirely optional)

---

## Response Timeline

We aim for the following timeline. Real-world response times may vary
because the project is currently maintained by a single contributor.

| Stage                  | Target time      |
| ---------------------- | ---------------- |
| Initial acknowledgement | within 5 business days |
| Triage + severity assessment | within 14 business days |
| Patch development       | severity-dependent (critical: ≤ 30 days, high: ≤ 60 days, medium: ≤ 90 days) |
| Public disclosure       | coordinated with reporter — typically after a patched release is published |

If you do not receive an acknowledgement within 7 business days, please
follow up — your initial report may have been lost in spam filtering.

---

## Scope

### In scope

The following are considered valid security issues:

- **Remote code execution** in the crawler, parser, or MCP server
  triggered by malicious server responses (HTML, sitemap XML, robots.txt,
  HTTP headers, redirect chains, manifest JSON, etc.)
- **Path traversal / arbitrary file write** through project-file
  (`.seoproject`) handling, export paths, or import flows
- **SQL injection** in the SQLite layer (`@freecrawl/db`) — all user
  input must flow through prepared statements
- **Cross-site scripting (XSS)** in the renderer process when displaying
  crawled content (titles, anchor text, meta descriptions, custom
  extraction results)
- **Sandbox escape** from the renderer to the main process bypassing
  contextBridge isolation
- **Credential leakage** — API keys, project paths, or crawl data
  accidentally written to logs, telemetry, or remote services
- **Denial-of-service** on a normal site crawl that the user could
  reasonably expect to complete (e.g. catastrophic memory growth on a
  modestly-sized site, parser infinite loops, deadlocks under normal
  concurrency)
- **Supply-chain compromise** of distributed installers or the GitHub
  Actions release workflow

### Out of scope

- **DoS via clearly-malicious target sites** — if a user manually points
  the crawler at a hostile server, transient resource exhaustion is
  expected; report only if it persists after the crawl is stopped
- **Issues that require physical access** to the user's machine
- **Self-XSS** that requires the user to paste attacker-controlled
  content into devtools
- **Reports based on outdated versions** without a current-version
  reproduction
- **Best-practice / hardening suggestions without a concrete impact**
  (e.g. "you should add a CSP header") — please open a regular GitHub
  issue or pull request instead
- **Vulnerabilities in third-party dependencies** that are already
  publicly disclosed and have an upstream patch in flight — we
  appreciate the heads-up, but the report should ideally be filed with
  the upstream project; we will pull in patched versions on the next
  routine release
- **Social-engineering attacks** against the maintainer

---

## Distribution & Code-Signing

FreeCrawl SEO Tool releases are distributed exclusively through GitHub
Releases. The artifacts are produced by an automated GitHub Actions
workflow defined in `.github/workflows/release.yml`. SHA512 digests are
published alongside each release in `latest.yml` / `latest-mac.yml`.

Code-signing for Windows installers is being established through
[SignPath.io](https://signpath.io)'s open-source signing program. Once
active, all `.exe` artifacts will be signed and the application will
verify the publisher signature before applying any in-app update. macOS
artifacts are currently unsigned; users should verify the SHA512 digest
manually until Apple Developer ID notarization is in place.

If you encounter an installer that fails signature verification or
appears to come from any source other than the official GitHub Releases
page above, **do not run it** — please report it via the channels above.

---

## Cryptographic Material & Secrets

- **No secrets are bundled in the application.** API keys for optional
  third-party integrations (Search Console, Analytics, AI providers,
  etc.) are stored locally via the OS-native keychain when configured by
  the user, and are never transmitted to FreeCrawl-controlled servers.
- **No telemetry is collected** — the application does not phone home,
  beacon, or report usage data. The only outbound network requests are
  the crawls the user explicitly initiates and (when enabled) the
  on-demand "Check for Updates" call to the GitHub Releases API.
- **Project files (`.seoproject`)** are SQLite databases containing
  crawled content. They are not encrypted at rest in the current
  release — users handling sensitive data should rely on full-disk
  encryption at the OS level.

---

## Acknowledgements

We are happy to credit security researchers who report valid issues
through the channels above, both in the affected release's CHANGELOG
and (for higher-severity issues) in the published GitHub Security
Advisory. If you prefer to remain anonymous, please mention that in
your report.

Thank you for helping keep FreeCrawl SEO Tool and its users safe.
