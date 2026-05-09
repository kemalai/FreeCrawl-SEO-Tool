const SKIP_KEY = 'clear:skip-confirm';

/**
 * Wipe crawl data after optionally confirming with the user. If the user
 * has previously ticked "Don't ask me again", the confirm is skipped.
 *
 * The DB reset is wrapped in a single SQLite transaction on the main
 * side, which drops the wipe time from ~2-3 s to ~300-500 ms on a
 * 100K-URL project (a single fsync replaces ten autocommit fsyncs).
 * `crawlClear` is awaited so a follow-up Start can't race the in-flight
 * `DELETE FROM …` against the seed-URL upsert.
 */
export async function clearCrawlWithConfirm(): Promise<boolean> {
  const skip = window.freecrawl.prefsGet(SKIP_KEY) === true;
  if (!skip) {
    const { confirmed, skipNext } = await window.freecrawl.confirmClear();
    if (!confirmed) return false;
    if (skipNext) window.freecrawl.prefsSet(SKIP_KEY, true);
  }
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  await window.freecrawl.crawlClear();
  return true;
}
