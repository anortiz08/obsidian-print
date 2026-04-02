import { App, PluginSettingTab, Setting } from 'obsidian';
import PrintPlugin from './main';
import { getPrintSnippet, isPrintSnippetEnabled } from './utils/generatePrintStyles';

export class PrintSettingTab extends PluginSettingTab {
    plugin: PrintPlugin;

    constructor(app: App, plugin: PrintPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Print note title')
            .setDesc('Include the note title in the printout.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.printTitle)
                .onChange(async (value) => {
                    this.plugin.settings.printTitle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Font size')
            .setDesc('Set the font size for the printed note.')
            .addText(text => text
                .setPlaceholder('14px')
                .setValue(this.plugin.settings.fontSize)
                .onChange(async (value) => {
                    this.plugin.settings.fontSize = value;
                    await this.plugin.saveSettings();
                }));



        const headings = ['h1Size', 'h2Size', 'h3Size', 'h4Size', 'h5Size', 'h6Size'] as const;

        headings.forEach((heading, index) => {
            new Setting(containerEl)
                .setName(`Heading ${index + 1} size`)
                .setDesc(`Set the size for <h${index + 1}> elements.`)
                .addText(text => text
                    .setPlaceholder(`${this.plugin.settings[heading]}`)
                    .setValue(this.plugin.settings[heading])
                    .onChange(async (value) => {
                        this.plugin.settings[heading] = value;
                        await this.plugin.saveSettings();
                    }));
        });

        new Setting(containerEl)
            .setName('Combine folder notes')
            .setDesc('When printing a folder, combine all notes into a single document. If disabled, each note will start on a new page.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.combineFolderNotes)
                .onChange(async (value) => {
                    this.plugin.settings.combineFolderNotes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Treat horizontal lines as page breaks')
            .setDesc('Enable this option to interpret horizontal lines (---) as page breaks ')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hrPageBreaks)
                .onChange(async (value) => {
                    this.plugin.settings.hrPageBreaks = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable debug mode. This will open the print window for inspection.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Extra Classes')
            .setDesc('When using @media print, any `customCssClasses` in the frontmatter will also get added to the document. This helps if you have multiple formats you want to be able to print into (Only works for printing notes, not folders or selections).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.extraClasses)
                .onChange(async (value) => {
                    this.plugin.settings.extraClasses = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Custom CSS')
            .setDesc(`You can add a custom "print.css" to "Appearance > CSS snippets", then this toggle will be enabled and synced with CSS snippets. The easier way is to add your styles using @media print {body {...}}.`)
            .addToggle(toggle => toggle
                .setValue(getPrintSnippet(this.app) && isPrintSnippetEnabled(this.app))
                .onChange(async (value) => {
                    this.app.customCss.setCssEnabledStatus("print", value);
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!getPrintSnippet(this.app));
    }
}
