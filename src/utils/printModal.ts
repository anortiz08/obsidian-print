import { PrintPluginSettings } from '../types';
import { Printd } from 'printd';
import {
    applyRuntimePrintClasses,
    createDebugPrintHtml,
    getTargetedRuntimePrintCss
} from './runtimePrintStyles';

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

    /**
     * This uses Electron to open a window with HTML content in order to inspect it when debug mode is turned on.
     */
    if (settings.debugMode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { remote } = (window as any).require("electron");

        const printWindow = new remote.BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        /**
         * This uses outerHTML solely when debug mode is turned on to make it easier to inspect the generated HTML
         * and CSS stylying. For debuggers: Press `cmd/ctrl + p` in the DevTools and search for 'Emulate CSS Print media type'
         */
        const debugContent = createDebugPrintHtml(
            content,
            combinedCssString,
            title,
            bodyClasses,
            includeThemeStyles
        );
        printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(debugContent)}`);

        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.openDevTools();
        });
    }

    const d = new Printd();
    d.onBeforePrint(() => {
        document.title = title;
    });
    d.onAfterPrint(() => {
        restoreDocumentTitle();
    });

    d.print(content, [combinedCssString], undefined, ({ iframe, launchPrint }) => {
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
