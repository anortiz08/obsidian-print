export function syncPrintableCloneState(sourceRoot: HTMLElement, targetRoot: HTMLElement): void {
    const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))];
    const targetElements = [targetRoot, ...Array.from(targetRoot.querySelectorAll<HTMLElement>('*'))];

    sourceElements.forEach((sourceElement, index) => {
        const targetElement = targetElements[index];
        if (!targetElement) {
            return;
        }

        if (sourceElement instanceof HTMLCanvasElement && targetElement instanceof HTMLCanvasElement) {
            replaceCanvasWithImage(sourceElement, targetElement);
        }
    });
}

function replaceCanvasWithImage(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement): void {
    const dataUrl = getCanvasDataUrl(sourceCanvas);
    if (!dataUrl || !targetCanvas.parentNode) {
        return;
    }

    const imageElement = targetCanvas.ownerDocument.createElement('img');

    Array.from(sourceCanvas.attributes).forEach((attribute) => {
        imageElement.setAttribute(attribute.name, attribute.value);
    });

    imageElement.src = dataUrl;

    if (!imageElement.hasAttribute('alt')) {
        imageElement.alt = '';
    }

    if (sourceCanvas.width > 0) {
        imageElement.width = sourceCanvas.width;
    }

    if (sourceCanvas.height > 0) {
        imageElement.height = sourceCanvas.height;
    }

    targetCanvas.parentNode.replaceChild(imageElement, targetCanvas);
}

function getCanvasDataUrl(canvas: HTMLCanvasElement): string | null {
    if (typeof canvas.toDataURL !== 'function') {
        return null;
    }

    try {
        return canvas.toDataURL();
    } catch (error) {
        return null;
    }
}
