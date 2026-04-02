import { App, TFile } from 'obsidian';

export function getNoteCssClasses(app: App, file?: TFile | null): string[] {
    if (!file) {
        return [];
    }

    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
        | Record<string, unknown>
        | undefined;

    const rawValue = frontmatter?.cssclasses ?? frontmatter?.cssClasses;

    return Array.from(new Set(normalizeCssClasses(rawValue)));
}

function normalizeCssClasses(value: unknown): string[] {
    if (typeof value === 'string') {
        return value.split(/\s+/).filter(Boolean);
    }

    if (Array.isArray(value)) {
        return value.flatMap((entry) => normalizeCssClasses(entry));
    }

    if (value && typeof value === 'object') {
        return Object.values(value).flatMap((entry) => normalizeCssClasses(entry));
    }

    return [];
}
