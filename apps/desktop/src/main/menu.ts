import { Menu, BrowserWindow, app, shell, type MenuItemConstructorOptions } from 'electron';
import { IPC, type MenuEvent } from '@freecrawl/shared-types';

function send(event: MenuEvent): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  win?.webContents.send(IPC.menuEvent, event);
}

export function buildAppMenu(): Menu {
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
        { label: 'Clear Crawl Data', click: () => send('clear-crawl') },
        { type: 'separator' },
        {
          label: 'Export Current View as CSV',
          accelerator: 'CmdOrCtrl+E',
          click: () => send('export-csv'),
        },
        {
          label: 'Generate XML Sitemap…',
          click: () => send('generate-sitemap'),
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
        { role: 'reload' },
        { role: 'toggleDevTools', label: 'Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Fullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => void shell.openExternal('https://github.com/kemalai/FreeCrawl-SEO-Tool'),
        },
        { label: 'About FreeCrawl SEO', click: () => send('about') },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
