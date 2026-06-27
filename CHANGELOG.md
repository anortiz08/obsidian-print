# Changelog

## 0.5.6 - 2026-06-27

- Fixed Android printing: the note now opens directly in the device's default browser after saving, where the browser's native print/share menu can be used.

## 0.5.5 - 2026-06-27

- Added mobile printing support.
- On iOS, printing uses the native AirPrint dialog via WKWebView.
- On Android, the note is shared as an HTML file via the system share sheet; falls back to saving an HTML file to the vault root if file sharing is unavailable.

## 0.5.4 - 2026-04-30

- Fixed themed property printing adding a blank first page.
- Removed duplicated native metadata from generated note prints.

## 0.5.3 - 2026-04-18

- Fixed PDF printing when the rendered document is canvas-based.
- Preserved rendered pages in the print iframe and debug preview.

## 0.5.2 - 2026-04-16

- Disabled plugin install on mobile.
- Fixed PNG printing as rendered output.

## 0.5.1 - 2026-04-16

- Fixed printing rendered non-markdown files such as PNG images.
- Show a notice when a non-markdown file is not open in a printable view.

## 0.5.0 - 2026-04-03

- Improved printed properties/frontmatter styling.
- Added richer frontmatter rendering for booleans, arrays, objects, and links.
- Added a normalized print style option.
- Reused rendered previews and Bases views when available.
- Forced printed output into light mode for readability.
- Expanded print behavior test coverage.
