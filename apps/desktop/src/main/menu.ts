import { Menu, BrowserWindow, app, shell, type MenuItemConstructorOptions } from 'electron';
import { basename } from 'node:path';
import { IPC, type MenuEvent } from '@freecrawl/shared-types';

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
}

export function buildAppMenu(handlers: AppMenuHandlers): Menu {
  const recentSubmenu: MenuItemConstructorOptions[] =
    handlers.recentProjects.length === 0
      ? [{ label: '(empty)', enabled: false }]
      : [
          ...handlers.recentProjects.slice(0, 10).map<MenuItemConstructorOptions>((p) => ({
            label: `${basename(p)}  —  ${p}`,
            click: () => handlers.onOpenRecent(p),
          })),
          { type: 'separator' as const },
          { label: 'Clear Recent', click: () => handlers.onClearRecent() },
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
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => send('new-project') },
        {
          label: 'Open Project…',
          accelerator: 'CmdOrCtrl+O',
          click: () => handlers.onOpenProject(),
        },
        { label: 'Open Recent', submenu: recentSubmenu },
        { label: 'Clear Crawl Data', click: () => send('clear-crawl') },
        { type: 'separator' },
        {
          label: 'Export Current View as CSV',
          accelerator: 'CmdOrCtrl+E',
          click: () => send('export-csv'),
        },
        {
          label: 'Export Current View as JSON…',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => send('export-json'),
        },
        {
          label: 'Export Current View as XML…',
          click: () => send('export-xml'),
        },
        {
          label: 'Generate XML Sitemap…',
          click: () => send('generate-sitemap'),
        },
        {
          label: 'Export HTML Report…',
          click: () => send('export-html-report'),
        },
        {
          label: 'Bulk Export…',
          click: () => send('export-bulk'),
        },
        { type: 'separator' },
        {
          label: 'Compare With Project…',
          click: () => send('compare-with-project'),
        },
        {
          label: 'Save Project As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('save-project-as'),
        },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+,',
          click: () => send('open-settings'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Overview Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => send('toggle-sidebar'),
        },
        {
          label: 'Detail Panel',
          accelerator: 'CmdOrCtrl+D',
          click: () => send('toggle-detail-panel'),
        },
        { type: 'separator' },
        {
          label: 'Visualization…',
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
        { role: 'togglefullscreen', label: 'Fullscreen' },
      ],
    },
    {
      label: 'Reports',
      submenu: [
        {
          label: 'Reports…',
          accelerator: 'CmdOrCtrl+R',
          click: () => send('open-reports'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => void shell.openExternal('https://github.com/kemalai/FreeCrawl-SEO-Tool'),
        },
        { type: 'separator' },
        {
          label: 'Show Logs…',
          accelerator: 'CmdOrCtrl+L',
          click: () => handlers.onOpenLogs(),
        },
        {
          label: 'Open Logs Folder',
          toolTip: 'Open the directory where rotated log files are persisted on disk',
          click: () => handlers.onOpenLogsFolder(),
        },
        {
          label: 'Robots.txt Tester…',
          click: () => send('open-robots-tester'),
        },
        {
          label: 'Sitemap Validator…',
          click: () => send('open-sitemap-validator'),
        },
        { type: 'separator' },
        {
          label: 'Reset Diagnostic Warnings',
          toolTip: 'Re-enable popup warnings you previously dismissed with "Don\'t show again"',
          click: () => handlers.onResetDiagnosticDialogs(),
        },
        { type: 'separator' },
        {
          label: 'Delete Domain Data…',
          toolTip:
            'GDPR-aligned per-domain wipe. Removes every URL row whose host matches the entered domain plus every dependent record (links, headers, images, source snapshots).',
          click: () => send('delete-domain-data'),
        },
        {
          label: 'Clear All Data…',
          toolTip:
            'Wipe the entire active project (URLs, links, images, headers, source snapshots, sitemaps). Cannot be undone — Save Project As… first if you want a backup.',
          click: () => send('clear-all-data'),
        },
        { type: 'separator' },
        { label: 'About FreeCrawl SEO', click: () => send('about') },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
