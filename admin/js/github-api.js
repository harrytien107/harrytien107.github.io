/**
 * GitHub API Integration for HarryTien Admin Dashboard
 * Handles all interactions with GitHub repository via REST API
 */

class GitHubAPI {
    constructor(token, owner = 'harrytien107', repo = 'harrytien107.github.io') {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        this.baseUrl = 'https://api.github.com';
        this.branch = 'main';
    }

    /**
     * Make authenticated request to GitHub API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `GitHub API error: ${response.status}`);
            }

            // Handle empty responses
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    }

    /**
     * Validate token by getting user info
     */
    async validateToken() {
        try {
            const user = await this.request('/user');
            return { valid: true, user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get repository info
     */
    async getRepoInfo() {
        return await this.request(`/repos/${this.owner}/${this.repo}`);
    }

    /**
     * Get file content from repository
     */
    async getFileContent(path) {
        try {
            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`);
            if (response.content) {
                return {
                    content: atob(response.content),
                    sha: response.sha,
                    path: response.path
                };
            }
            return response;
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get all files in a directory
     */
    async getDirectoryContents(path) {
        try {
            return await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return [];
            }
            throw error;
        }
    }

    /**
     * Create or update a file
     */
    async createOrUpdateFile(path, content, message, sha = null) {
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: this.branch
        };

        if (sha) {
            body.sha = sha;
        }

        return await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * Delete a file
     */
    async deleteFile(path, message, sha) {
        return await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'DELETE',
            body: JSON.stringify({
                message,
                sha,
                branch: this.branch
            })
        });
    }

    /**
     * Upload image file (base64)
     */
    async uploadImage(path, base64Content, message) {
        // Remove data URL prefix if present
        const content = base64Content.replace(/^data:image\/\w+;base64,/, '');
        
        const body = {
            message,
            content,
            branch: this.branch
        };

        // Check if file exists to get SHA
        const existing = await this.getFileContent(path);
        if (existing && existing.sha) {
            body.sha = existing.sha;
        }

        return await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    // ============================================
    // Posts Management
    // ============================================

    /**
     * Get all posts from _posts directory
     */
    async getPosts() {
        const files = await this.getDirectoryContents('_posts');
        const posts = [];

        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const content = await this.getFileContent(file.path);
                if (content) {
                    const parsed = this.parsePost(content.content, file.name);
                    parsed.sha = content.sha;
                    parsed.path = file.path;
                    posts.push(parsed);
                }
            }
        }

        // Sort by date descending
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        return posts;
    }

    /**
     * Parse markdown post content
     */
    parsePost(content, filename) {
        const post = {
            filename,
            title: '',
            description: '',
            date: '',
            categories: [],
            tags: [],
            readTime: '',
            image: '',
            content: ''
        };

        // Extract date from filename (YYYY-MM-DD-title.md)
        const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            post.date = dateMatch[1];
        }

        // Parse front matter
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            post.content = frontMatterMatch[2].trim();

            // Parse YAML-like front matter
            const lines = frontMatter.split('\n');
            for (const line of lines) {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    switch (key) {
                        case 'title':
                            post.title = value.replace(/^["']|["']$/g, '');
                            break;
                        case 'description':
                            post.description = value.replace(/^["']|["']$/g, '');
                            break;
                        case 'date':
                            post.date = value;
                            break;
                        case 'readTime':
                            post.readTime = value;
                            break;
                        case 'image':
                            post.image = value.replace(/^["']|["']$/g, '');
                            break;
                        case 'categories':
                            post.categories = this.parseArrayValue(value);
                            break;
                        case 'tags':
                            post.tags = this.parseArrayValue(value);
                            break;
                    }
                }
            }
        } else {
            post.content = content;
        }

        return post;
    }

    /**
     * Parse YAML array value [item1, item2]
     */
    parseArrayValue(value) {
        const match = value.match(/\[(.*)\]/);
        if (match) {
            return match[1].split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
        }
        return value ? [value] : [];
    }

    /**
     * Generate markdown content from post data
     */
    generatePostContent(post) {
        let frontMatter = '---\n';
        frontMatter += 'layout: post\n';
        frontMatter += `title: ${post.title}\n`;
        
        if (post.description) {
            frontMatter += `description: ${post.description}\n`;
        }
        
        frontMatter += `date: ${post.date}\n`;
        
        if (post.readTime) {
            frontMatter += `readTime: ${post.readTime}\n`;
        }
        
        if (post.image) {
            frontMatter += `image: ${post.image}\n`;
        }
        
        if (post.categories && post.categories.length > 0) {
            frontMatter += `categories: [${post.categories.join(', ')}]\n`;
        }
        
        if (post.tags && post.tags.length > 0) {
            frontMatter += `tags: [${post.tags.join(', ')}]\n`;
        }
        
        frontMatter += '---\n\n';
        
        return frontMatter + post.content;
    }

    /**
     * Generate filename from date and title
     */
    generateFilename(date, title) {
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        return `${date}-${slug}.md`;
    }

    /**
     * Create a new post
     */
    async createPost(post) {
        const filename = this.generateFilename(post.date, post.title);
        const path = `_posts/${filename}`;
        const content = this.generatePostContent(post);
        
        await this.createOrUpdateFile(path, content, `Create post: ${post.title}`);
        return { filename, path };
    }

    /**
     * Update an existing post
     */
    async updatePost(post, originalFilename) {
        const newFilename = this.generateFilename(post.date, post.title);
        const newPath = `_posts/${newFilename}`;
        const content = this.generatePostContent(post);

        // If filename changed, delete old file first
        if (originalFilename && originalFilename !== newFilename) {
            const oldPath = `_posts/${originalFilename}`;
            const oldFile = await this.getFileContent(oldPath);
            if (oldFile && oldFile.sha) {
                await this.deleteFile(oldPath, `Rename post: ${originalFilename} -> ${newFilename}`, oldFile.sha);
            }
            await this.createOrUpdateFile(newPath, content, `Update post: ${post.title}`);
        } else {
            await this.createOrUpdateFile(newPath, content, `Update post: ${post.title}`, post.sha);
        }

        return { filename: newFilename, path: newPath };
    }

    /**
     * Delete a post
     */
    async deletePost(filename, sha) {
        const path = `_posts/${filename}`;
        await this.deleteFile(path, `Delete post: ${filename}`, sha);
    }

    // ============================================
    // Categories & Tags Management
    // ============================================

    /**
     * Get all unique categories from posts
     */
    async getCategories() {
        const posts = await this.getPosts();
        const categoryMap = new Map();

        for (const post of posts) {
            for (const category of post.categories) {
                const key = category.toLowerCase();
                if (categoryMap.has(key)) {
                    categoryMap.get(key).count++;
                    categoryMap.get(key).posts.push(post.title);
                } else {
                    categoryMap.set(key, {
                        name: category,
                        count: 1,
                        posts: [post.title]
                    });
                }
            }
        }

        return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
    }

    /**
     * Get all unique tags from posts
     */
    async getTags() {
        const posts = await this.getPosts();
        const tagMap = new Map();

        for (const post of posts) {
            for (const tag of post.tags) {
                const key = tag.toLowerCase();
                if (tagMap.has(key)) {
                    tagMap.get(key).count++;
                    tagMap.get(key).posts.push(post.title);
                } else {
                    tagMap.set(key, {
                        name: tag,
                        count: 1,
                        posts: [post.title]
                    });
                }
            }
        }

        return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
    }

    /**
     * Rename a category across all posts
     */
    async renameCategory(oldName, newName) {
        const posts = await this.getPosts();
        let updatedCount = 0;

        for (const post of posts) {
            const index = post.categories.findIndex(c => c.toLowerCase() === oldName.toLowerCase());
            if (index !== -1) {
                post.categories[index] = newName;
                await this.updatePost(post, post.filename);
                updatedCount++;
            }
        }

        return updatedCount;
    }

    /**
     * Rename a tag across all posts
     */
    async renameTag(oldName, newName) {
        const posts = await this.getPosts();
        let updatedCount = 0;

        for (const post of posts) {
            const index = post.tags.findIndex(t => t.toLowerCase() === oldName.toLowerCase());
            if (index !== -1) {
                post.tags[index] = newName;
                await this.updatePost(post, post.filename);
                updatedCount++;
            }
        }

        return updatedCount;
    }

    /**
     * Delete a category from all posts
     */
    async deleteCategory(name) {
        const posts = await this.getPosts();
        let updatedCount = 0;

        for (const post of posts) {
            const index = post.categories.findIndex(c => c.toLowerCase() === name.toLowerCase());
            if (index !== -1) {
                post.categories.splice(index, 1);
                await this.updatePost(post, post.filename);
                updatedCount++;
            }
        }

        return updatedCount;
    }

    /**
     * Delete a tag from all posts
     */
    async deleteTag(name) {
        const posts = await this.getPosts();
        let updatedCount = 0;

        for (const post of posts) {
            const index = post.tags.findIndex(t => t.toLowerCase() === name.toLowerCase());
            if (index !== -1) {
                post.tags.splice(index, 1);
                await this.updatePost(post, post.filename);
                updatedCount++;
            }
        }

        return updatedCount;
    }

    // ============================================
    // Images Management
    // ============================================

    /**
     * Get all images from assets directory
     */
    async getImages() {
        return await this.getDirectoryContents('src/assets/images');
    }

    /**
     * Upload an image
     */
    async uploadPostImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64 = e.target.result;
                    const filename = `post-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`;
                    const path = `src/assets/images/${filename}`;
                    
                    await this.uploadImage(path, base64, `Upload image: ${filename}`);
                    resolve({
                        path: `/${path}`,
                        filename
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Delete an image
     */
    async deleteImage(path) {
        const file = await this.getFileContent(path);
        if (file && file.sha) {
            await this.deleteFile(path, `Delete image: ${path}`, file.sha);
        }
    }
}

// Export for use in other modules
window.GitHubAPI = GitHubAPI;
