import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FolderOpen, Archive, ArchiveRestore, Trash2, Plus } from 'lucide-react';
import type { CrawlConfig, RecentProject } from '@freecrawl/shared-types';
import { PROJECT_TEMPLATES } from '../projectTemplates.js';

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function ProjectsDialog({
  open,
  onClose,
  onNewFromTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onNewFromTemplate: (overrides: Partial<CrawlConfig>) => void;
}) {
  const { t } = useTranslation();
  const [recents, setRecents] = useState<RecentProject[]>([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');

  const reload = useCallback(async () => {
    setRecents(await window.freecrawl.recentProjectsList());
  }, []);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const r of recents) for (const tag of r.tags ?? []) s.add(tag);
    return [...s].sort();
  }, [recents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recents.filter((r) => {
      if (!showArchived && r.archived) return false;
      if (q && !r.path.toLowerCase().includes(q)) return false;
      if (tagFilter && !(r.tags ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [recents, search, showArchived, tagFilter]);

  const openProject = useCallback(
    (path: string) => {
      void window.freecrawl.projectOpen(path);
      onClose();
    },
    [onClose],
  );

  const toggleArchive = useCallback(
    async (r: RecentProject) => {
      await window.freecrawl.recentProjectSetArchived(r.path, !r.archived);
      void reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (path: string) => {
      await window.freecrawl.recentProjectRemove(path);
      void reload();
    },
    [reload],
  );

  const saveTags = useCallback(
    async (path: string) => {
      const tags = tagDraft
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      await window.freecrawl.recentProjectSetTags(path, tags);
      setEditingTags(null);
      setTagDraft('');
      void reload();
    },
    [tagDraft, reload],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[720px] flex-col rounded-lg border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-800 px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-surface-100">
            {t('projects.title', { defaultValue: 'Projects' })}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* New from template */}
          <div className="mb-5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
              {t('projects.newFromTemplate', { defaultValue: 'Start a New Project' })}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROJECT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.key}
                  onClick={() => onNewFromTemplate(tmpl.overrides)}
                  className="group flex flex-col rounded border border-surface-700 bg-surface-950/60 p-2.5 text-left hover:border-blue-600 hover:bg-surface-800/60"
                  title={tmpl.description}
                >
                  <span className="mb-0.5 flex items-center gap-1 text-[12px] font-medium text-surface-100">
                    <Plus size={11} className="text-blue-400" />
                    {t(`projects.template.${tmpl.key}`, { defaultValue: tmpl.label })}
                  </span>
                  <span className="line-clamp-2 text-[10px] leading-snug text-surface-500">
                    {t(`projects.templateDesc.${tmpl.key}`, {
                      defaultValue: tmpl.description,
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent projects */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
              {t('projects.recent', { defaultValue: 'Recent Projects' })}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-surface-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-3 w-3 accent-blue-500"
              />
              {t('projects.showArchived', { defaultValue: 'Show archived' })}
            </label>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('projects.filterPlaceholder', {
                defaultValue: 'Filter by path…',
              })}
              className="h-6 flex-1 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      tagFilter === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded border border-surface-800 bg-surface-950/40 px-3 py-6 text-center text-[11px] text-surface-500">
              {recents.length === 0
                ? t('projects.emptyNone', {
                    defaultValue: 'No recent projects yet — Save As creates one.',
                  })
                : t('projects.emptyFilter', {
                    defaultValue: 'No projects match the current filter.',
                  })}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((r) => (
                <li
                  key={r.path}
                  className={`rounded border border-surface-800 bg-surface-950/40 px-2.5 py-1.5 ${
                    r.archived ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onDoubleClick={() => openProject(r.path)}
                      title={r.path}
                    >
                      <div className="truncate text-[12px] text-surface-100">
                        {basename(r.path)}
                        {r.archived && (
                          <span className="ml-1.5 text-[9px] uppercase text-surface-500">
                            {t('projects.archivedTag', { defaultValue: 'archived' })}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-surface-500">{r.path}</div>
                    </div>
                    <button
                      onClick={() => openProject(r.path)}
                      title={t('projects.open', { defaultValue: 'Open' })}
                      className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-blue-300"
                    >
                      <FolderOpen size={14} />
                    </button>
                    <button
                      onClick={() => void toggleArchive(r)}
                      title={
                        r.archived
                          ? t('projects.unarchive', { defaultValue: 'Unarchive' })
                          : t('projects.archive', { defaultValue: 'Archive' })
                      }
                      className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-amber-300"
                    >
                      {r.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                    <button
                      onClick={() => void remove(r.path)}
                      title={t('projects.remove', { defaultValue: 'Remove from list' })}
                      className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Tags */}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {(r.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface-800 px-1.5 py-px text-[9px] text-surface-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {editingTags === r.path ? (
                      <input
                        autoFocus
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onBlur={() => void saveTags(r.path)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveTags(r.path);
                          if (e.key === 'Escape') {
                            setEditingTags(null);
                            setTagDraft('');
                          }
                        }}
                        placeholder={t('projects.tagsPlaceholder', {
                          defaultValue: 'tag1, tag2',
                        })}
                        className="h-5 w-40 rounded border border-surface-700 bg-surface-950 px-1.5 text-[10px] text-surface-100 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTags(r.path);
                          setTagDraft((r.tags ?? []).join(', '));
                        }}
                        className="rounded-full border border-dashed border-surface-700 px-1.5 py-px text-[9px] text-surface-500 hover:border-blue-600 hover:text-blue-300"
                      >
                        {t('projects.editTags', { defaultValue: '+ tags' })}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
