This document serves as the official documentation for this extension as well as my learnings from making this.

The structure of this repo.

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

The manifest.json
This is one file that must be present on every extension. It tells the manifest version which in turn tells the engine version and the associated capabilites. It also links to several other components of the extension.

