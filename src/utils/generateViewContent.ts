import { Notice } from 'obsidian';

interface PrintableViewLike {
    containerEl?: HTMLElement;
}

const VIEW_ROOT_SELECTORS = [
    '.bases-view',
    '.base-view',
    '[class*="bases"]',
    '.view-content',
    '.workspace-leaf-content .view-content'
];

const VIEW_CHROME_SELECTORS = [
    '.view-header',
    '[role="toolbar"]',
    '.clickable-icon',
    '.mod-action-button',
    '.bases-toolbar',
    '.bases-view-toolbar'
];

export function generateViewContent(
    view: PrintableViewLike | null | undefined,
    title?: string
): HTMLElement | void {
    const sourceRoot = resolveViewRoot(view);
    if (!sourceRoot) {
        new Notice('Could not capture the current view for printing.');
        return;
    }

    const content = createDiv();

    if (title) {
        content.createEl('h1', { text: title });
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'obsidian-print-note obsidian-print-view';

    const clonedRoot = sourceRoot.cloneNode(true) as HTMLElement;
    stripViewChrome(clonedRoot);

    wrapper.appendChild(clonedRoot);
    content.appendChild(wrapper);

    return content;
}

function resolveViewRoot(view: PrintableViewLike | null | undefined): HTMLElement | null {
    if (!view?.containerEl) {
        return null;
    }

    for (const selector of VIEW_ROOT_SELECTORS) {
        const match = view.containerEl.querySelector<HTMLElement>(selector);
        if (match) {
            return match;
        }
    }

    return view.containerEl;
}

function stripViewChrome(root: HTMLElement): void {
    root.querySelectorAll(VIEW_CHROME_SELECTORS.join(',')).forEach((element) => {
        element.remove();
    });
}
