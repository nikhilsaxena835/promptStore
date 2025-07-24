(function() {
    'use strict';

    const platformDetection = {
        'chat.openai.com': 'ChatGPT',
        'claude.ai': 'Claude',
        'grok.x.com': 'Grok',
        'gemini.google.com': 'Gemini',
        'perplexity.ai': 'Perplexity'
    };

    function detectPlatform() {
        const hostname = window.location.hostname;
        for (const [domain, platform] of Object.entries(platformDetection)) {
            if (hostname.includes(domain)) {
                return platform;
            }
        }
        return 'Unknown LLM Platform';
    }

    function init() {
        console.log(`Prompt Manager initialized on ${detectPlatform()}`);
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();