import { Notice, Platform } from 'obsidian';

interface ElectronBrowserWindowLike {
    loadURL: (url: string) => void;
    webContents: {
        on: (eventName: string, callback: () => void) => void;
        openDevTools: () => void;
    };
}

interface ElectronModuleLike {
    remote?: {
        BrowserWindow: new (options: Record<string, unknown>) => ElectronBrowserWindowLike;
    };
}

interface ElectronCapableWindow extends Window {
    require?: (moduleName: string) => ElectronModuleLike;
}

interface OpenDebugPrintPreviewOptions {
    html: string;
}

export function canOpenDebugPrintPreview(
    win: ElectronCapableWindow = window
): boolean {
    return Platform.isDesktopApp && typeof win.require === 'function';
}

export function openDebugPrintPreview({
    html
}: OpenDebugPrintPreviewOptions): boolean {
    if (!canOpenDebugPrintPreview()) {
        new Notice('Debug mode is only available in Obsidian desktop.');
        return false;
    }

    try {
        const electronModule = (window as ElectronCapableWindow).require?.('electron');
        const BrowserWindow = electronModule?.remote?.BrowserWindow;

        if (!BrowserWindow) {
            throw new Error('Electron BrowserWindow is unavailable.');
        }

        const printWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.openDevTools();
        });

        return true;
    } catch (error) {
        console.error('Print debug preview error:', error);
        new Notice('Could not open the debug print preview.');
        return false;
    }
}
