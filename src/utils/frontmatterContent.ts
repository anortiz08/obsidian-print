import { App, TFile } from 'obsidian';

export function createFrontmatterContent(file: TFile, app: App): HTMLElement | null {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
        | Record<string, unknown>
        | undefined;

    if (!frontmatter) {
        return null;
    }

    const entries = Object.entries(frontmatter)
        .filter(([key]) => key !== 'position')
        .filter(([, value]) => value !== null && value !== undefined);

    if (entries.length === 0) {
        return null;
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

    return metadataContainer;
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
