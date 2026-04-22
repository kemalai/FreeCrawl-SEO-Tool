import { fetch as undiciFetch } from 'undici';
import robotsParser from 'robots-parser';

export interface RobotsChecker {
  isAllowed(url: string): boolean;
  getCrawlDelay(): number | undefined;
}

const NOOP: RobotsChecker = {
  isAllowed: () => true,
  getCrawlDelay: () => undefined,
};

export async function loadRobots(origin: string, userAgent: string): Promise<RobotsChecker> {
  const robotsUrl = new URL('/robots.txt', origin).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await undiciFetch(robotsUrl, {
      method: 'GET',
      headers: { 'user-agent': userAgent },
      signal: controller.signal,
    });
    if (res.ok) {
      const body = await res.text();
      const parser = robotsParser(robotsUrl, body);
      return {
        isAllowed: (url: string) => parser.isAllowed(url, userAgent) ?? true,
        getCrawlDelay: () => parser.getCrawlDelay(userAgent),
      };
    }
  } catch {
    // ignore — default allow
  } finally {
    clearTimeout(timeout);
  }
  return NOOP;
}
