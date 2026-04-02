import { App, Notice, PluginManifest } from "obsidian";
import { PrintPluginSettings } from "src/types";
import { CustomCSS } from "obsidian-typings";

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
    const adapter = app.vault.adapter;

    let pluginStyle = '';
    let userStyle = '';

    if (manifest.dir) {
        const cssPath = `${manifest.dir}/styles.css`;
        try {
            pluginStyle = await adapter.read(cssPath);
        } catch (error) {
            new Notice('Default styling could not be located.');
        }
    } else {
        new Notice('Could not find the plugin path. No default print styles will be added.');
    }

    // Read user styles (optional)
    // Only include if the print.css is activated and still exists.
    if (getPrintSnippet(app) && isPrintSnippetEnabled(app)) {
        userStyle = getPrintSnippetValue(app) ?? '';        
    }

    const frontmatterStyles = settings.printFrontmatter
        ? `
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
        `
        : '';

    return `
        body { font-size: ${settings.fontSize}; }
        h1 { font-size: ${settings.h1Size}; }
        h2 { font-size: ${settings.h2Size}; }
        h3 { font-size: ${settings.h3Size}; }
        h4 { font-size: ${settings.h4Size}; }
        h5 { font-size: ${settings.h5Size}; }
        h6 { font-size: ${settings.h6Size}; }
        hr { page-break-before: ${settings.hrPageBreaks ? 'always' : 'auto'}; border-width: ${settings.hrPageBreaks ? '0' : 'revert-layer'}; }
        ${pluginStyle}
        ${frontmatterStyles}
        ${userStyle}
    `;
}


function getPrintSnippetValue(app: App,): string | undefined {
    const printCssPath = ".obsidian/snippets/print.css";
    return app.customCss.csscache.get(printCssPath);
}


export function isPrintSnippetEnabled(app: App): boolean {
    return app.customCss.enabledSnippets.has("print")
}

export function getPrintSnippet(app: App): boolean {
    return app.customCss.snippets.contains("print");
}
