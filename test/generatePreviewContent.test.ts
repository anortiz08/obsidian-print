import { describe, expect, it } from 'vitest';
import { TFile } from 'obsidian';
import { generatePreviewContent } from '../src/utils/generatePreviewContent';

function createFile() {
    return Object.assign(new TFile(), {
        path: 'notes/print-demo.md',
        basename: 'print-demo',
        extension: 'md'
    });
}

describe('generatePreviewContent', () => {
    it('renders frontmatter values with structured markup', async () => {
        const file = createFile();
        const app = {
            vault: {
                cachedRead: async () => 'Body copy'
            },
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: {
                        title: 'Quarterly packet',
                        tags: ['finance', 'print'],
                        client: {
                            name: 'Northwind Press',
                            contact: 'Ada Lovelace'
                        },
                        position: {
                            start: {
                                line: 0
                            }
                        }
                    }
                })
            }
        };

        const content = await generatePreviewContent(file, true, app as never, true);

        expect(content).toBeTruthy();
        expect(content?.querySelector('.obsidian-print-frontmatter')).toBeTruthy();
        expect(content?.querySelectorAll('.obsidian-print-frontmatter-list li')).toHaveLength(2);
        expect(content?.querySelector('.obsidian-print-frontmatter-object-key')?.textContent).toBe('name');
        expect(content?.textContent).toContain('Quarterly packet');
        expect(content?.textContent).toContain('Northwind Press');
        expect(content?.textContent).toContain('Body copy');
        expect(content?.textContent).not.toContain('position');
    });

    it('renders mermaid code fences into diagrams', async () => {
        const file = createFile();
        const app = {
            vault: {
                cachedRead: async () => `
\`\`\`mermaid
flowchart TD
    Start --> Finish
\`\`\`
`
            },
            metadataCache: {
                getFileCache: () => undefined
            }
        };

        const content = await generatePreviewContent(file, false, app as never, false);

        expect(content?.querySelector('.mermaid')).toBeTruthy();
        expect(content?.querySelector('svg[data-mermaid-id]')).toBeTruthy();
        expect(content?.textContent).toContain('Start --> Finish');
        expect(content?.querySelector('pre code.language-mermaid')).toBeFalsy();
    });

    it('marks rendered content with Obsidian preview classes for theme style reuse', async () => {
        const file = createFile();
        const app = {
            vault: {
                cachedRead: async () => 'Body copy'
            },
            metadataCache: {
                getFileCache: () => undefined
            }
        };

        const content = await generatePreviewContent(file, false, app as never, false);

        expect(content?.classList.contains('obsidian-print-note')).toBe(true);
        expect(content?.classList.contains('markdown-rendered')).toBe(true);
        expect(content?.classList.contains('markdown-reading-view')).toBe(true);
        expect(content?.classList.contains('markdown-preview-view')).toBe(true);
    });
});
