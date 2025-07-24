// Cross-browser API support
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// === Initialization of sample prompts on install ===
browserAPI.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        const storage = new PromptStorage();

        const samplePrompts = [
            {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: 'Code Review Request',
                content: 'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance optimizations\n4. Readability improvements\n\nCode:\n[Paste your code here]',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageCount: 0,
                tags: [],
                favorite: false
            },
            {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: 'Explain Like I\'m 5',
                content: 'Please explain the following concept in very simple terms, as if you\'re explaining it to a 5-year-old child.\n\n[Insert topic here]',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageCount: 0,
                tags: [],
                favorite: false
            },
            {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: 'Professional Email',
                content: 'Please help me write a professional email with the following details:\n\nTo: [Recipient]\nSubject: [Subject]\nContext: [Brief context]\nPurpose: [What you want to achieve]\nTone: [Professional/Friendly/Formal]',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageCount: 0,
                tags: [],
                favorite: false
            }
        ];

        try {
            for (const prompt of samplePrompts) {
                await storage.savePrompt(prompt);
            }
            console.log('Sample prompts initialized');
        } catch (error) {
            console.error('Error initializing prompts:', error);
        }
    }

    // Create context menu if supported
    if (browserAPI.menus && browserAPI.menus.create) {
        browserAPI.menus.create({
            id: 'addToPrompts',
            title: 'Save as Prompt Template',
            contexts: ['selection']
        });
    }
});

// === Toolbar icon click handling ===
if (browserAPI.browserAction && browserAPI.browserAction.onClicked) {
    browserAPI.browserAction.onClicked.addListener(async (tab) => {
        const supportedSites = [
            'chat.openai.com',
            'claude.ai',
            'grok.x.com',
            'gemini.google.com',
            'perplexity.ai'
        ];

        const isSupported = supportedSites.some(site => tab.url && tab.url.includes(site));

        if (!isSupported && browserAPI.notifications && browserAPI.notifications.create) {
            try {
                await browserAPI.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'LLM Prompt Manager',
                    message: 'This extension works on AI chat platforms like ChatGPT, Claude, Gemini, etc.'
                });
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    });
}

// === Context Menu Click Handling ===
if (browserAPI.menus && browserAPI.menus.onClicked) {
    browserAPI.menus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === 'addToPrompts' && info.selectionText) {
            const storage = new PromptStorage();
            try {
                const newPrompt = {
                    title: `Saved from ${new URL(tab.url).hostname}`,
                    content: info.selectionText,
                    tags: []
                };
                await storage.savePrompt(newPrompt);

                if (browserAPI.notifications && browserAPI.notifications.create) {
                    await browserAPI.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Prompt Saved!',
                        message: 'Selected text has been saved as a prompt template.'
                    });
                }
            } catch (error) {
                console.error('Error saving prompt:', error);
            }
        }
    });
}

// === Sync prompt changes across tabs ===
browserAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.prompts) {
        browserAPI.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && tab.id) {
                    browserAPI.tabs.sendMessage(tab.id, {
                        type: 'PROMPTS_UPDATED',
                        prompts: changes.prompts.newValue
                    }, () => {
                        // Ignore errors (e.g., no content script)
                    });
                }
            });
        });
    }
});

// === Message handling from content scripts ===
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const storage = new PromptStorage();

    if (request.type === 'GET_PROMPTS') {
        storage.getAllPrompts().then(prompts => {
            sendResponse({ prompts: prompts || [] });
        }).catch(error => {
            console.error('Error fetching prompts:', error);
            sendResponse({ prompts: [] });
        });
        return true; // Async
    }

    if (request.type === 'SAVE_PROMPT') {
        storage.savePrompt(request.prompt).then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            console.error('Error saving prompt:', error);
            sendResponse({ success: false });
        });
        return true; // Async
    }
});

/*
// === Periodic Cleanup Alarm ===
browserAPI.alarms.create('cleanup', { periodInMinutes: 60 * 24 });

browserAPI.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanup') {
        const storage = new PromptStorage();
        try {
            const prompts = await storage.getAllPrompts();
            if (prompts.length > 100) {
                const trimmed = prompts.slice(0, 100);
                await browserAPI.storage.local.set({ prompts: trimmed });
                console.log('Prompt cleanup complete: kept latest 100');
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }
});
*/