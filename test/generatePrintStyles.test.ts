import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/types';
import { generatePrintStyles } from '../src/utils/generatePrintStyles';

describe('generatePrintStyles', () => {
    it('adds normalized fallback styles only when normalize style is enabled', async () => {
        const app = {
            vault: {
                adapter: {
                    read: async () => '@media print { .obsidian-print-page-break { page-break-before: always; } }'
                }
            },
            customCss: {
                enabledSnippets: new Set<string>(),
                snippets: {
                    contains: () => false
                },
                csscache: new Map<string, string>()
            }
        };

        const defaultCss = await generatePrintStyles(
            app as never,
            { dir: 'test-plugin' } as never,
            {
                ...DEFAULT_SETTINGS,
                normalizeStyle: false
            }
        );
        const normalizedCss = await generatePrintStyles(
            app as never,
            { dir: 'test-plugin' } as never,
            {
                ...DEFAULT_SETTINGS,
                normalizeStyle: true
            }
        );

        expect(defaultCss).not.toContain(".callout[data-callout=\"note\"]");
        expect(defaultCss).not.toContain('body { font-size: 14px; }');
        expect(defaultCss).not.toContain('h1 { font-size: 20px; }');
        expect(normalizedCss).toContain(".callout[data-callout=\"note\"]");
        expect(normalizedCss).toContain("font-family: 'Inter'");
        expect(normalizedCss).toContain('body { font-size: 14px; }');
        expect(normalizedCss).toContain('h1 { font-size: 20px; }');
    });
});
