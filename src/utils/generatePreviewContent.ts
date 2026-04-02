import { MarkdownRenderer, TFile, Component, Notice, App, loadMermaid } from 'obsidian';
import { createFrontmatterContent } from './frontmatterContent';

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
    content.addClass(
        'obsidian-print-note',
        'markdown-rendered',
        'markdown-reading-view',
        'markdown-preview-view'
    );

    try {
        if (includeFrontmatter && input instanceof TFile) {
            const frontmatterContent = createFrontmatterContent(input, app);
            if (frontmatterContent) {
                content.appendChild(frontmatterContent);
            }
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

        await renderMermaidBlocks(content);

        return content;

    } catch (error) {
        new Notice('Failed to generate preview content.');
        console.error('Preview generation error:', error);
        return;
    }
}

let mermaidRenderCount = 0;

async function renderMermaidBlocks(content: HTMLElement): Promise<void> {
    const mermaidCodeBlocks = content.querySelectorAll<HTMLElement>('pre code.language-mermaid');
    if (mermaidCodeBlocks.length === 0) {
        return;
    }

    try {
        const mermaid = await loadMermaid();

        for (const codeElement of Array.from(mermaidCodeBlocks)) {
            const source = codeElement.textContent?.trim();
            const preElement = codeElement.closest('pre');

            if (!source || !preElement) {
                continue;
            }

            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'mermaid';

            const renderResult = await mermaid.render(
                `obsidian-print-mermaid-${mermaidRenderCount++}`,
                source
            );

            const svg = typeof renderResult === 'string'
                ? renderResult
                : renderResult?.svg;

            if (!svg) {
                continue;
            }

            diagramContainer.innerHTML = svg;

            if (typeof renderResult?.bindFunctions === 'function') {
                renderResult.bindFunctions(diagramContainer);
            }

            preElement.replaceWith(diagramContainer);
        }
    } catch (error) {
        console.error('Mermaid rendering error:', error);
    }
}
