import { PrintPluginSettings } from '../types';
import { Printd } from 'printd';
import {
    applyRuntimePrintClasses,
    createDebugPrintHtml,
    getTargetedRuntimePrintCss
} from './runtimePrintStyles';
import { openDebugPrintPreview } from './printEnvironment';
import { syncPrintableCloneState } from './syncPrintableClone';

/**
 * Generate the HTML with the content to be printed. Use Printd to print.
 * 
 * @param title
 * @param content 
 * @param settings 
 * @param cssString 
 * @returns 
 */
export async function openPrintModal(
    title: string,
    content: HTMLElement,
    settings: PrintPluginSettings,
    cssString: string,
    bodyClasses: string[] = []
): Promise<void> {
    const includeThemeStyles = !settings.normalizeStyle;
    const runtimeCss = includeThemeStyles
        ? getTargetedRuntimePrintCss(content)
        : '';
    const combinedCssString = [cssString, runtimeCss]
        .filter((value) => value.trim().length > 0)
        .join('\n');
    const previousTitle = document.title;
    let restoredTitle = false;

    const restoreDocumentTitle = () => {
        if (restoredTitle) {
            return;
        }

        restoredTitle = true;
        document.title = previousTitle;
    };

    if (settings.debugMode) {
        const debugContent = createDebugPrintHtml(
            content,
            combinedCssString,
            title,
            bodyClasses,
            includeThemeStyles
        );

        openDebugPrintPreview({ html: debugContent });
    }

    const d = new Printd();
    d.onBeforePrint(() => {
        document.title = title;
    });
    d.onAfterPrint(() => {
        restoreDocumentTitle();
    });

    d.print(content, [combinedCssString], undefined, ({ iframe, element, launchPrint }) => {
        if (element instanceof HTMLElement) {
            syncPrintableCloneState(content, element);
        }

        if (iframe.contentDocument) {
            applyRuntimePrintClasses(iframe.contentDocument, includeThemeStyles);
            iframe.contentDocument.title = title;

            if (bodyClasses.length > 0) {
                iframe.contentDocument.body.classList.add(...bodyClasses);
            }
        }

        document.title = title;
        launchPrint();

        window.setTimeout(() => {
            restoreDocumentTitle();
        }, 1000);
    });
}
