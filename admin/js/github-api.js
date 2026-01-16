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
            const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.content) {
                return {
                    content: atob(data.content),
                    sha: data.sha,
                    path: data.path
                };
            }
            return data;
        } catch (error) {
            if (error.message && error.message.includes('404')) {
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
        const content = base64Content.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        
        const body = {
            message,
            content,
            branch: this.branch
        };

        // Check if file exists to get SHA (for updating existing file)
        try {
            const existing = await this.getFileContent(path);
            if (existing && existing.sha) {
                body.sha = existing.sha;
            }
        } catch (e) {
            // File doesn't exist, that's fine for new uploads
            console.log('Creating new file:', path);
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
                    // Clean filename: remove special chars, keep extension
                    const ext = file.name.split('.').pop().toLowerCase();
                    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').substring(0, 50);
                    const filename = `post-${Date.now()}-${baseName}.${ext}`;
                    const path = `src/assets/images/${filename}`;
                    
                    console.log('Uploading image to:', path);
                    await this.uploadImage(path, base64, `Upload image: ${filename}`);
                    console.log('Image uploaded successfully');
                    
                    resolve({
                        path: `/${path}`,
                        filename
                    });
                } catch (error) {
                    console.error('Upload error:', error);
                    reject(new Error(`Failed to upload image: ${error.message}`));
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

    // ============================================
    // Projects Management
    // ============================================

    /**
     * Get projects from index.html
     */
    async getProjects() {
        const file = await this.getFileContent('index.html');
        if (!file) return [];

        const content = file.content;
        const projects = [];

        // Parse project cards from HTML
        const projectRegex = /<div class="project-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
        let match;

        while ((match = projectRegex.exec(content)) !== null) {
            const cardHtml = match[0];
            
            // Extract image
            const imageMatch = cardHtml.match(/src="\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}"/);
            const image = imageMatch ? imageMatch[1] : '';

            // Extract title
            const titleMatch = cardHtml.match(/<h3 class="project-card__title">([^<]+)<\/h3>/);
            const title = titleMatch ? titleMatch[1].trim() : '';

            // Extract description
            const descMatch = cardHtml.match(/<p class="project-card__description">([^<]+)<\/p>/);
            const description = descMatch ? descMatch[1].trim() : '';

            // Extract tech items
            const techRegex = /<span class="project-card__tech-item">([^<]+)<\/span>/g;
            const tech = [];
            let techMatch;
            while ((techMatch = techRegex.exec(cardHtml)) !== null) {
                tech.push(techMatch[1].trim());
            }

            // Extract links
            const githubMatch = cardHtml.match(/href="(https:\/\/github\.com\/[^"]+)"/);
            const github = githubMatch ? githubMatch[1] : '';

            const demoMatch = cardHtml.match(/href="(https:\/\/[^"]+)"[^>]*class="project-card__link">\s*Live Demo/);
            const demo = demoMatch ? demoMatch[1] : '';

            if (title) {
                projects.push({ title, description, image, tech, github, demo });
            }
        }

        this.indexHtmlSha = file.sha;
        this.indexHtmlContent = content;
        return projects;
    }

    /**
     * Generate project card HTML
     */
    generateProjectCardHtml(project) {
        const imagePath = project.image || '/src/assets/images/default-blog-image.svg';
        const techItems = project.tech.map(t => 
            `                            <span class="project-card__tech-item">${t}</span>`
        ).join('\n');

        let links = '';
        if (project.github) {
            links += `                            <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="project-card__link">
                                GitHub
                            </a>\n`;
        }
        if (project.demo) {
            links += `                            <a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="project-card__link">
                                Live Demo
                            </a>`;
        } else if (!project.github) {
            links += `                            <span class="project-card__link" style="opacity: 0.5;">Coming Soon</span>`;
        }

        return `                <div class="project-card">
                    <div class="project-card__image">
                        <img src="{{ '${imagePath}' | relative_url }}" alt="${project.title}" class="project-card__image-img">
                    </div>
                    <div class="project-card__content">
                        <h3 class="project-card__title">${project.title}</h3>
                        <p class="project-card__description">${project.description}</p>
                        <div class="project-card__tech">
${techItems}
                        </div>
                        <div class="project-card__links">
${links.trimEnd()}
                        </div>
                    </div>
                </div>`;
    }

    /**
     * Update index.html with new projects
     */
    async updateIndexHtmlProjects(projects) {
        // Get fresh content
        const file = await this.getFileContent('index.html');
        if (!file) throw new Error('Could not read index.html');

        let content = file.content;

        // Find the projects grid section
        const gridStartRegex = /<div class="projects__grid" id="projects-container">/;
        const gridEndRegex = /<\/div>\s*<\/section>\s*<section class="music">/;

        const startMatch = content.match(gridStartRegex);
        const endMatch = content.match(gridEndRegex);

        if (!startMatch || !endMatch) {
            throw new Error('Could not find projects section in index.html');
        }

        const startIndex = startMatch.index + startMatch[0].length;
        const endIndex = content.indexOf('</div>\n        </section>\n\n        <section class="music">');

        if (endIndex === -1) {
            throw new Error('Could not find end of projects section');
        }

        // Generate new projects HTML
        const projectsHtml = projects.map(p => this.generateProjectCardHtml(p)).join('\n\n');

        // Replace projects section
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex);
        const newContent = before + '\n' + projectsHtml + '\n            ' + after;

        await this.createOrUpdateFile('index.html', newContent, 'Update projects', file.sha);
    }

    /**
     * Create a new project
     */
    async createProject(project) {
        const projects = await this.getProjects();
        projects.push(project);
        await this.updateIndexHtmlProjects(projects);
    }

    /**
     * Update an existing project
     */
    async updateProject(index, project) {
        const projects = await this.getProjects();
        if (index < 0 || index >= projects.length) {
            throw new Error('Project index out of range');
        }
        projects[index] = project;
        await this.updateIndexHtmlProjects(projects);
    }

    /**
     * Delete a project
     */
    async deleteProject(index) {
        const projects = await this.getProjects();
        if (index < 0 || index >= projects.length) {
            throw new Error('Project index out of range');
        }
        projects.splice(index, 1);
        await this.updateIndexHtmlProjects(projects);
    }
}

// Export for use in other modules
window.GitHubAPI = GitHubAPI;
