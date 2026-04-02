import { MarkdownRenderer, TFile, Component, Notice, App } from 'obsidian';

/**
 * Returns the rendered markdown content from either a TFile or a string.
 * 
 * @param input - Either a TFile object or a markdown string to render
 * @param withTitle - Whether to include the title in the rendered output
 * @param app - Obsidian App instance needed for rendering
 * @returns Promise<HTMLElement|void> - The rendered content as an HTML element
 */
export async function generatePreviewContent(
    input: TFile | string,
    withTitle: boolean,
    app: App,
    includeFrontmatter = false
): Promise<HTMLElement|void> {
    const content = createDiv();

    try {
        if (includeFrontmatter && input instanceof TFile) {
            appendFrontmatter(content, input, app);
        }

        // Handle title if requested
        if (withTitle && input instanceof TFile) {
            const titleEl = content.createEl('h1');
            titleEl.textContent = input.basename;
        }

        // Get the markdown content based on input type
        let markdownContent: string;
        let sourcePath: string = '';

        if (input instanceof TFile) {
            markdownContent = await app.vault.cachedRead(input);
            sourcePath = input.path;
        } else {
            markdownContent = input;
        }

        // Render the markdown content
        await MarkdownRenderer.render(
            app,
            markdownContent,
            content,
            sourcePath,
            new Component()
        );

        content.addClass('obsidian-print-note');
        return content;

    } catch (error) {
        new Notice('Failed to generate preview content.');
        console.error('Preview generation error:', error);
        return;
    }
}

function appendFrontmatter(content: HTMLElement, file: TFile, app: App): void {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
        | Record<string, unknown>
        | undefined;

    if (!frontmatter) {
        return;
    }

    const entries = Object.entries(frontmatter)
        .filter(([key]) => key !== 'position')
        .filter(([, value]) => value !== null && value !== undefined);

    if (entries.length === 0) {
        return;
    }

    const metadataContainer = content.createDiv({ cls: 'metadata-container' });
    const metadataProperties = metadataContainer.createDiv({ cls: 'metadata-properties' });

    entries.forEach(([key, value]) => {
        const propertyElement = metadataProperties.createDiv({ cls: 'metadata-property' });
        propertyElement.createDiv({
            cls: 'metadata-property-key',
            text: key
        });
        propertyElement.createDiv({
            cls: 'metadata-property-value',
            text: stringifyFrontmatterValue(value)
        });
    });
}

function stringifyFrontmatterValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map((entry) => stringifyFrontmatterValue(entry)).join(', ');
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .map(([key, entry]) => `${key}: ${stringifyFrontmatterValue(entry)}`)
            .join(', ');
    }

    return '';
}
