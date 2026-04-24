const SKIP_KEY = 'clear:skip-confirm';

/**
 * Wipe crawl data after optionally confirming with the user. If the user
 * has previously ticked "Don't ask me again", the confirm is skipped.
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
