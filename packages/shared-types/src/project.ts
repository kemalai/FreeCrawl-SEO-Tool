export interface ProjectMeta {
  version: string;
  createdAt: string;
  startUrl: string;
  notes: string | null;
}

/**
 * One entry in the recent-projects list. Persisted in `preferences.json`
 * under `recentProjects`. Legacy entries were bare path strings and are
 * migrated to this shape on read (see `getRecentProjectEntries`).
 */
export interface RecentProject {
  /** Absolute `.seoproject` file path. */
  path: string;
  /** Hidden from the default recent list + File → Open Recent menu. */
  archived?: boolean;
  /** Free-form user labels for filtering (e.g. "client-x", "monthly"). */
  tags?: string[];
  /** ISO timestamp this project was last opened. */
  lastOpened?: string;
}
