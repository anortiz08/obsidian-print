import { Modal, App, ButtonComponent } from 'obsidian';
import { PrintPluginSettings } from '../types';
import { Printd } from 'printd';
import {
    applyRuntimePrintClasses,
    getTargetedRuntimePrintCss
} from './runtimePrintStyles';

export class PrintPreviewModal extends Modal {
    private content: HTMLElement;
    private cssString: string;
    private settings: PrintPluginSettings;

    constructor(
        app: App,
        content: HTMLElement,
        settings: PrintPluginSettings,
        cssString: string
    ) {
        super(app);
        this.content = content;
        this.settings = settings;
        this.cssString = cssString;
    }

    onOpen() {
        const { contentEl } = this;
        const combinedCssString = [this.cssString, getTargetedRuntimePrintCss()]
            .filter((value) => value.trim().length > 0)
            .join('\n');
        
        // Add title
        contentEl.createEl('h2', { text: 'Print Preview' });
        
        // Create preview container
        const previewContainer = contentEl.createDiv('print-preview-container');
        previewContainer.appendChild(this.content.cloneNode(true));
        
        // Apply print styles to preview
        const styleEl = contentEl.createEl('style');
        styleEl.textContent = combinedCssString;
        
        // Add print button
        const buttonContainer = contentEl.createDiv('print-button-container');
        new ButtonComponent(buttonContainer)
            .setButtonText('Print')
            .onClick(() => {
                const d = new Printd();
                d.print(this.content, [combinedCssString], undefined, ({ iframe, launchPrint }) => {
                    if (iframe.contentDocument) {
                        applyRuntimePrintClasses(iframe.contentDocument);
                    }

                    launchPrint();
                });
                this.close();
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
