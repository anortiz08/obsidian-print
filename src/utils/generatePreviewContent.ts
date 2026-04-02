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

    const metadataContainer = document.createElement('section');
    metadataContainer.className = 'obsidian-print-frontmatter';

    const metadataProperties = document.createElement('div');
    metadataProperties.className = 'obsidian-print-frontmatter-properties';
    metadataContainer.appendChild(metadataProperties);

    entries.forEach(([key, value]) => {
        const propertyElement = document.createElement('div');
        propertyElement.className = 'obsidian-print-frontmatter-property';

        const keyElement = document.createElement('div');
        keyElement.className = 'obsidian-print-frontmatter-key';
        keyElement.textContent = key;

        const valueElement = document.createElement('div');
        valueElement.className = 'obsidian-print-frontmatter-value';
        appendFrontmatterValue(valueElement, value);

        propertyElement.append(keyElement, valueElement);
        metadataProperties.appendChild(propertyElement);
    });

    content.appendChild(metadataContainer);
}

function appendFrontmatterValue(container: HTMLElement, value: unknown): void {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        container.textContent = String(value);
        return;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return;
        }

        if (value.length === 1) {
            appendFrontmatterValue(container, value[0]);
            return;
        }

        const listElement = document.createElement('ul');
        listElement.className = 'obsidian-print-frontmatter-list';

        value.forEach((entry) => {
            const listItem = document.createElement('li');
            appendFrontmatterValue(listItem, entry);
            listElement.appendChild(listItem);
        });

        container.appendChild(listElement);
        return;
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, entry]) => entry !== null && entry !== undefined);

        if (entries.length === 0) {
            return;
        }

        const objectElement = document.createElement('dl');
        objectElement.className = 'obsidian-print-frontmatter-object';

        entries.forEach(([key, entry]) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'obsidian-print-frontmatter-object-row';

            const keyElement = document.createElement('dt');
            keyElement.className = 'obsidian-print-frontmatter-object-key';
            keyElement.textContent = key;

            const valueElement = document.createElement('dd');
            valueElement.className = 'obsidian-print-frontmatter-object-value';
            appendFrontmatterValue(valueElement, entry);

            rowElement.append(keyElement, valueElement);
            objectElement.appendChild(rowElement);
        });

        container.appendChild(objectElement);
        return;
    }

    if (value !== null && value !== undefined) {
        container.textContent = String(value);
    }
}
