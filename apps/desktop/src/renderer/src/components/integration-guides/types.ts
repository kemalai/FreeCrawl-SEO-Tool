/**
 * Shape of one in-app integration setup guide. The content lives in one
 * file per UI language next to this one (`en.ts`, `tr.ts`, …) and is
 * picked by `resolveGuides()` in `./index.ts`.
 */

export interface GuideStep {
  /** One-line action label. */
  title: string;
  /** Long-form explanation. Plain text — newlines preserved. */
  detail?: string;
  /** Optional clickable URL (e.g. Google Cloud Console deep link). */
  link?: { label: string; url: string };
}

export interface GuideTroubleshoot {
  /** The error message or symptom (verbatim if possible). */
  problem: string;
  /** Plain-text fix. */
  solution: string;
}

export interface Guide {
  /** Short intro paragraph — what does this integration do, why pick it. */
  intro: string;
  /** Things the user must have BEFORE starting. */
  prereqs: string[];
  /** Numbered setup steps. */
  steps: GuideStep[];
  /** Common failure modes + fixes. */
  troubleshooting: GuideTroubleshoot[];
  /** Optional closing notes (rate limits, cost, refresh token TTL, etc). */
  notes?: string[];
  /** Date the guide was last reviewed against the live UI. */
  lastReviewed: string;
}
