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

    const headingElement = document.createElement('div');
    headingElement.className = 'obsidian-print-frontmatter-heading';
    headingElement.textContent = 'Properties';
    metadataContainer.appendChild(headingElement);

    const metadataProperties = document.createElement('div');
    metadataProperties.className = 'obsidian-print-frontmatter-properties';
    metadataContainer.appendChild(metadataProperties);

    entries.forEach(([key, value]) => {
        const propertyElement = document.createElement('div');
        propertyElement.className = 'obsidian-print-frontmatter-property';
        propertyElement.classList.add(`obsidian-print-frontmatter-property--${getFrontmatterValueKind(value)}`);

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
    if (typeof value === 'boolean') {
        const booleanElement = document.createElement('span');
        booleanElement.className = 'obsidian-print-frontmatter-boolean';

        if (value) {
            booleanElement.classList.add('is-checked');
        }

        const indicatorElement = document.createElement('span');
        indicatorElement.className = 'obsidian-print-frontmatter-boolean-indicator';
        indicatorElement.setAttribute('aria-hidden', 'true');

        const textElement = document.createElement('span');
        textElement.className = 'obsidian-print-frontmatter-boolean-text';
        textElement.textContent = String(value);

        booleanElement.append(indicatorElement, textElement);
        container.appendChild(booleanElement);
        return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        container.appendChild(createInlineValueElement(value));
        return;
    }

    if (Array.isArray(value)) {
        const entries = value.filter((entry) => entry !== null && entry !== undefined);

        if (entries.length === 0) {
            return;
        }

        if (entries.every(isInlineValue)) {
            const chipList = document.createElement('div');
            chipList.className = 'obsidian-print-frontmatter-chip-list';

            entries.forEach((entry) => {
                const chipElement = document.createElement('span');
                chipElement.className = 'obsidian-print-frontmatter-chip';
                chipElement.appendChild(createInlineValueElement(entry));
                chipList.appendChild(chipElement);
            });

            container.appendChild(chipList);
            return;
        }

        if (entries.length === 1) {
            appendFrontmatterValue(container, entries[0]);
            return;
        }

        const listElement = document.createElement('ul');
        listElement.className = 'obsidian-print-frontmatter-list';

        entries.forEach((entry) => {
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
        container.appendChild(createInlineValueElement(String(value)));
    }
}

function createInlineValueElement(value: string | number | boolean): HTMLElement {
    if (typeof value === 'boolean') {
        const booleanWrapper = document.createElement('span');
        appendFrontmatterValue(booleanWrapper, value);
        return booleanWrapper;
    }

    if (typeof value === 'string' && isExternalLink(value)) {
        const linkElement = document.createElement('a');
        linkElement.className = 'obsidian-print-frontmatter-link';
        linkElement.href = value;
        linkElement.textContent = value;
        return linkElement;
    }

    const textElement = document.createElement('span');
    textElement.className = 'obsidian-print-frontmatter-text';
    textElement.textContent = String(value);
    return textElement;
}

function getFrontmatterValueKind(value: unknown): string {
    if (typeof value === 'boolean') {
        return 'boolean';
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return 'scalar';
    }

    if (Array.isArray(value)) {
        const entries = value.filter((entry) => entry !== null && entry !== undefined);
        return entries.every(isInlineValue) ? 'chip-list' : 'list';
    }

    if (value && typeof value === 'object') {
        return 'object';
    }

    return 'scalar';
}

function isInlineValue(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isExternalLink(value: string): boolean {
    return /^(https?:\/\/|mailto:)/i.test(value);
}
