export class Plugin {
    app: unknown;
    manifest: unknown;

    constructor(app?: unknown, manifest?: unknown) {
        this.app = app;
        this.manifest = manifest;
    }

    addCommand(): void {}

    addSettingTab(): void {}

    addRibbonIcon(): void {}

    registerEvent(callback: unknown): unknown {
        return callback;
    }

    async loadData(): Promise<Record<string, unknown>> {
        return {};
    }

    async saveData(): Promise<void> {}
}

export class Notice {
    message: string;

    constructor(message: string) {
        this.message = message;
    }
}

export class TFile {
    path: string;
    basename: string;
    extension: string;
    parent: TFolder | null;

    constructor(path = '', basename = '', extension = 'md', parent: TFolder | null = null) {
        this.path = path;
        this.basename = basename;
        this.extension = extension;
        this.parent = parent;
    }
}

export class TFolder {
    name: string;
    children: Array<TFile | TFolder>;

    constructor(name = '', children: Array<TFile | TFolder> = []) {
        this.name = name;
        this.children = children;
    }
}

export class MarkdownView {
    file?: TFile;
    editor: { getSelection: () => string };

    constructor(file?: TFile, selection = '') {
        this.file = file;
        this.editor = {
            getSelection: () => selection
        };
    }

    async save(): Promise<void> {}
}

export class PluginSettingTab {
    app: unknown;
    plugin: unknown;
    containerEl: HTMLDivElement;

    constructor(app: unknown, plugin: unknown) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
    }
}

export class Setting {
    constructor(_containerEl: HTMLElement) {}

    setName(): this {
        return this;
    }

    setDesc(): this {
        return this;
    }

    addToggle(callback: (toggle: {
        setValue: (value: boolean) => unknown;
        onChange: (handler: (value: boolean) => void | Promise<void>) => unknown;
    }) => unknown): this {
        callback({
            setValue: () => this,
            onChange: () => this
        });

        return this;
    }

    addText(callback: (text: {
        setPlaceholder: (value: string) => unknown;
        setValue: (value: string) => unknown;
        onChange: (handler: (value: string) => void | Promise<void>) => unknown;
    }) => unknown): this {
        callback({
            setPlaceholder: () => this,
            setValue: () => this,
            onChange: () => this
        });

        return this;
    }

    setDisabled(): this {
        return this;
    }
}
