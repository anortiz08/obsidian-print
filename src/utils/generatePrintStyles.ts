import { App, Notice, PluginManifest } from "obsidian";
import { PrintPluginSettings } from "src/types";
import { NORMALIZED_PRINT_STYLES } from "./normalizedPrintStyles";

interface CustomCssLike {
    csscache: Map<string, string>;
    enabledSnippets: Set<string>;
    snippets: {
        contains: (name: string) => boolean;
    };
    setCssEnabledStatus: (name: string, enabled: boolean) => void;
}

/**
 * Retrieves styles.css from plugin and the optional print.css snippet. 
 * Add font size styles from settings and return a css string.
 * 
 * @param app 
 * @param manifest 
 * @param settings 
 * @returns 
 */
export async function generatePrintStyles(app: App, manifest: PluginManifest, settings: PrintPluginSettings): Promise<string> {
    const cssSections = [
        getSizeOverrideStyles(settings),
        getHorizontalRuleStyles(settings),
        await getPluginStyles(app, manifest),
        getNormalizedPrintStyles(settings),
        getPropertiesStyles(settings),
        getUserSnippetStyles(app)
    ];

    return cssSections
        .filter((cssText) => cssText.trim().length > 0)
        .join('\n');
}

export function setPrintSnippetEnabled(app: App, enabled: boolean): void {
    getCustomCss(app).setCssEnabledStatus('print', enabled);
}

async function getPluginStyles(app: App, manifest: PluginManifest): Promise<string> {
    if (!manifest.dir) {
        new Notice('Could not find the plugin path. No default print styles will be added.');
        return '';
    }

    try {
        return await app.vault.adapter.read(`${manifest.dir}/styles.css`);
    } catch (error) {
        new Notice('Default styling could not be located.');
        return '';
    }
}

function getUserSnippetStyles(app: App): string {
    if (!getPrintSnippet(app) || !isPrintSnippetEnabled(app)) {
        return '';
    }

    return getPrintSnippetValue(app) ?? '';
}

function getSizeOverrideStyles(settings: PrintPluginSettings): string {
    if (!settings.normalizeStyle) {
        return '';
    }

    return `
        body { font-size: ${settings.fontSize}; }
        h1 { font-size: ${settings.h1Size}; }
        h2 { font-size: ${settings.h2Size}; }
        h3 { font-size: ${settings.h3Size}; }
        h4 { font-size: ${settings.h4Size}; }
        h5 { font-size: ${settings.h5Size}; }
        h6 { font-size: ${settings.h6Size}; }
    `;
}

function getHorizontalRuleStyles(settings: PrintPluginSettings): string {
    return `hr { page-break-before: ${settings.hrPageBreaks ? 'always' : 'auto'}; border-width: ${settings.hrPageBreaks ? '0' : 'revert-layer'}; }`;
}

function getNormalizedPrintStyles(settings: PrintPluginSettings): string {
    return settings.normalizeStyle
        ? NORMALIZED_PRINT_STYLES
        : '';
}

function getPropertiesStyles(settings: PrintPluginSettings): string {
    if (!settings.printFrontmatter) {
        return '';
    }

    return `
        .obsidian-print-frontmatter {
            display: block !important;
            margin: 0 0 1.5rem;
            padding: 0.9rem 1rem;
            border: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.12));
            border-radius: 8px;
            background: var(--background-secondary, rgba(0, 0, 0, 0.03));
            page-break-inside: avoid;
        }
        .obsidian-print-frontmatter-properties {
            display: grid;
            gap: 0.45rem;
        }
        .obsidian-print-frontmatter-property {
            display: grid;
            grid-template-columns: minmax(120px, 220px) 1fr;
            gap: 0.75rem;
            align-items: start;
        }
        .obsidian-print-frontmatter-key {
            font-weight: 600;
        }
        .obsidian-print-frontmatter-value > *:first-child,
        .obsidian-print-frontmatter-value > *:last-child {
            margin-block-start: 0;
            margin-block-end: 0;
        }
        .obsidian-print-frontmatter-list,
        .obsidian-print-frontmatter-object {
            margin: 0;
            padding-left: 1.25rem;
        }
        .obsidian-print-frontmatter-object {
            display: grid;
            gap: 0.35rem;
            padding-left: 0;
        }
        .obsidian-print-frontmatter-object-row {
            display: grid;
            grid-template-columns: minmax(90px, 180px) 1fr;
            gap: 0.75rem;
        }
        .obsidian-print-frontmatter-object-key {
            font-weight: 500;
        }
        .obsidian-print-frontmatter-object-key,
        .obsidian-print-frontmatter-object-value {
            margin: 0;
        }
    `;
}

function getPrintSnippetValue(app: App,): string | undefined {
    const printCssPath = ".obsidian/snippets/print.css";
    return getCustomCss(app).csscache.get(printCssPath);
}


export function isPrintSnippetEnabled(app: App): boolean {
    return getCustomCss(app).enabledSnippets.has("print")
}

export function getPrintSnippet(app: App): boolean {
    return getCustomCss(app).snippets.contains("print");
}

function getCustomCss(app: App): CustomCssLike {
    return (app as App & { customCss: CustomCssLike }).customCss;
}
