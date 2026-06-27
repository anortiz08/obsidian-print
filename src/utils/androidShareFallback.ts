import { App, Notice, TFile } from 'obsidian';
import { createDebugPrintHtml } from './runtimePrintStyles';

export async function openAndroidPrintFallback(
    title: string,
    content: HTMLElement,
    cssString: string,
    bodyClasses: string[],
    includeThemeStyles: boolean,
    app?: App
): Promise<void> {
    const html = createDebugPrintHtml(content, cssString, title, bodyClasses, includeThemeStyles);
    const safeFilename = `${title.replace(/[\\/:*?"<>|]/g, '-')}.html`;

    if (typeof navigator.share === 'function') {
        try {
            const blob = new Blob([html], { type: 'text/html' });
            const file = new File([blob], safeFilename, { type: 'text/html' });
            const canShareFile =
                typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

            if (canShareFile) {
                await navigator.share({ files: [file], title });
                return;
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }
            // Fall through to open-with-default-app
        }
    }

    if (app) {
        await saveAndOpenHtml(html, safeFilename, app);
    } else {
        new Notice('Printing is not supported on this device.');
    }
}

async function saveAndOpenHtml(html: string, filename: string, app: App): Promise<void> {
    try {
        const existing = app.vault.getAbstractFileByPath(filename);
        if (existing instanceof TFile) {
            await app.vault.modify(existing, html);
        } else {
            await app.vault.create(filename, html);
        }

        // Open the file in the device's default browser so the user can print from there
        const appWithOpen = app as App & { openWithDefaultApp?: (path: string) => void };
        if (typeof appWithOpen.openWithDefaultApp === 'function') {
            appWithOpen.openWithDefaultApp(filename);
        } else {
            new Notice(`Saved "${filename}" to vault root. Open it in a browser to print.`);
        }
    } catch (error) {
        console.error('Failed to save print HTML:', error);
        new Notice('Could not save the print file.');
    }
}
