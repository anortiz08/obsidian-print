export {};

const globalWithCreateDiv = globalThis as typeof globalThis & {
    createDiv?: () => HTMLDivElement;
};

if (!globalWithCreateDiv.createDiv) {
    globalWithCreateDiv.createDiv = () => document.createElement('div');
}

const htmlElementPrototype = HTMLElement.prototype as HTMLElement & {
    addClass?: (...classNames: string[]) => void;
    createDiv?: (className?: string) => HTMLDivElement;
    createEl?: (tagName: string, options?: { text?: string }) => HTMLElement;
};

if (!htmlElementPrototype.addClass) {
    Object.defineProperty(htmlElementPrototype, 'addClass', {
        value: function addClass(...classNames: string[]) {
            this.classList.add(...classNames);
        }
    });
}

if (!htmlElementPrototype.createDiv) {
    Object.defineProperty(htmlElementPrototype, 'createDiv', {
        value: function createDiv(className?: string) {
            const element = document.createElement('div');
            if (className) {
                element.className = className;
            }

            this.appendChild(element);
            return element;
        }
    });
}

if (!htmlElementPrototype.createEl) {
    Object.defineProperty(htmlElementPrototype, 'createEl', {
        value: function createEl(tagName: string, options?: { text?: string }) {
            const element = document.createElement(tagName);
            if (options?.text) {
                element.textContent = options.text;
            }

            this.appendChild(element);
            return element;
        }
    });
}
