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

            const cssText = getTargetedRuntimePrintCss();

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
});
