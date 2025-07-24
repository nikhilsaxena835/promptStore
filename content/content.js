(function() {
    'use strict';

    // Detect which LLM platform we're on
    const platformDetection = {
        'chat.openai.com': 'ChatGPT',
        'claude.ai': 'Claude',
        'grok.x.com': 'Grok',
        'gemini.google.com': 'Gemini',
        'you.com': 'You.com',
        'poe.com': 'Poe',
        'huggingface.co': 'Hugging Face',
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

    // Find text input areas on the page
    function findTextInputs() {
        const selectors = [
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="ask"]',
            'textarea[placeholder*="chat"]',
            'textarea[placeholder*="prompt"]',
            'div[contenteditable="true"]',
            'textarea',
            'input[type="text"]'
        ];

        const inputs = [];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Filter out elements that are likely not chat inputs
                const rect = element.getBoundingClientRect();
                if (rect.width > 100 && rect.height > 20 && 
                    !element.hasAttribute('data-prompt-manager-processed')) {
                    inputs.push(element);
                }
            });
        });

        return inputs;
    }

    // Add paste button near text inputs
    function addPasteButtons() {
        const inputs = findTextInputs();
        
        inputs.forEach(input => {
            if (input.hasAttribute('data-prompt-manager-processed')) {
                return;
            }
            
            input.setAttribute('data-prompt-manager-processed', 'true');
            
            // Create paste button
            const pasteButton = document.createElement('div');
            pasteButton.className = 'prompt-manager-paste-btn';
            pasteButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Prompts</span>
            `;
            
            // Style the button
            pasteButton.style.cssText = `
                position: absolute;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            // Position button relative to input
            const positionButton = () => {
                const rect = input.getBoundingClientRect();
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                
                pasteButton.style.left = (rect.right - 80 + scrollX) + 'px';
                pasteButton.style.top = (rect.top - 35 + scrollY) + 'px';
            };
            
            // Add hover effects
            pasteButton.addEventListener('mouseenter', () => {
                pasteButton.style.transform = 'translateY(-2px)';
                pasteButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            
            pasteButton.addEventListener('mouseleave', () => {
                pasteButton.style.transform = 'translateY(0)';
                pasteButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            });
            
            // Handle click to show prompts
            pasteButton.addEventListener('click', () => {
                showPromptSelector(input, pasteButton);
            });
            
            // Add button to page
            document.body.appendChild(pasteButton);
            
            // Position initially and on scroll/resize
            positionButton();
            window.addEventListener('scroll', positionButton);
            window.addEventListener('resize', positionButton);
            
            // Hide/show button based on input focus
            input.addEventListener('focus', () => {
                pasteButton.style.opacity = '1';
                pasteButton.style.pointerEvents = 'auto';
            });
            
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    pasteButton.style.opacity = '0.7';
                }, 100);
            });
        });
    }

    // Show prompt selector dropdown
    function showPromptSelector(targetInput, button) {
        // Remove existing selector if any
        const existingSelector = document.querySelector('.prompt-manager-selector');
        if (existingSelector) {
            existingSelector.remove();
        }

        // Create selector dropdown
        const selector = document.createElement('div');
        selector.className = 'prompt-manager-selector';
        selector.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            min-width: 300px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Position selector
        const buttonRect = button.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

        selector.style.left = (buttonRect.left + scrollX) + 'px';
        selector.style.top = (buttonRect.bottom + 5 + scrollY) + 'px';

        // Load and display prompts
        loadPrompts().then(prompts => {
            if (prompts.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.style.padding = '20px';
                emptyMsg.style.textAlign = 'center';
                emptyMsg.style.color = '#64748b';
                emptyMsg.style.fontSize = '14px';
                emptyMsg.textContent = 'No prompts found. Click the extension icon to create some!';
                selector.appendChild(emptyMsg);
            } else {
                prompts.forEach(prompt => {
                    const item = document.createElement('div');
                    item.className = 'prompt-manager-item';
                    item.dataset.content = encodeURIComponent(prompt.content);
                    item.style.padding = '12px 16px';
                    item.style.borderBottom = '1px solid #f1f5f9';
                    item.style.cursor = 'pointer';
                    item.style.transition = 'background-color 0.2s ease';

                    const titleDiv = document.createElement('div');
                    titleDiv.style.fontWeight = '600';
                    titleDiv.style.fontSize = '14px';
                    titleDiv.style.color = '#1e293b';
                    titleDiv.style.marginBottom = '4px';
                    titleDiv.textContent = prompt.title;

                    const previewDiv = document.createElement('div');
                    previewDiv.style.fontSize = '12px';
                    previewDiv.style.color = '#64748b';
                    previewDiv.style.overflow = 'hidden';
                    previewDiv.style.display = '-webkit-box';
                    previewDiv.style.webkitLineClamp = '2';
                    previewDiv.style.webkitBoxOrient = 'vertical';

                    const truncatedContent = prompt.content.length > 100
                        ? prompt.content.substring(0, 100) + '...'
                        : prompt.content;

                    previewDiv.textContent = truncatedContent;

                    item.appendChild(titleDiv);
                    item.appendChild(previewDiv);

                    item.addEventListener('mouseenter', () => {
                        item.style.backgroundColor = '#f8fafc';
                    });

                    item.addEventListener('mouseleave', () => {
                        item.style.backgroundColor = 'transparent';
                    });

                    item.addEventListener('click', () => {
                        const content = decodeURIComponent(item.dataset.content);
                        insertTextIntoInput(targetInput, content);
                        selector.remove();
                    });

                    selector.appendChild(item);
                });
            }
        });

        // Add to page
        document.body.appendChild(selector);

        // Close selector when clicking outside
        const closeSelector = (e) => {
            if (!selector.contains(e.target) && e.target !== button) {
                selector.remove();
                document.removeEventListener('click', closeSelector);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeSelector);
        }, 100);
    }


    // Load prompts from storage
    async function loadPrompts() {
        try {
            const result = await browser.storage.local.get(['prompts']);
            return result.prompts || [];
        } catch (error) {
            console.error('Error loading prompts:', error);
            return [];
        }
    }

    // Insert text into input field
    function insertTextIntoInput(input, text) {
        if (input.contentEditable === 'true') {
            // For contentEditable divs
            input.focus();
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Trigger input events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // For textarea and input elements
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            
            input.value = value.substring(0, start) + text + value.substring(end);
            input.selectionStart = input.selectionEnd = start + text.length;
            input.focus();
            
            // Trigger input events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when page loads
    function init() {
        // Add buttons initially
        addPasteButtons();
        
        // Re-scan for new inputs periodically (for SPAs)
        setInterval(() => {
            addPasteButtons();
        }, 2000);
        
        // Also scan when DOM changes
        const observer = new MutationObserver(() => {
            addPasteButtons();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log(`Prompt Manager initialized on ${detectPlatform()}`);
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();