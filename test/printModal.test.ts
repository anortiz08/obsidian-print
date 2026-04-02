import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'obsidian';

const mocks = vi.hoisted(() => {
    const launchPrint = vi.fn();
    const print = vi.fn((_content, _styles, _scripts, callback) => {
        const iframeDocument = document.implementation.createHTMLDocument('Print');
        const iframe = {
            contentDocument: iframeDocument
        };

        callback?.({
            iframe,
            launchPrint
        });
    });
    const onBeforePrint = vi.fn();
    const onAfterPrint = vi.fn();
    const Printd = vi.fn().mockImplementation(() => ({
        onBeforePrint,
        onAfterPrint,
        print
    }));

    return {
        Printd,
        print,
        launchPrint
    };
});

vi.mock('printd', () => ({
    Printd: mocks.Printd
}));

import { openPrintModal } from '../src/utils/printModal';
import { DEFAULT_SETTINGS } from '../src/types';

function getMockNotices(): string[] {
    const globalWithNoticeStore = globalThis as typeof globalThis & {
        __obsidianMockNotices?: string[];
    };

    if (!globalWithNoticeStore.__obsidianMockNotices) {
        globalWithNoticeStore.__obsidianMockNotices = [];
    }

    return globalWithNoticeStore.__obsidianMockNotices;
}

describe('openPrintModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getMockNotices().length = 0;
        Platform.isDesktop = true;
        Platform.isMobile = false;
        Platform.isDesktopApp = true;
        Platform.isMobileApp = false;
        delete (window as unknown as Window & { require?: unknown }).require;
    });

    it('does not touch Electron when debug mode is enabled on mobile', async () => {
        Platform.isDesktop = false;
        Platform.isMobile = true;
        Platform.isDesktopApp = false;
        Platform.isMobileApp = true;

        const requireSpy = vi.fn();
        (window as unknown as Window & { require?: typeof requireSpy }).require = requireSpy;

        await openPrintModal(
            'Mobile note',
            document.createElement('div'),
            {
                ...DEFAULT_SETTINGS,
                debugMode: true
            },
            'body { color: black; }'
        );

        expect(requireSpy).not.toHaveBeenCalled();
        expect(getMockNotices()).toContain('Debug mode is only available in Obsidian desktop.');
        expect(mocks.launchPrint).toHaveBeenCalledOnce();
    });

    it('opens the Electron debug preview on desktop when debug mode is enabled', async () => {
        const loadURL = vi.fn();
        const openDevTools = vi.fn();
        const onDidFinishLoad = vi.fn((eventName: string, callback: () => void) => {
            if (eventName === 'did-finish-load') {
                callback();
            }
        });
        const BrowserWindow = vi.fn().mockImplementation(() => ({
            loadURL,
            webContents: {
                on: onDidFinishLoad,
                openDevTools
            }
        }));
        const requireSpy = vi.fn(() => ({
            remote: {
                BrowserWindow
            }
        }));

        (window as unknown as Window & { require?: typeof requireSpy }).require = requireSpy;

        await openPrintModal(
            'Desktop note',
            document.createElement('div'),
            {
                ...DEFAULT_SETTINGS,
                debugMode: true
            },
            'body { color: black; }'
        );

        expect(requireSpy).toHaveBeenCalledWith('electron');
        expect(BrowserWindow).toHaveBeenCalledOnce();
        expect(loadURL).toHaveBeenCalledOnce();
        expect(openDevTools).toHaveBeenCalledOnce();
        expect(mocks.launchPrint).toHaveBeenCalledOnce();
    });
});
