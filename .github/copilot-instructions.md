# Copilot Instructions for FireDeptApp

## Project Overview

This is a single-page web application for managing fire department resources, built with vanilla HTML, CSS, and JavaScript. The app is structured for maintainability and modularity, with all logic in `script.js`, styles in `style.css`, and markup in `index.html`.

## Architecture

- **HTML (`index.html`)**: Contains the main UI structure, links to external CSS/JS, and modal/editor elements.
- **CSS (`style.css`)**: Defines all visual styles, including grid layouts, button styles, and responsive design.
- **JavaScript (`script.js`)**: Implements all app logic, including:
  - Data storage in `localStorage` under the key `feuerwehr_full_v1`
  - Dynamic rendering of pages and components based on a central `pages` object
  - Drag-and-drop functionality for resource management
  - Modal editor for adding/editing vehicles and resources
  - Search and backup/restore features

## Key Patterns

- **Data Model**: The `pages` object is the single source of truth for all app state. Changes are persisted via `savePages()`.
- **Rendering**: The app uses imperative DOM manipulation. All UI updates are handled by the `render()` function and its helpers.
- **Drag-and-Drop**: Custom drag logic is implemented for resource assignment, with dropzones and long-press rename features.
- **Backup/Restore**: Data can be exported/imported as JSON via the UI, using Blob and FileReader APIs.

## Developer Workflows

- **Live Preview**: Use the Live Server extension or similar to preview changes in real time.
- **Debugging**: All state is accessible via `window.pages` in the browser console for inspection and manual edits.
- **No Build Step**: The project runs directly in the browser; no compilation or bundling required.

## Conventions

- **File Organization**: Keep all logic in `script.js`, styles in `style.css`, and markup in `index.html`.
- **Component Structure**: UI components are created via DOM APIs, not frameworks.
- **State Management**: All persistent state is managed in `localStorage` and the `pages` object.

## Integration Points

- **Browser APIs**: Relies on localStorage, Blob, FileReader, and DOM APIs.
- **No External Dependencies**: The app is fully self-contained; no npm packages or external JS libraries.

## Examples

- To add a new resource type, extend the `defaults` object in `script.js` and update rendering logic as needed.
- To customize styles, edit `style.css` and use CSS variables for theme changes.
