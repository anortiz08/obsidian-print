# Changelog

## 0.4.1 - 2026-04-02

- Improved printed properties/frontmatter styling to better match Obsidian's properties UI instead of a generic export table.
- Added richer frontmatter rendering for booleans, chip-style arrays, nested objects, and external links in printed output.
- Made printed properties more compact so they consume less page space.
- Forced the print document into light mode so exports stay readable even when Obsidian is using a dark theme.
- Expanded test coverage for properties rendering and light-theme print behavior.

## 0.4.0 - 2026-04-02

- Added a setting to print note frontmatter/properties above the note content.
- Added support for inheriting note `cssclasses` into printed output, including folder prints.
- Added support for printing rendered Obsidian Bases views instead of empty `.base` source output.
- Added support for rendering Mermaid diagrams in the print document instead of printing raw fenced code.
- Added basic print styling for Obsidian callouts and improved theme/runtime style carry-over for callouts, Mermaid, code blocks, and MathJax.
- Improved printed rendering for code blocks, syntax highlighting, tables, nested task lists, and indented checklists.
- Fixed folder print ordering so folder notes stay first and quoted note titles sort more like the Obsidian vault view.
- Fixed a blank-PDF regression by scoping runtime CSS capture to the actual printed content.
- Removed the unused preview-only print path and expanded Vitest coverage for the new print behavior.

See the [releases page](https://github.com/marijnbent/obsidian-print/releases) for the full release history.
