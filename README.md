# promptStore

This document serves as the official documentation for this extension as well as my learnings from making this.

## Screenshots

<img width="404" height="286" alt="Screenshot from 2025-07-26 18-09-26" src="https://github.com/user-attachments/assets/c16062c5-f930-4ea2-aac6-7b543884157a" />
<img width="404" height="307" alt="Screenshot from 2025-07-26 18-08-59" src="https://github.com/user-attachments/assets/d79302b4-fbcb-4d20-999d-54d0444154ba" />
<img width="404" height="307" alt="Screenshot from 2025-07-26 18-07-45" src="https://github.com/user-attachments/assets/c1012eb7-03f9-40b6-9cd1-71185c9d1832" />



## Repo Structure

```
./
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html         # Main popup interface
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styling
├── content/
│   └── content.js         # Content script for detecting LLM sites
├── background/
│   └── background.js      # Background script for extension lifecycle
├── icons/
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── storage/
    └── storage.js         # Storage management utilities
```

## `manifest.json`

This is one file that must be present on every extension. It tells the manifest version which in turn tells the engine version and the associated capabilities. It also links to several other components of the extension. Every extension using WebExtension APIs must contain it. Using `manifest.json`, you specify basic metadata about your extension such as the name and version, and can also specify aspects of your extension's functionality like background scripts, content scripts, and browser actions.

It is a JSON-formatted file, with one exception: it is allowed to contain `//`-style comments.

## Background Scripts

Extensions often need to respond to events that occur in the browser independently of the lifetime of any particular web page or browser window. That is what background scripts are for.

Background scripts can be persistent or non-persistent. Persistent background scripts load as soon as the extension loads and stay loaded until the extension is disabled or uninstalled. This behavior is only available in Manifest V2. Non-persistent background scripts load when needed to respond to an event and unload when idle. This is an option in Manifest V2 and the only behavior available in Manifest V3.

Therefore for future compatibility, I have left persistency to be off.

## UI Components

Your extension can include various user interface components whose content is defined using an HTML document:

- **Sidebar**: A pane displayed at the left-hand side of the browser window next to the web page.
- **Popup**: A dialog displayed when the user clicks on a toolbar or address bar button.
- **Options**: A page shown when the user accesses your add-on’s preferences in the browser’s native add-ons manager.

For each of these components, you create an HTML file and point to it using a specific property in `manifest.json`. The HTML file can include CSS and JavaScript just like a normal web page.

## Extension Pages

We can also include HTML documents in our extension which are not attached to some predefined UI component. These pages don’t have an entry in `manifest.json` but get access to the same privileged WebExtension APIs as the background script. We typically load a page like this using `windows.create()` or `tabs.create()`.

## Content Scripts

Use content scripts to access and manipulate web pages. Content scripts are loaded into web pages and run in the context of that page. They are extension-provided scripts which run in the context of a web page; this differs from scripts loaded by the page itself, including those in `<script>` elements.

Content scripts can see and manipulate the page's DOM, like normal scripts, but can also:
- Use a small subset of WebExtension APIs
- Exchange messages with background scripts and indirectly access all WebExtension APIs

They cannot directly access page scripts but can exchange messages with them using `window.postMessage()`. Usually, content scripts are JavaScript, but CSS can also be injected into web pages using the same mechanism.

## Web Accessible Resources

Web accessible resources are images, HTML, CSS, and JavaScript that we include in the extension and want to make accessible to content and page scripts. They can be referenced using a special URI scheme.

## `storage/storage.js`

It is a storage utility. It allows a max of 500 prompts to be stored with storage key: `"prompts"`.
