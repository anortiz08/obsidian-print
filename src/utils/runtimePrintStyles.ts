const TARGET_SELECTOR_PATTERNS = [
    /mjx-/i,
    /mathjax/i,
    /mermaid/i,
    /(^|[^a-z-])pre([^a-z-]|$)/i,
    /(^|[^a-z-])code([^a-z-]|$)/i,
    /(^|[^a-z-])callout([^a-z-]|$)/i,
    /data-callout/i,
    /callout-title/i,
    /callout-content/i,
    /callout-icon/i,
    /callout-fold/i,
    /\.token\b/i,
    /language-/i
];

const CSS_VARIABLE_PATTERN = /var\((--[\w-]+)/g;

export function getTargetedRuntimePrintCss(): string {
    const collectedRules: string[] = [];
    const seenRules = new Set<string>();
    const usedVariables = new Set<string>();

    Array.from(document.styleSheets).forEach((sheet) => {
        collectStyleSheetRules(sheet, collectedRules, seenRules, usedVariables);
    });

    const variableCss = buildVariableCss(usedVariables);

    return [variableCss, ...collectedRules]
        .filter((cssText) => cssText.trim().length > 0)
        .join('\n');
}

export function applyRuntimePrintClasses(doc: Document): void {
    doc.documentElement.className = document.documentElement.className;

    const classNames = [
        doc.body.className,
        'obsidian-print',
        document.body.className
    ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean);

    doc.body.className = Array.from(new Set(classNames)).join(' ');
}

export function createDebugPrintHtml(
    content: HTMLElement,
    cssText: string,
    title = 'Print note',
    bodyClasses: string[] = []
): string {
    const htmlElement = document.createElement('html');
    htmlElement.className = document.documentElement.className;

    const headElement = document.createElement('head');
    const metaElement = document.createElement('meta');
    metaElement.setAttribute('charset', 'utf-8');
    headElement.appendChild(metaElement);

    const titleElement = document.createElement('title');
    titleElement.textContent = title;
    headElement.appendChild(titleElement);

    const styleElement = document.createElement('style');
    styleElement.textContent = cssText;
    headElement.appendChild(styleElement);

    htmlElement.appendChild(headElement);

    const bodyElement = document.createElement('body');
    applyRuntimePrintClassesToElement(bodyElement);
    if (bodyClasses.length > 0) {
        bodyElement.classList.add(...bodyClasses);
    }
    bodyElement.appendChild(content.cloneNode(true));

    htmlElement.appendChild(bodyElement);

    return `<!DOCTYPE html>${htmlElement.outerHTML}`;
}

function collectStyleSheetRules(
    sheet: StyleSheet,
    collectedRules: string[],
    seenRules: Set<string>,
    usedVariables: Set<string>
): void {
    const cssSheet = sheet as CSSStyleSheet;
    let rules: CSSRuleList;

    try {
        rules = cssSheet.cssRules;
    } catch (error) {
        return;
    }

    collectRuleList(rules, collectedRules, seenRules, usedVariables);
}

function collectRuleList(
    rules: CSSRuleList,
    collectedRules: string[],
    seenRules: Set<string>,
    usedVariables: Set<string>
): void {
    Array.from(rules).forEach((rule) => {
        if (rule.type === CSSRule.STYLE_RULE) {
            const styleRule = rule as CSSStyleRule;
            if (!matchesTargetSelector(styleRule.selectorText)) {
                return;
            }

            addRuleText(styleRule.cssText, collectedRules, seenRules);
            collectVariables(styleRule.cssText, usedVariables);
            return;
        }

        if (rule.type === CSSRule.MEDIA_RULE) {
            const mediaRule = rule as CSSMediaRule;
            const nestedRules: string[] = [];

            collectRuleList(mediaRule.cssRules, nestedRules, seenRules, usedVariables);

            if (nestedRules.length > 0) {
                addRuleText(
                    `@media ${mediaRule.conditionText} {\n${nestedRules.join('\n')}\n}`,
                    collectedRules,
                    seenRules
                );
            }
            return;
        }

        if (rule.type === CSSRule.IMPORT_RULE) {
            const importRule = rule as CSSImportRule;
            if (importRule.styleSheet) {
                collectStyleSheetRules(importRule.styleSheet, collectedRules, seenRules, usedVariables);
            }
        }
    });
}

function matchesTargetSelector(selectorText: string): boolean {
    return TARGET_SELECTOR_PATTERNS.some((pattern) => pattern.test(selectorText));
}

function collectVariables(cssText: string, usedVariables: Set<string>): void {
    let match = CSS_VARIABLE_PATTERN.exec(cssText);

    while (match) {
        usedVariables.add(match[1]);
        match = CSS_VARIABLE_PATTERN.exec(cssText);
    }

    CSS_VARIABLE_PATTERN.lastIndex = 0;
}

function buildVariableCss(usedVariables: Set<string>): string {
    if (usedVariables.size === 0) {
        return '';
    }

    const computedRoots = [
        getComputedStyle(document.documentElement),
        getComputedStyle(document.body)
    ];
    const resolvedVariables: string[] = [];

    Array.from(usedVariables).forEach((variableName) => {
        for (const styles of computedRoots) {
            const value = styles.getPropertyValue(variableName).trim();

            if (!value) {
                continue;
            }

            resolvedVariables.push(`    ${variableName}: ${value};`);
            break;
        }
    });

    if (resolvedVariables.length === 0) {
        return '';
    }

    return `:root {\n${resolvedVariables.join('\n')}\n}`;
}

function addRuleText(cssText: string, collectedRules: string[], seenRules: Set<string>): void {
    if (seenRules.has(cssText)) {
        return;
    }

    seenRules.add(cssText);
    collectedRules.push(cssText);
}

function applyRuntimePrintClassesToElement(bodyElement: HTMLElement): void {
    const classNames = [
        'obsidian-print',
        document.body.className
    ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean);

    bodyElement.className = Array.from(new Set(classNames)).join(' ');
}
