import { Menu, BrowserWindow, app, shell, type MenuItemConstructorOptions } from 'electron';
import { basename } from 'node:path';
import { IPC, type MenuEvent } from '@freecrawl/shared-types';
import { getMenuLabels, type MenuLang } from './menu-i18n.js';

function send(event: MenuEvent): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  win?.webContents.send(IPC.menuEvent, event);
}

export interface AppMenuHandlers {
  onOpenLogs: () => void;
  /** Open an existing `.seoproject` file via dialog. */
  onOpenProject: () => void;
  /** Open a recent project by its absolute path. */
  onOpenRecent: (path: string) => void;
  /** Clear the recent-projects pref. */
  onClearRecent: () => void;
  /** Recently-opened/saved project paths, most recent first. May be empty. */
  recentProjects: readonly string[];
  /** Re-enable any "Don't show again" diagnostic dialogs the user dismissed. */
  onResetDiagnosticDialogs: () => void;
  /** Reveal the on-disk logs directory in the OS file manager. */
  onOpenLogsFolder: () => void;
  /**
   * Manual update check — fetches the latest GitHub release, compares
   * with `app.getVersion()`, and surfaces a native dialog (up-to-date /
   * update available with "Open release page" button / network error).
   */
  onCheckForUpdates: () => void;
  /** UI language for menu labels. Falls back to `en` when missing. */
  lang?: MenuLang;
}

export function buildAppMenu(handlers: AppMenuHandlers): Menu {
  const L = getMenuLabels(handlers.lang ?? 'en');
  const recentSubmenu: MenuItemConstructorOptions[] =
    handlers.recentProjects.length === 0
      ? [{ label: L.emptyRecent, enabled: false }]
      : [
          ...handlers.recentProjects.slice(0, 10).map<MenuItemConstructorOptions>((p) => ({
            label: `${basename(p)}  —  ${p}`,
            click: () => handlers.onOpenRecent(p),
          })),
          { type: 'separator' as const },
          { label: L.clearRecent, click: () => handlers.onClearRecent() },
        ];
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ] as MenuItemConstructorOptions[])
      : []),
    {
      label: L.file,
      submenu: [
        { label: L.newProject, accelerator: 'CmdOrCtrl+N', click: () => send('new-project') },
        {
          label: L.openProject,
          accelerator: 'CmdOrCtrl+O',
          click: () => handlers.onOpenProject(),
        },
        { label: L.openRecent, submenu: recentSubmenu },
        { label: L.clearCrawlData, click: () => send('clear-crawl') },
        { type: 'separator' },
        {
          label: L.exportCsv,
          accelerator: 'CmdOrCtrl+E',
          click: () => send('export-csv'),
        },
        {
          label: L.exportJson,
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => send('export-json'),
        },
        {
          label: L.exportXml,
          click: () => send('export-xml'),
        },
        {
          label: L.generateSitemap,
          click: () => send('generate-sitemap'),
        },
        {
          label: L.exportHtmlReport,
          click: () => send('export-html-report'),
        },
        {
          label: L.bulkExport,
          click: () => send('export-bulk'),
        },
        { type: 'separator' },
        {
          label: L.compareWith,
          click: () => send('compare-with-project'),
        },
        {
          label: L.scheduledCrawl,
          toolTip: L.scheduledCrawlTooltip,
          click: () => send('open-scheduled-crawl'),
        },
        {
          label: L.saveProjectAs,
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('save-project-as'),
        },
        { type: 'separator' },
        {
          label: L.settings,
          accelerator: 'CmdOrCtrl+,',
          click: () => send('open-settings'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: L.view,
      submenu: [
        {
          label: L.overviewSidebar,
          accelerator: 'CmdOrCtrl+B',
          click: () => send('toggle-sidebar'),
        },
        {
          label: L.detailPanel,
          accelerator: 'CmdOrCtrl+D',
          click: () => send('toggle-detail-panel'),
        },
        { type: 'separator' },
        {
          label: L.showVisualization,
          accelerator: 'CmdOrCtrl+G',
          click: () => send('open-visualization'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L.fullscreen },
      ],
    },
    {
      label: L.reports,
      submenu: [
        {
          label: L.reportsItem,
          accelerator: 'CmdOrCtrl+R',
          click: () => send('open-reports'),
        },
      ],
    },
    {
      label: L.help,
      submenu: [
        {
          label: L.documentation,
          click: () => void shell.openExternal('https://github.com/kemalai/FreeCrawl-SEO-Tool'),
        },
        { type: 'separator' },
        {
          label: L.showLogs,
          accelerator: 'CmdOrCtrl+L',
          click: () => handlers.onOpenLogs(),
        },
        {
          label: L.openLogsFolder,
          toolTip: L.openLogsFolderTooltip,
          click: () => handlers.onOpenLogsFolder(),
        },
        {
          label: L.robotsTester,
          click: () => send('open-robots-tester'),
        },
        {
          label: L.sitemapValidator,
          click: () => send('open-sitemap-validator'),
        },
        { type: 'separator' },
        {
          label: L.resetDiagnostics,
          toolTip: L.resetDiagnosticsTooltip,
          click: () => handlers.onResetDiagnosticDialogs(),
        },
        { type: 'separator' },
        {
          label: L.deleteDomainData,
          toolTip: L.deleteDomainDataTooltip,
          click: () => send('delete-domain-data'),
        },
        {
          label: L.clearAllData,
          toolTip: L.clearAllDataTooltip,
          click: () => send('clear-all-data'),
        },
        { type: 'separator' },
        {
          label: L.checkForUpdates,
          toolTip: L.checkForUpdatesTooltip,
          click: () => handlers.onCheckForUpdates(),
        },
        { type: 'separator' },
        { label: L.about, click: () => send('about') },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
