import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'obsidian';

const mocks = vi.hoisted(() => {
    const launchPrint = vi.fn();
    let lastPrintedElement: HTMLElement | null = null;
    const print = vi.fn((content, _styles, _scripts, callback) => {
        const iframeDocument = document.implementation.createHTMLDocument('Print');
        const element = content.cloneNode(true) as HTMLElement;
        lastPrintedElement = element;
        iframeDocument.body.appendChild(element);
        const iframe = {
            contentDocument: iframeDocument
        };

        callback?.({
            iframe,
            element,
            launchPrint
        });
    });
    const onBeforePrint = vi.fn();
    const onAfterPrint = vi.fn();
    const Printd = vi.fn().mockImplementation(function Printd() {
        return {
            onBeforePrint,
            onAfterPrint,
            print
        };
    });

    return {
        Printd,
        print,
        launchPrint,
        getLastPrintedElement: () => lastPrintedElement,
        resetLastPrintedElement: () => {
            lastPrintedElement = null;
        }
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
        mocks.resetLastPrintedElement();
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
        const BrowserWindow = vi.fn().mockImplementation(function BrowserWindow() {
            return {
                loadURL,
                webContents: {
                    on: onDidFinishLoad,
                    openDevTools
                }
            };
        });
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

    it('preserves canvas-rendered content in the printable clone', async () => {
        const content = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        canvas.setAttribute('aria-label', 'Page 1');

        Object.defineProperty(canvas, 'toDataURL', {
            value: vi.fn(() => 'data:image/png;base64,pdf-page')
        });

        content.appendChild(canvas);

        await openPrintModal(
            'PDF note',
            content,
            DEFAULT_SETTINGS,
            'body { color: black; }'
        );

        const printedImage = mocks.getLastPrintedElement()?.querySelector('img');
        expect(printedImage?.getAttribute('src')).toBe('data:image/png;base64,pdf-page');
        expect(printedImage?.className).toBe('pdf-page');
        expect(printedImage?.getAttribute('aria-label')).toBe('Page 1');
        expect(mocks.getLastPrintedElement()?.querySelector('canvas')).toBeNull();
    });
});
