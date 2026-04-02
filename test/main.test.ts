import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    generatePreviewContent: vi.fn(),
    generatePrintStyles: vi.fn(),
    openPrintModal: vi.fn(),
    getFolderByActiveFile: vi.fn()
}));

vi.mock('../src/settings', () => ({
    PrintSettingTab: class PrintSettingTab {}
}));

vi.mock('../src/utils/generatePreviewContent', () => ({
    generatePreviewContent: mocks.generatePreviewContent
}));

vi.mock('../src/utils/generatePrintStyles', () => ({
    generatePrintStyles: mocks.generatePrintStyles
}));

vi.mock('../src/utils/printModal', () => ({
    openPrintModal: mocks.openPrintModal
}));

vi.mock('../src/utils/getFolderByActiveFile', () => ({
    getFolderByActiveFile: mocks.getFolderByActiveFile
}));

import PrintPlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/types';
import { MarkdownView, TFile, TFolder } from 'obsidian';

function createApp() {
    const app: any = {
        workspace: {
            on: vi.fn(() => ({})),
            getActiveFile: vi.fn(() => null),
            getActiveViewOfType: vi.fn(() => null)
        },
        metadataCache: {
            getFileCache: vi.fn(() => undefined)
        },
        customCss: {
            setCssEnabledStatus: vi.fn(),
            enabledSnippets: new Set<string>(),
            snippets: {
                contains: vi.fn(() => false)
            },
            csscache: new Map<string, string>()
        }
    };

    return app;
}

function createPlugin(app = createApp()) {
    return new PrintPlugin(app as never, { dir: 'test-plugin' } as never);
}

function createFolder(name: string) {
    return Object.assign(new TFolder(), {
        name,
        children: [] as Array<TFile | TFolder>
    });
}

function createFile(path: string, basename: string, parent: TFolder) {
    return Object.assign(new TFile(), {
        path,
        basename,
        extension: 'md',
        parent
    });
}

function createMarkdownView(file: TFile, selection: string) {
    return Object.assign(Object.create(MarkdownView.prototype), {
        file,
        editor: {
            getSelection: () => selection
        },
        save: vi.fn(async () => undefined)
    });
}

describe('PrintPlugin cssclasses behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.generatePrintStyles.mockResolvedValue('body { color: black; }');
    });

    it('migrates the old extraClasses setting on load', async () => {
        const plugin = createPlugin();
        vi.spyOn(plugin, 'loadData').mockResolvedValue({
            extraClasses: true
        } as never);

        await plugin.onload();

        expect(plugin.settings.inheritNoteCssClasses).toBe(true);
    });

    it('applies note cssclasses when printing a note', async () => {
        const app = createApp();
        const folder = createFolder('Invoices');
        const file = createFile('Invoices/note.md', 'note', folder);
        const content = document.createElement('div');

        app.metadataCache.getFileCache.mockReturnValue({
            frontmatter: {
                cssclasses: 'invoice compact-print'
            }
        });
        mocks.generatePreviewContent.mockResolvedValue(content);

        const plugin = createPlugin(app);
        plugin.settings = {
            ...DEFAULT_SETTINGS,
            inheritNoteCssClasses: true
        };

        await plugin.printNote(file);

        expect(content.classList.contains('invoice')).toBe(true);
        expect(content.classList.contains('compact-print')).toBe(true);
        expect(mocks.openPrintModal).toHaveBeenCalledWith(
            'note',
            content,
            plugin.settings,
            'body { color: black; }',
            ['invoice', 'compact-print']
        );
    });

    it('applies the active note cssclasses when printing a selection', async () => {
        const app = createApp();
        const folder = createFolder('Invoices');
        const file = createFile('Invoices/note.md', 'note', folder);
        const content = document.createElement('div');
        const activeView = createMarkdownView(file, 'Selected text');

        app.workspace.getActiveViewOfType.mockReturnValue(activeView);
        app.metadataCache.getFileCache.mockReturnValue({
            frontmatter: {
                cssclasses: ['invoice', 'compact-print']
            }
        });
        mocks.generatePreviewContent.mockResolvedValue(content);

        const plugin = createPlugin(app);
        plugin.settings = {
            ...DEFAULT_SETTINGS,
            inheritNoteCssClasses: true
        };

        await plugin.printSelection();

        expect(content.classList.contains('invoice')).toBe(true);
        expect(content.classList.contains('compact-print')).toBe(true);
        expect(mocks.openPrintModal).toHaveBeenCalledWith(
            'note snippet',
            content,
            plugin.settings,
            'body { color: black; }',
            ['invoice', 'compact-print']
        );
    });

    it('keeps each note classes on its own wrapper when printing a folder', async () => {
        const app = createApp();
        const folder = createFolder('Invoices');
        const firstFile = createFile('Invoices/one.md', 'one', folder);
        const secondFile = createFile('Invoices/two.md', 'two', folder);
        folder.children = [firstFile, secondFile];

        const firstContent = document.createElement('div');
        const secondContent = document.createElement('div');

        app.metadataCache.getFileCache.mockImplementation((file: TFile) => {
            if (file === firstFile) {
                return {
                    frontmatter: {
                        cssclasses: 'invoice'
                    }
                };
            }

            return {
                frontmatter: {
                    cssclasses: 'compact-print'
                }
            };
        });

        mocks.generatePreviewContent
            .mockResolvedValueOnce(firstContent)
            .mockResolvedValueOnce(secondContent);

        const plugin = createPlugin(app);
        plugin.settings = {
            ...DEFAULT_SETTINGS,
            inheritNoteCssClasses: true
        };

        await plugin.printFolder(folder);

        expect(firstContent.classList.contains('invoice')).toBe(true);
        expect(secondContent.classList.contains('compact-print')).toBe(true);
        expect(mocks.openPrintModal).toHaveBeenCalledWith(
            'Invoices',
            expect.any(HTMLDivElement),
            plugin.settings,
            'body { color: black; }'
        );
    });
});
