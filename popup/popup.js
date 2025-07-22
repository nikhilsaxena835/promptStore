const storage = typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;

class PromptManager {
    constructor() {
        this.prompts = [];
        this.filteredPrompts = [];
        this.currentEditId = null;
        this.storage = new PromptStorage();
        this.init();
    }

    async init() {
        await this.loadPrompts();
        this.bindEvents();
        this.renderPrompts();
    }

    async loadPrompts() 
    {
        try 
        {
            this.prompts = await this.storage.getAllPrompts();
            this.filteredPrompts = [...this.prompts];
            //console.log('Loaded prompts:', this.prompts);
        } 
        catch (error) 
        {
            //console.error('Error loading prompts:', error);
            this.prompts = [];
            this.filteredPrompts = [];
            this.showToast('Failed to load prompts', 'error');
        }
    }

    bindEvents() {
        // Create button
        document.getElementById('createBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterPrompts(e.target.value);
        });

        // Modal events
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.savePrompt();
        });

        // Context menu events
        document.getElementById('editPrompt').addEventListener('click', () => {
            this.editCurrentPrompt();
        });

        document.getElementById('deletePrompt').addEventListener('click', () => {
            this.deleteCurrentPrompt();
        });

        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.prompt-menu')) {
                this.hideContextMenu();
            }
        });

        // Close modal when clicking backdrop
        document.getElementById('promptModal').addEventListener('click', (e) => {
            if (e.target.id === 'promptModal') {
                this.closeModal();
            }
        });

        // Handle Enter key in title field
        document.getElementById('promptTitle').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('promptContent').focus();
            }
        });
    }

    filterPrompts(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) {
            this.filteredPrompts = [...this.prompts];
        } else {
            this.filteredPrompts = this.prompts.filter(prompt =>
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm)
            );
        }
        this.renderPrompts();
    }

    renderPrompts() {
        const container = document.getElementById('promptsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container || !emptyState) return;

        const hasPrompts = this.filteredPrompts.length > 0;

        emptyState.style.display = hasPrompts ? 'none' : 'flex';

        // Remove all prompt items (but NOT emptyState)
        [...container.children].forEach(child => {
            if (child !== emptyState) child.remove();
        });

        if (!hasPrompts) return;

        this.filteredPrompts.forEach(prompt => {
            const promptElement = this.createPromptElement(prompt);
            container.appendChild(promptElement);
        });
    }



    createPromptElement(prompt) {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.dataset.id = prompt.id;

        const preview = this.truncateText(prompt.content, 100);

        div.innerHTML = `
            <div class="prompt-header">
                <h4 class="prompt-title">${this.escapeHtml(prompt.title)}</h4>
                <button class="prompt-menu" title="Options">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
            <div class="prompt-preview">${this.escapeHtml(preview)}</div>
        `;

        // Click to copy
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.prompt-menu')) {
                this.copyPrompt(prompt);
            }
        });

        // Menu button
        const menuBtn = div.querySelector('.prompt-menu');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showContextMenu(e, prompt.id);
        });

        return div;
    }

    async copyPrompt(prompt) {
        try {
            await navigator.clipboard.writeText(prompt.content);
            this.showToast('Prompt copied to clipboard!');
            // Close the popup after copying
            window.close();
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showToast('Failed to copy prompt', 'error');
        }
    }

    showContextMenu(event, promptId) {
        const contextMenu = document.getElementById('contextMenu');
        this.currentEditId = promptId;

        // Position the context menu
        const rect = event.target.getBoundingClientRect();
        contextMenu.style.display = 'block';
        contextMenu.style.left = (rect.left - 100) + 'px';
        contextMenu.style.top = (rect.bottom + 5) + 'px';

        // Adjust position if menu goes off screen
        const menuRect = contextMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            contextMenu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            contextMenu.style.top = (rect.top - menuRect.height - 5) + 'px';
        }
    }

    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
        this.currentEditId = null;
    }

    openModal(prompt = null) {
        const modal = document.getElementById('promptModal');
        const title = document.getElementById('modalTitle');
        const titleInput = document.getElementById('promptTitle');
        const contentInput = document.getElementById('promptContent');

        if (prompt) {
            title.textContent = 'Edit Prompt';
            titleInput.value = prompt.title;
            contentInput.value = prompt.content;
            this.currentEditId = prompt.id;
        } else {
            title.textContent = 'Create New Prompt';
            titleInput.value = '';
            contentInput.value = '';
            this.currentEditId = null;
        }

        modal.style.display = 'block';
        titleInput.focus();
    }

    closeModal() {
        document.getElementById('promptModal').style.display = 'none';
        this.currentEditId = null;
    }

    async savePrompt() {
        const titleInput = document.getElementById('promptTitle');
        const contentInput = document.getElementById('promptContent');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            this.showToast('Please fill in both title and content', 'error');
            return;
        }

        try {
            if (this.currentEditId) {
                await this.storage.updatePrompt(this.currentEditId, { title, content });
            } else {
                await this.storage.savePrompt({ title, content });
            }
            await this.loadPrompts();
            this.filteredPrompts = [...this.prompts];
            this.renderPrompts();
            this.closeModal();
            this.showToast(this.currentEditId ? 'Prompt updated!' : 'Prompt created!');
        } catch (error) {
            console.error('Error saving prompt:', error);
            this.showToast('Failed to save prompt', 'error');
        }
    }

    editCurrentPrompt() {
        const prompt = this.prompts.find(p => p.id === this.currentEditId);
        if (prompt) {
            this.hideContextMenu();
            this.openModal(prompt);
        }
    }

    async deleteCurrentPrompt() {
        if (!this.currentEditId) return;

        if (confirm('Are you sure you want to delete this prompt?')) {
            try {
                await this.storage.deletePrompt(this.currentEditId);
                await this.loadPrompts();
                this.filteredPrompts = [...this.prompts];
                this.renderPrompts();
                this.hideContextMenu();
                this.showToast('Prompt deleted!');
            } catch (error) {
                console.error('Error deleting prompt:', error);
                this.showToast('Failed to delete prompt', 'error');
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc2626' : '#059669'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);

        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PromptManager();
});