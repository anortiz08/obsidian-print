import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import PrintPlugin from './main';
import { getPrintSnippet, isPrintSnippetEnabled, setPrintSnippetEnabled } from './utils/generatePrintStyles';
import { PrintPluginSettings } from './types';

export class PrintSettingTab extends PluginSettingTab {
    plugin: PrintPlugin;

    constructor(app: App, plugin: PrintPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const hasPrintSnippet = getPrintSnippet(this.app);
        const isPrintSnippetActive = hasPrintSnippet && isPrintSnippetEnabled(this.app);

        containerEl.empty();

        this.addSectionHeading(containerEl, 'Content');

        this.addToggleSetting(
            containerEl,
            'Print note title',
            'Include the note title in the printout.',
            'printTitle'
        );
        this.addToggleSetting(
            containerEl,
            'Print properties',
            'Include the note properties/frontmatter block at the top of the printout.',
            'printFrontmatter'
        );

        this.addSectionHeading(containerEl, 'Styling');

        this.addToggleSetting(
            containerEl,
            'Normalize style',
            'Use a neutral built-in print style instead of carrying over the active Obsidian theme styling. Helpful when your theme is too decorative for printing.',
            'normalizeStyle',
            async () => this.display()
        );

        if (this.plugin.settings.normalizeStyle) {
            this.addTextSetting(
                containerEl,
                'Font size',
                'Set the body font size for normalized print output.',
                'fontSize'
            );

            const headings = ['h1Size', 'h2Size', 'h3Size', 'h4Size', 'h5Size', 'h6Size'] as const;

            headings.forEach((heading, index) => {
                this.addTextSetting(
                    containerEl,
                    `Heading ${index + 1} size`,
                    `Set the size for <h${index + 1}> elements in normalized print output.`,
                    heading
                );
            });
        }

        this.addToggleSetting(
            containerEl,
            'Inherit note `cssclasses`',
            'Apply Obsidian note `cssclasses` from frontmatter/properties to the printed output. For folder printing, each note keeps its own classes.',
            'inheritNoteCssClasses'
        );

        this.addSectionHeading(containerEl, 'Layout');

        this.addToggleSetting(
            containerEl,
            'Combine folder notes',
            'When printing a folder, combine all notes into a single document. If disabled, each note will start on a new page.',
            'combineFolderNotes'
        );
        this.addToggleSetting(
            containerEl,
            'Treat horizontal lines as page breaks',
            'Enable this option to interpret horizontal lines (---) as page breaks.',
            'hrPageBreaks'
        );

        this.addSectionHeading(containerEl, 'Advanced');

        new Setting(containerEl)
            .setName('Custom CSS')
            .setDesc('Enable a snippet named `print.css` from Appearance > CSS snippets. Use it for print-specific overrides wrapped in `@media print` or scoped to `.obsidian-print`.')
            .addToggle(toggle => toggle
                .setValue(isPrintSnippetActive)
                .onChange(async (value) => {
                    setPrintSnippetEnabled(this.app, value);
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!hasPrintSnippet);

        this.addToggleSetting(
            containerEl,
            Platform.isMobileApp ? 'Debug mode (Desktop only)' : 'Debug mode',
            Platform.isMobileApp
                ? 'This inspection window is only available in Obsidian desktop. On mobile, printing continues without opening a debug preview.'
                : 'Enable debug mode. This will open the print window for inspection.',
            'debugMode'
        );
    }

    private addSectionHeading(containerEl: HTMLElement, text: string): void {
        containerEl.createEl('h3', { text });
    }

    private addToggleSetting<K extends ToggleSettingKey>(
        containerEl: HTMLElement,
        name: string,
        description: string,
        key: K,
        onAfterChange?: () => void | Promise<void>
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(description)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings[key])
                .onChange(async (value) => {
                    this.plugin.settings[key] = value;
                    await this.plugin.saveSettings();
                    await onAfterChange?.();
                }));
    }

    private addTextSetting<K extends TextSettingKey>(
        containerEl: HTMLElement,
        name: string,
        description: string,
        key: K
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(description)
            .addText(text => text
                .setPlaceholder(this.plugin.settings[key])
                .setValue(this.plugin.settings[key])
                .onChange(async (value) => {
                    this.plugin.settings[key] = value;
                    await this.plugin.saveSettings();
                }));
    }
}

type ToggleSettingKey = {
    [Key in keyof PrintPluginSettings]: PrintPluginSettings[Key] extends boolean ? Key : never;
}[keyof PrintPluginSettings];

type TextSettingKey = {
    [Key in keyof PrintPluginSettings]: PrintPluginSettings[Key] extends string ? Key : never;
}[keyof PrintPluginSettings];
