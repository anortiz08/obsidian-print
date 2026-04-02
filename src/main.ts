import { Plugin, Notice, TFile, TFolder, MarkdownView } from 'obsidian';
import { PrintSettingTab } from './settings';
import { PrintPluginSettings, DEFAULT_SETTINGS } from './types';
import { openPrintModal } from './utils/printModal';
import { generatePreviewContent } from './utils/generatePreviewContent';
import { generatePrintStyles } from './utils/generatePrintStyles';
import { getFolderByActiveFile } from './utils/getFolderByActiveFile';
import { getNoteCssClasses } from './utils/getNoteCssClasses';

export default class PrintPlugin extends Plugin {
    settings: PrintPluginSettings;

    async onload() {
        console.log('Print plugin loaded');
        const loadedSettings = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings);

        if (
            loadedSettings?.inheritNoteCssClasses === undefined &&
            typeof loadedSettings?.extraClasses === 'boolean'
        ) {
            this.settings.inheritNoteCssClasses = loadedSettings.extraClasses;
        }

        this.addCommand({
            id: 'print-note',
            name: 'Current note',
            callback: async () => await this.printNote(),
        });

        this.addCommand({
            id: 'print-selection',
            name: 'Print selection',
            callback: async () => await this.printSelection(),
        });

        this.addCommand({
            id: 'print-folder-notes',
            name: 'All notes in current folder',
            callback: async () => await this.printFolder(),
        });

        this.addSettingTab(new PrintSettingTab(this.app, this));

        this.addRibbonIcon('printer', 'Print note', async () => {
            await this.printNote();
        });

        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFile) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Print note')
                            .setIcon('printer')
                            .onClick(async () => await this.printNote(file));
                    });
                } else {
                    menu.addItem((item) => {
                        item
                            .setTitle('Print all notes in folder')
                            .setIcon('printer')
                            .onClick(async () => await this.printFolder(file as TFolder));
                    });
                }
            })
        );

        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu) => {
                menu.addItem((item) => {
                    item
                        .setTitle('Print note')
                        .setIcon('printer')
                        .onClick(async () => await this.printNote());
                })
                menu.addItem((item) => {
                    item
                        .setTitle('Print selection')
                        .setIcon('printer')
                        .onClick(async () => await this.printSelection());
                });
            })
        );
    }

    async printNote(file?: TFile) {
        // if file is the active note, save it too
        if (!file || file === this.app.workspace.getActiveFile()) {
            file = await this.saveActiveFile() as TFile
        }

        if (!file) {
            new Notice('No note to print.');
            return;
        }

        const noteCssClasses = this.settings.inheritNoteCssClasses
            ? getNoteCssClasses(this.app, file)
            : [];

        const content = await generatePreviewContent(
            file,
            this.settings.printTitle,
            this.app,
            this.settings.printFrontmatter
        );
        if (!content) {
            return;
        }

        content.classList.add(...noteCssClasses);

        const cssString = await generatePrintStyles(this.app, this.manifest, this.settings);
        await openPrintModal(file.basename, content, this.settings, cssString, noteCssClasses);
    }

    async printSelection() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('No active note.');
            return;
        }
    
        const selection = activeView.editor.getSelection();
        if (!selection) {
            new Notice('No text selected.');
            return;
        }

        const noteCssClasses = this.settings.inheritNoteCssClasses
            ? getNoteCssClasses(this.app, activeView.file)
            : [];
    
        const content = await generatePreviewContent(selection, false, this.app, false);
        if (!content) {
            return;
        }

        content.classList.add(...noteCssClasses);
    
        const cssString = await generatePrintStyles(this.app, this.manifest, this.settings);
        const printTitle = activeView.file?.basename
            ? `${activeView.file.basename} snippet`
            : 'Selection';
        await openPrintModal(printTitle, content, this.settings, cssString, noteCssClasses);
    }

    async printFolder(folder?: TFolder) {

        if (!folder) {
            await this.saveActiveFile()
        }

        const activeFolder = folder || await getFolderByActiveFile(this.app);

        if (!activeFolder) {
            new Notice('Could not resolve folder.');
            return;
        }

        const files = activeFolder.children.filter((file) => file instanceof TFile && file.extension === 'md') as TFile[];

        if (files.length === 0) {
            new Notice('No markdown files found in the folder.');
            return;
        }

        const folderContent = createDiv();

        for (const file of files) {
            const content = await generatePreviewContent(
                file,
                this.settings.printTitle,
                this.app,
                this.settings.printFrontmatter
            );

            if (!content) {
                continue;
            }

            if (this.settings.inheritNoteCssClasses) {
                content.classList.add(...getNoteCssClasses(this.app, file));
            }

            if (!this.settings.combineFolderNotes) {
                content.addClass('obsidian-print-page-break');
            }

            folderContent.append(content);
        }

        const cssString = await generatePrintStyles(this.app, this.manifest, this.settings);
        await openPrintModal(activeFolder.name, folderContent, this.settings, cssString);
    }

    /**
     * Save the active file before printing, so we can retrieve the most recent content.
     */
    async saveActiveFile(): Promise<TFile | null> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (activeView) {
            await activeView.save();
        }

        return this.app.workspace.getActiveFile();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
