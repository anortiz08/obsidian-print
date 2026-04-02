import { describe, expect, it } from 'vitest';
import { TFile } from 'obsidian';
import { getNoteCssClasses } from '../src/utils/getNoteCssClasses';

function createFile() {
    return Object.assign(new TFile(), {
        path: 'note.md',
        basename: 'note',
        extension: 'md'
    });
}

describe('getNoteCssClasses', () => {
    it('returns normalized classes from the lowercase cssclasses property', () => {
        const file = createFile();
        const app = {
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: {
                        cssclasses: 'invoice compact-print'
                    }
                })
            }
        };

        expect(getNoteCssClasses(app as never, file)).toEqual(['invoice', 'compact-print']);
    });

    it('supports array-style frontmatter values and deduplicates them', () => {
        const file = createFile();
        const app = {
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: {
                        cssclasses: ['invoice', 'compact-print', 'invoice']
                    }
                })
            }
        };

        expect(getNoteCssClasses(app as never, file)).toEqual(['invoice', 'compact-print']);
    });

    it('falls back to camelCase metadata when present', () => {
        const file = createFile();
        const app = {
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: {
                        cssClasses: {
                            first: 'invoice',
                            second: 'compact-print'
                        }
                    }
                })
            }
        };

        expect(getNoteCssClasses(app as never, file)).toEqual(['invoice', 'compact-print']);
    });
});
