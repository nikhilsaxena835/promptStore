// This module provides a consistent interface for managing prompt data
class PromptStorage {
    constructor() 
    {
        this.storageKey = 'prompts';
        this.maxPrompts = 500;
    }

    /**
     * Get all prompts from storage
     * @returns {Promise<Array>} Array of prompt objects
     */
    async getAllPrompts() {
        try {
            const result = await browser.storage.local.get([this.storageKey]);
            return result[this.storageKey] || [];
        } catch (error) {
            console.error('Error getting prompts from storage:', error);
            return [];
        }
    }

    /**
     * Save a new prompt
     * @param {Object} prompt - Prompt object with title and content
     * @returns {Promise<boolean>} Success status
     */
    async savePrompt(prompt) {
        try {
            const prompts = await this.getAllPrompts();
            
            const newPrompt = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: prompt.title.trim(),
                content: prompt.content.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageCount: 0,
                tags: prompt.tags || [],
                favorite: false
            };

            prompts.unshift(newPrompt);

            if (prompts.length > this.maxPrompts) {
                prompts.splice(this.maxPrompts);
            }

            await browser.storage.local.set({ [this.storageKey]: prompts });
            return true;
        } catch (error) {
            console.error('Error saving prompt:', error);
            return false;
        }
    }

    /**
     * Update an existing prompt
     * @param {string} id - Prompt ID
     * @param {Object} updates - Object with fields to update
     * @returns {Promise<boolean>} Success status
     */
    async updatePrompt(id, updates) {
        try {
            const prompts = await this.getAllPrompts();
            const index = prompts.findIndex(p => p.id === id);
            
            if (index === -1) {
                console.error('Prompt not found:', id);
                return false;
            }

            prompts[index] = {
                ...prompts[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await browser.storage.local.set({ [this.storageKey]: prompts });
            return true;
        } catch (error) {
            console.error('Error updating prompt:', error);
            return false;
        }
    }

    /**
     * Delete a prompt
     * @param {string} id - Prompt ID
     * @returns {Promise<boolean>} Success status
     */
    async deletePrompt(id) {
        try {
            const prompts = await this.getAllPrompts();
            const filteredPrompts = prompts.filter(p => p.id !== id);

            await browser.storage.local.set({ [this.storageKey]: filteredPrompts });
            return true;
        } catch (error) {
            console.error('Error deleting prompt:', error);
            return false;
        }
    }

    /**
     * Search prompts by title or content
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching prompts
     */
    async searchPrompts(query) {
        try {
            const prompts = await this.getAllPrompts();
            const searchTerm = query.toLowerCase().trim();

            if (!searchTerm) return prompts;

            return prompts.filter(prompt => 
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm) ||
                (prompt.tags && prompt.tags.some(tag => 
                    tag.toLowerCase().includes(searchTerm)
                ))
            );
        } catch (error) {
            console.error('Error searching prompts:', error);
            return [];
        }
    }

    /**
     * Increment usage count for a prompt
     * @param {string} id - Prompt ID
     * @returns {Promise<boolean>} Success status
     */
    async incrementUsage(id) {
        try {
            const prompts = await this.getAllPrompts();
            const index = prompts.findIndex(p => p.id === id);
            
            if (index !== -1) {
                prompts[index].usageCount = (prompts[index].usageCount || 0) + 1;
                prompts[index].lastUsed = new Date().toISOString();
                
                await browser.storage.local.set({ [this.storageKey]: prompts });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }
    }

    /**
     * Get most frequently used prompts
     * @param {number} limit - Number of prompts to return
     * @returns {Promise<Array>} Most used prompts
     */
    async getMostUsed(limit = 10) {
        try {
            const prompts = await this.getAllPrompts();
            return prompts
                .filter(p => p.usageCount > 0)
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting most used prompts:', error);
            return [];
        }
    }

    /**
     * Get favorite prompts
     * @returns {Promise<Array>} Favorite prompts
     */
    async getFavorites() {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.filter(p => p.favorite);
        } catch (error) {
            console.error('Error getting favorite prompts:', error);
            return [];
        }
    }

    /**
     * Export all prompts as JSON
     * @returns {Promise<string>} JSON string of all prompts
     */
    async exportPrompts() {
        try {
            const prompts = await this.getAllPrompts();
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                prompts: prompts
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Error exporting prompts:', error);
            return null;
        }
    }

    /**
     * Import prompts from JSON string
     * @param {string} jsonString - JSON string containing prompts
     * @param {boolean} merge - Whether to merge with existing prompts or replace
     * @returns {Promise<{success: boolean, imported: number, errors: Array}>}
     */
    async importPrompts(jsonString, merge = true) {
        try {
            const importData = JSON.parse(jsonString);
            const importedPrompts = importData.prompts || [];
            
            let existingPrompts = merge ? await this.getAllPrompts() : [];
            const errors = [];
            let imported = 0;

            for (const prompt of importedPrompts) {
                if (!prompt.title || !prompt.content) {
                    errors.push(`Invalid prompt: missing title or content`);
                    continue;
                }

                // Check for duplicates
                const duplicate = existingPrompts.find(p => 
                    p.title === prompt.title && p.content === prompt.content
                );

                if (!duplicate) {
                    existingPrompts.unshift({
                        ...prompt,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        importedAt: new Date().toISOString()
                    });
                    imported++;
                }
            }

            // Limit total prompts
            if (existingPrompts.length > this.maxPrompts) {
                existingPrompts = existingPrompts.slice(0, this.maxPrompts);
            }

            await browser.storage.local.set({ [this.storageKey]: existingPrompts });

            return {
                success: true,
                imported,
                errors
            };
        } catch (error) {
            console.error('Error importing prompts:', error);
            return {
                success: false,
                imported: 0,
                errors: [error.message]
            };
        }
    }

    /**
     * Clear all prompts (with confirmation)
     * @returns {Promise<boolean>} Success status
     */
    async clearAllPrompts() {
        try {
            await browser.storage.local.set({ [this.storageKey]: [] });
            return true;
        } catch (error) {
            console.error('Error clearing prompts:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
        try {
            const prompts = await this.getAllPrompts();
            const totalSize = JSON.stringify(prompts).length;
            
            return {
                totalPrompts: prompts.length,
                totalSize: totalSize,
                averageSize: prompts.length > 0 ? Math.round(totalSize / prompts.length) : 0,
                oldestPrompt: prompts.length > 0 ? 
                    Math.min(...prompts.map(p => new Date(p.createdAt).getTime())) : null,
                newestPrompt: prompts.length > 0 ? 
                    Math.max(...prompts.map(p => new Date(p.createdAt).getTime())) : null
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.PromptStorage = PromptStorage;
}

// For Node.js environments or modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptStorage;
}