import { describe, expect, it } from 'vitest';
import { getTargetedRuntimePrintCss } from '../src/utils/runtimePrintStyles';

describe('getTargetedRuntimePrintCss', () => {
    it('collects callout and mermaid rules alongside other targeted print styles', () => {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .callout[data-callout="tip"] {
                border-color: rgba(var(--callout-color), 0.4);
                color: rgb(var(--callout-color));
            }

            .callout-title {
                font-weight: 700;
            }

            .mermaid .node rect {
                fill: var(--mermaid-node-bg);
            }

            .unrelated-selector {
                color: hotpink;
            }
        `;

        document.head.appendChild(styleElement);

        try {
            document.documentElement.style.setProperty('--callout-color', '22, 163, 74');
            document.documentElement.style.setProperty('--mermaid-node-bg', '#f5f5f5');

            const cssText = getTargetedRuntimePrintCss(document.body);

            expect(cssText).toContain('.callout[data-callout="tip"]');
            expect(cssText).toContain('.callout-title');
            expect(cssText).toContain('.mermaid .node rect');
            expect(cssText).toContain('--callout-color: 22, 163, 74;');
            expect(cssText).toContain('--mermaid-node-bg: #f5f5f5;');
            expect(cssText).not.toContain('.unrelated-selector');
        } finally {
            styleElement.remove();
            document.documentElement.style.removeProperty('--callout-color');
            document.documentElement.style.removeProperty('--mermaid-node-bg');
        }
    });

    it('collects style rules that match rendered base content', () => {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .bases-view .base-cell {
                color: seagreen;
            }
        `;

        const baseRoot = document.createElement('div');
        baseRoot.className = 'bases-view';
        const cell = document.createElement('div');
        cell.className = 'base-cell';
        baseRoot.appendChild(cell);
        document.body.appendChild(baseRoot);
        document.head.appendChild(styleElement);

        try {
            const cssText = getTargetedRuntimePrintCss(baseRoot);
            expect(cssText).toContain('.bases-view .base-cell');
        } finally {
            styleElement.remove();
            baseRoot.remove();
        }
    });

    it('does not collect unrelated workspace rules when the printed content does not match them', () => {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .workspace-leaf.mod-active .view-content {
                display: none;
            }

            .obsidian-print-note p {
                color: black;
            }
        `;

        const printedRoot = document.createElement('div');
        printedRoot.className = 'obsidian-print-note';
        printedRoot.innerHTML = '<p>Hello world</p>';
        document.head.appendChild(styleElement);

        try {
            const cssText = getTargetedRuntimePrintCss(printedRoot);

            expect(cssText).toContain('.obsidian-print-note p');
            expect(cssText).not.toContain('.workspace-leaf.mod-active .view-content');
        } finally {
            styleElement.remove();
        }
    });
});
