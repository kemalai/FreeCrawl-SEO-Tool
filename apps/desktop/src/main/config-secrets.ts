/**
 * Credential fields of a `CrawlConfig`, split out of the config so they can
 * be encrypted at rest (preferences.json, the project's `lastCrawlConfig`),
 * blanked in the shareable settings export, and kept out of every reply to
 * an MCP agent, whose context goes to its model provider.
 *
 * Pure (no Electron) so the rules can be tested directly. The list here is
 * the whole boundary: a field that holds a credential and is missing from
 * it is stored in plaintext and handed to agents. Proxy profile URLs were
 * (2026-11-07: an agent's `start_crawl` reply carried three proxy
 * passwords), as were form-login field values and custom header values.
 */
import type { CrawlConfig, FormLoginStep } from '@freecrawl/shared-types';

type FormLoginField = FormLoginStep['fields'][number];
type ProxyProfile = CrawlConfig['proxyProfiles'][number];

/** A form-login value that is only a `{{var}}` reference to a captured
 *  value (a CSRF token) — a template, not a credential. */
const TEMPLATE_ONLY = /^\s*\{\{\s*[\w.-]+\s*\}\}\s*$/;

/**
 * The entries of a config list, or none when the field is not a list of
 * objects. These helpers also run on configs read back from disk and
 * from settings imports; a hand-edited or older file with an odd shape
 * must not crash startup — its malformed part simply holds no secrets.
 */
function entries<T extends object>(list: unknown): T[] {
  return Array.isArray(list)
    ? (list.filter((e) => e !== null && typeof e === 'object') as T[])
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Secret keys for a list of named entries. Names identify the entry (the
 * active proxy profile is chosen by name; a header or form field is its
 * name), so the key survives reordering; a repeated name gets its
 * occurrence number so two entries can't share one key.
 */
function namedKeys(prefix: string, names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const n = seen.get(name) ?? 0;
    seen.set(name, n + 1);
    return `${prefix}${n}:${name}`;
  });
}

/**
 * The secret values of a config as a flat record, and a deep copy of the
 * config with those values blanked.
 */
export function splitConfigSecrets(config: CrawlConfig): {
  clean: CrawlConfig;
  secrets: Record<string, string>;
} {
  const clean: CrawlConfig = JSON.parse(JSON.stringify(config)) as CrawlConfig;
  const secrets: Record<string, string> = {};
  // A credential-bearing field in the wrong shape (a stringified list, a
  // hand-edited file) can't be searched for its secrets, so it is dropped
  // from the clean copy instead of passed through whole — fail closed.
  const loose = clean as unknown as Record<string, unknown>;
  for (const field of ['auth', 'formLogin'] as const) {
    if (loose[field] !== undefined && !isRecord(loose[field])) delete loose[field];
  }
  if (loose['customHeaders'] !== undefined && !isRecord(loose['customHeaders'])) clean.customHeaders = {};
  if (loose['proxyProfiles'] !== undefined) clean.proxyProfiles = entries<ProxyProfile>(loose['proxyProfiles']);
  if (clean.formLogin && clean.formLogin.steps !== undefined) {
    clean.formLogin.steps = entries<FormLoginStep>(clean.formLogin.steps);
    for (const step of clean.formLogin.steps) {
      if (step.fields !== undefined) step.fields = entries<FormLoginField>(step.fields);
    }
  }
  if (clean.auth) {
    if (clean.auth.password) {
      secrets['auth.password'] = clean.auth.password;
      clean.auth.password = '';
    }
    if (clean.auth.token) {
      secrets['auth.token'] = clean.auth.token;
      clean.auth.token = '';
    }
  }
  const pv = clean.formLogin?.browser?.passwordValue;
  if (pv) {
    secrets['formLogin.browser.passwordValue'] = pv;
    clean.formLogin!.browser!.passwordValue = '';
  }
  // The values a login step POSTs are the username and password. Only a
  // value that merely references a captured variable stays readable.
  entries<FormLoginStep>(clean.formLogin?.steps).forEach((step, i) => {
    const fields = entries<FormLoginField>(step.fields);
    const keys = namedKeys(`formLogin.steps.${i}.fields.`, fields.map((f) => f.name));
    fields.forEach((field, j) => {
      if (typeof field.value !== 'string' || !field.value || TEMPLATE_ONLY.test(field.value)) return;
      secrets[keys[j]!] = field.value;
      field.value = '';
    });
  });
  if (clean.proxyUrl) {
    secrets['proxyUrl'] = clean.proxyUrl;
    clean.proxyUrl = '';
  }
  // Saved proxy profiles carry the same `user:pass@` URLs as the proxy
  // field; the active one is still known by its name.
  const profiles = entries<ProxyProfile>(clean.proxyProfiles);
  const profileKeys = namedKeys('proxyProfiles.', profiles.map((p) => p.name));
  profiles.forEach((profile, i) => {
    if (typeof profile.url !== 'string' || !profile.url) return;
    secrets[profileKeys[i]!] = profile.url;
    profile.url = '';
  });
  // Custom headers are how sites take a bypass token or an Authorization
  // header — the crawler already refuses to send them to any other host.
  // Names stay visible; values are credentials.
  if (isRecord(clean.customHeaders)) {
    for (const [name, value] of Object.entries(clean.customHeaders)) {
      if (typeof value !== 'string' || !value) continue;
      secrets[`customHeaders.${name}`] = value;
      clean.customHeaders[name] = '';
    }
  }
  // A Slack / Discord / Teams webhook URL is bearer-equivalent: anyone
  // holding it can post into the channel. Same treatment as a password —
  // encrypted at rest, blanked in the settings export and for MCP agents.
  if (clean.webhookUrl) {
    secrets['webhookUrl'] = clean.webhookUrl;
    clean.webhookUrl = '';
  }
  return { clean, secrets };
}

/**
 * Re-apply previously split secrets onto a (cleaned) config, in place. A
 * list entry is filled only where the config still has it, so a profile,
 * header or form field removed since the split stays removed.
 */
export function applyConfigSecrets(
  config: CrawlConfig,
  secrets: Record<string, string>,
): CrawlConfig {
  if (secrets['auth.password'] !== undefined && config.auth) {
    config.auth.password = secrets['auth.password'];
  }
  if (secrets['auth.token'] !== undefined && config.auth) {
    config.auth.token = secrets['auth.token'];
  }
  if (
    secrets['formLogin.browser.passwordValue'] !== undefined &&
    config.formLogin?.browser
  ) {
    config.formLogin.browser.passwordValue = secrets['formLogin.browser.passwordValue'];
  }
  entries<FormLoginStep>(config.formLogin?.steps).forEach((step, i) => {
    const fields = entries<FormLoginField>(step.fields);
    const keys = namedKeys(`formLogin.steps.${i}.fields.`, fields.map((f) => f.name));
    fields.forEach((field, j) => {
      const value = secrets[keys[j]!];
      if (value !== undefined && !field.value) field.value = value;
    });
  });
  if (secrets['proxyUrl'] !== undefined) {
    config.proxyUrl = secrets['proxyUrl'];
  }
  const profiles = entries<ProxyProfile>(config.proxyProfiles);
  const profileKeys = namedKeys('proxyProfiles.', profiles.map((p) => p.name));
  profiles.forEach((profile, i) => {
    const value = secrets[profileKeys[i]!];
    if (value !== undefined && !profile.url) profile.url = value;
  });
  if (isRecord(config.customHeaders)) {
    for (const name of Object.keys(config.customHeaders)) {
      const value = secrets[`customHeaders.${name}`];
      if (value !== undefined && !config.customHeaders[name]) config.customHeaders[name] = value;
    }
  }
  if (secrets['webhookUrl'] !== undefined) {
    config.webhookUrl = secrets['webhookUrl'];
  }
  return config;
}

/** A copy of the config with every secret blanked — for the shareable
 *  settings-export, which must never carry credentials. Accepts a loose
 *  record because the export IPC types its payload as `Record<string,
 *  unknown>`; the JSON round-trip inside `splitConfigSecrets` tolerates
 *  partial/extra fields. */
export function redactConfigSecrets(config: Record<string, unknown>): Record<string, unknown> {
  return splitConfigSecrets(config as unknown as CrawlConfig).clean as unknown as Record<
    string,
    unknown
  >;
}

/** `config` with its secrets blanked, for replies to an MCP agent: an
 *  agent's context goes to its model provider, so the user's passwords,
 *  tokens and proxy credentials must never be in it. */
export function configForAgent(config: CrawlConfig): CrawlConfig {
  return splitConfigSecrets(config).clean;
}

/** `next` with every secret it leaves blank taken from `current`. An agent
 *  only ever sees blanked secrets (`configForAgent`), so a read-modify-write
 *  of the config sends them back blank — that must keep the stored values,
 *  not wipe them. */
export function keepStoredSecrets(next: CrawlConfig, current: CrawlConfig | null): CrawlConfig {
  if (!current) return next;
  const stored = splitConfigSecrets(current).secrets;
  const given = splitConfigSecrets(next).secrets;
  const keep: Record<string, string> = {};
  for (const [field, value] of Object.entries(stored)) {
    if (!given[field]) keep[field] = value;
  }
  if (Object.keys(keep).length === 0) return next;
  return applyConfigSecrets(JSON.parse(JSON.stringify(next)) as CrawlConfig, keep);
}
