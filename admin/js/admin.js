/**
 * HarryTien Admin Dashboard - Main Application
 * Handles UI interactions and orchestrates API calls
 */

class AdminDashboard {
    constructor() {
        this.githubAPI = null;
        this.spotifyAPI = null;
        this.cryptoUtils = new CryptoUtils();
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.playlists = [];
        this.currentEditPost = null;
        this.currentEditCategory = null;
        this.currentEditTag = null;
        this.deleteCallback = null;

        this.init();
    }

    // ============================================
    // Initialization
    // ============================================

    async init() {
        this.bindEvents();
        await this.checkStoredCredentials();
    }

    bindEvents() {
        // Login form
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));

        // Navigation
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());

        // Mobile menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleSidebar());

        // Posts
        document.getElementById('new-post-btn')?.addEventListener('click', () => this.openPostModal());
        document.getElementById('save-post-btn')?.addEventListener('click', () => this.savePost());
        document.getElementById('posts-search')?.addEventListener('input', (e) => this.filterPosts(e.target.value));

        // Thumbnail upload
        document.getElementById('upload-thumbnail-btn')?.addEventListener('click', () => {
            document.getElementById('post-thumbnail')?.click();
        });
        document.getElementById('post-thumbnail')?.addEventListener('change', (e) => this.handleThumbnailUpload(e));
        document.getElementById('remove-thumbnail-btn')?.addEventListener('click', () => this.removeThumbnail());

        // Categories
        document.getElementById('new-category-btn')?.addEventListener('click', () => this.openCategoryModal());
        document.getElementById('save-category-btn')?.addEventListener('click', () => this.saveCategory());
        document.getElementById('categories-search')?.addEventListener('input', (e) => this.filterCategories(e.target.value));

        // Tags
        document.getElementById('new-tag-btn')?.addEventListener('click', () => this.openTagModal());
        document.getElementById('save-tag-btn')?.addEventListener('click', () => this.saveTag());
        document.getElementById('tags-search')?.addEventListener('input', (e) => this.filterTags(e.target.value));

        // Spotify
        document.getElementById('connect-spotify-btn')?.addEventListener('click', () => this.connectSpotify());

        // Modals
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Delete confirmation
        document.getElementById('confirm-delete-btn')?.addEventListener('click', () => this.confirmDelete());

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    }

    // ============================================
    // Authentication
    // ============================================

    async checkStoredCredentials() {
        try {
            const credentials = await this.cryptoUtils.getCredentials();
            if (credentials) {
                const { githubToken, spotifyClientId, spotifyClientSecret } = credentials;
                if (githubToken) {
                    document.getElementById('github-token').value = githubToken;
                    document.getElementById('spotify-client-id').value = spotifyClientId || '';
                    document.getElementById('spotify-client-secret').value = spotifyClientSecret || '';
                    document.getElementById('remember-credentials').checked = true;
                }
            }
        } catch (e) {
            console.warn('Failed to load stored credentials:', e);
            this.cryptoUtils.clearCredentials();
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const githubToken = document.getElementById('github-token').value.trim();
        const spotifyClientId = document.getElementById('spotify-client-id').value.trim();
        const spotifyClientSecret = document.getElementById('spotify-client-secret').value.trim();
        const remember = document.getElementById('remember-credentials').checked;

        if (!githubToken) {
            this.showToast('Please enter your GitHub token', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing in...</span>';

        try {
            // Initialize GitHub API
            this.githubAPI = new GitHubAPI(githubToken);
            const validation = await this.githubAPI.validateToken();

            if (!validation.valid) {
                throw new Error('Invalid GitHub token: ' + validation.error);
            }

            // Store credentials if requested (encrypted)
            if (remember) {
                await this.cryptoUtils.storeCredentials({
                    githubToken,
                    spotifyClientId,
                    spotifyClientSecret
                });
            } else {
                this.cryptoUtils.clearCredentials();
            }

            // Initialize Spotify API if credentials provided
            if (spotifyClientId && spotifyClientSecret) {
                this.spotifyAPI = new SpotifyAPI(spotifyClientId, spotifyClientSecret);
            }

            // Show dashboard
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');

            // Update user info
            document.getElementById('user-info').textContent = `@${validation.user.login}`;

            // Load data
            await this.loadDashboardData();

            this.showToast('Welcome back, ' + validation.user.login + '!', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
            this.githubAPI = null;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
    }

    async handleLogout() {
        this.githubAPI = null;
        this.spotifyAPI = null;
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.playlists = [];

        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');

        // Clear form but keep stored credentials
        document.getElementById('login-form').reset();
        await this.checkStoredCredentials();

        this.showToast('Logged out successfully', 'info');
    }

    // ============================================
    // Navigation
    // ============================================

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        this.navigateTo(page);
    }

    navigateTo(page) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            posts: 'Blog Posts',
            categories: 'Categories',
            tags: 'Tags',
            spotify: 'Spotify Playlists'
        };
        document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

        // Close sidebar on mobile
        document.querySelector('.sidebar')?.classList.remove('open');
    }

    toggleSidebar() {
        document.querySelector('.sidebar')?.classList.toggle('open');
    }

    handleQuickAction(e) {
        const action = e.currentTarget.dataset.action;
        switch (action) {
            case 'new-post':
                this.navigateTo('posts');
                this.openPostModal();
                break;
            case 'new-category':
                this.navigateTo('categories');
                this.openCategoryModal();
                break;
            case 'new-tag':
                this.navigateTo('tags');
                this.openTagModal();
                break;
            case 'refresh-spotify':
                this.navigateTo('spotify');
                this.loadSpotifyPlaylists();
                break;
        }
    }

    // ============================================
    // Dashboard Data Loading
    // ============================================

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadPosts(),
                this.loadSpotifyPlaylists()
            ]);
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats() {
        document.getElementById('stat-posts').textContent = this.posts.length;
        document.getElementById('stat-categories').textContent = this.categories.length;
        document.getElementById('stat-tags').textContent = this.tags.length;
        document.getElementById('stat-playlists').textContent = this.playlists.length || '-';

        // Update recent posts
        const recentPostsContainer = document.getElementById('recent-posts');
        if (this.posts.length === 0) {
            recentPostsContainer.innerHTML = '<div class="empty-state"><p>No posts yet</p></div>';
        } else {
            recentPostsContainer.innerHTML = this.posts.slice(0, 5).map(post => `
                <div class="recent-item">
                    <div class="recent-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div class="recent-item-info">
                        <div class="recent-item-title">${this.escapeHtml(post.title)}</div>
                        <div class="recent-item-date">${this.formatDate(post.date)}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ============================================
    // Posts Management
    // ============================================

    async loadPosts() {
        const container = document.getElementById('posts-list');
        container.innerHTML = '<div class="loading">Loading posts...</div>';

        try {
            this.posts = await this.githubAPI.getPosts();
            this.categories = await this.githubAPI.getCategories();
            this.tags = await this.githubAPI.getTags();
            
            this.renderPosts();
            this.renderCategories();
            this.renderTags();
        } catch (error) {
            container.innerHTML = `<div class="empty-state"><p>Error loading posts: ${error.message}</p></div>`;
            this.showToast('Failed to load posts', 'error');
        }
    }

    renderPosts(posts = this.posts) {
        const container = document.getElementById('posts-list');
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <h3>No posts found</h3>
                    <p>Create your first blog post to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-card" data-filename="${post.filename}">
                <div class="post-card-image" style="background-image: url('${post.image ? (post.image.startsWith('/') ? '..' + post.image : post.image) : '../src/assets/images/default-blog-image.svg'}')">
                    ${post.categories.length > 0 ? `<span class="post-card-category">${this.escapeHtml(post.categories[0])}</span>` : ''}
                </div>
                <div class="post-card-content">
                    <h3 class="post-card-title">${this.escapeHtml(post.title)}</h3>
                    <p class="post-card-excerpt">${this.escapeHtml(post.description || '')}</p>
                    <div class="post-card-meta">
                        <span>${this.formatDate(post.date)}</span>
                        ${post.readTime ? `<span>${post.readTime}</span>` : ''}
                    </div>
                    <div class="post-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="admin.editPost('${post.filename}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="admin.deletePostConfirm('${post.filename}', '${post.sha}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterPosts(query) {
        const filtered = this.posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.description?.toLowerCase().includes(query.toLowerCase()) ||
            post.categories.some(c => c.toLowerCase().includes(query.toLowerCase())) ||
            post.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderPosts(filtered);
    }

    openPostModal(post = null) {
        this.currentEditPost = post;
        const modal = document.getElementById('post-modal');
        const title = document.getElementById('post-modal-title');
        const form = document.getElementById('post-form');

        title.textContent = post ? 'Edit Post' : 'New Post';
        form.reset();

        if (post) {
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-date').value = post.date;
            document.getElementById('post-description').value = post.description || '';
            document.getElementById('post-categories').value = post.categories.join(', ');
            document.getElementById('post-tags').value = post.tags.join(', ');
            document.getElementById('post-read-time').value = post.readTime || '';
            document.getElementById('post-content').value = post.content;
            document.getElementById('post-original-filename').value = post.filename;
            document.getElementById('post-image-path').value = post.image || '';

            // Show thumbnail preview
            if (post.image) {
                const preview = document.getElementById('thumbnail-preview');
                preview.innerHTML = `<img src="${post.image.startsWith('/') ? '..' + post.image : post.image}" alt="Thumbnail">`;
                document.getElementById('remove-thumbnail-btn').style.display = 'block';
            }
        } else {
            // Set default date to today
            document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('thumbnail-preview').innerHTML = '<span>No image selected</span>';
            document.getElementById('remove-thumbnail-btn').style.display = 'none';
        }

        modal.classList.add('active');
    }

    editPost(filename) {
        const post = this.posts.find(p => p.filename === filename);
        if (post) {
            this.openPostModal(post);
        }
    }

    async handleThumbnailUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image size must be less than 5MB', 'error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('thumbnail-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail preview">`;
            document.getElementById('remove-thumbnail-btn').style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Upload to GitHub
        try {
            this.showToast('Uploading image...', 'info');
            const result = await this.githubAPI.uploadPostImage(file);
            document.getElementById('post-image-path').value = result.path;
            this.showToast('Image uploaded successfully', 'success');
        } catch (error) {
            this.showToast('Failed to upload image: ' + error.message, 'error');
            this.removeThumbnail();
        }
    }

    removeThumbnail() {
        document.getElementById('thumbnail-preview').innerHTML = '<span>No image selected</span>';
        document.getElementById('post-thumbnail').value = '';
        document.getElementById('post-image-path').value = '';
        document.getElementById('remove-thumbnail-btn').style.display = 'none';
    }

    async savePost() {
        const post = {
            title: document.getElementById('post-title').value.trim(),
            date: document.getElementById('post-date').value,
            description: document.getElementById('post-description').value.trim(),
            categories: document.getElementById('post-categories').value.split(',').map(c => c.trim()).filter(c => c),
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
            readTime: document.getElementById('post-read-time').value.trim(),
            image: document.getElementById('post-image-path').value,
            content: document.getElementById('post-content').value
        };

        if (!post.title || !post.date || !post.content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-post-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>Saving...</span>';

        try {
            const originalFilename = document.getElementById('post-original-filename').value;
            
            if (this.currentEditPost) {
                post.sha = this.currentEditPost.sha;
                await this.githubAPI.updatePost(post, originalFilename);
                this.showToast('Post updated successfully', 'success');
            } else {
                await this.githubAPI.createPost(post);
                this.showToast('Post created successfully', 'success');
            }

            this.closeAllModals();
            await this.loadPosts();
            this.updateDashboardStats();

        } catch (error) {
            this.showToast('Failed to save post: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>Save Post</span>';
        }
    }

    deletePostConfirm(filename, sha) {
        document.getElementById('delete-message').textContent = `Are you sure you want to delete "${filename}"?`;
        this.deleteCallback = async () => {
            try {
                await this.githubAPI.deletePost(filename, sha);
                this.showToast('Post deleted successfully', 'success');
                await this.loadPosts();
                this.updateDashboardStats();
            } catch (error) {
                this.showToast('Failed to delete post: ' + error.message, 'error');
            }
        };
        document.getElementById('delete-modal').classList.add('active');
    }

    // ============================================
    // Categories Management
    // ============================================

    renderCategories(categories = this.categories) {
        const container = document.getElementById('categories-list');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <h3>No categories found</h3>
                    <p>Categories are created automatically when you add them to posts</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => `
            <div class="category-card" data-name="${this.escapeHtml(category.name)}">
                <div class="category-icon">📁</div>
                <div class="category-info">
                    <div class="category-name">${this.escapeHtml(category.name)}</div>
                    <div class="category-count">${category.count} post${category.count !== 1 ? 's' : ''}</div>
                </div>
                <div class="category-actions">
                    <button class="icon-btn" onclick="admin.editCategory('${this.escapeHtml(category.name)}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="admin.deleteCategoryConfirm('${this.escapeHtml(category.name)}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterCategories(query) {
        const filtered = this.categories.filter(cat => 
            cat.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderCategories(filtered);
    }

    openCategoryModal(category = null) {
        this.currentEditCategory = category;
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');

        title.textContent = category ? 'Edit Category' : 'New Category';
        document.getElementById('category-name').value = category?.name || '';
        document.getElementById('category-description').value = '';

        modal.classList.add('active');
    }

    editCategory(name) {
        const category = this.categories.find(c => c.name === name);
        if (category) {
            this.openCategoryModal(category);
        }
    }

    async saveCategory() {
        const newName = document.getElementById('category-name').value.trim();

        if (!newName) {
            this.showToast('Please enter a category name', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-category-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            if (this.currentEditCategory && this.currentEditCategory.name !== newName) {
                // Rename category across all posts
                const updatedCount = await this.githubAPI.renameCategory(this.currentEditCategory.name, newName);
                this.showToast(`Category renamed in ${updatedCount} post(s)`, 'success');
            } else if (!this.currentEditCategory) {
                this.showToast('Categories are created by adding them to posts', 'info');
            }

            this.closeAllModals();
            await this.loadPosts();
            this.updateDashboardStats();

        } catch (error) {
            this.showToast('Failed to save category: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Category';
        }
    }

    deleteCategoryConfirm(name) {
        document.getElementById('delete-message').textContent = `Are you sure you want to remove "${name}" from all posts?`;
        this.deleteCallback = async () => {
            try {
                const updatedCount = await this.githubAPI.deleteCategory(name);
                this.showToast(`Category removed from ${updatedCount} post(s)`, 'success');
                await this.loadPosts();
                this.updateDashboardStats();
            } catch (error) {
                this.showToast('Failed to delete category: ' + error.message, 'error');
            }
        };
        document.getElementById('delete-modal').classList.add('active');
    }

    // ============================================
    // Tags Management
    // ============================================

    renderTags(tags = this.tags) {
        const container = document.getElementById('tags-list');
        
        if (tags.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    <h3>No tags found</h3>
                    <p>Tags are created automatically when you add them to posts</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div class="tag-card" data-name="${this.escapeHtml(tag.name)}">
                <div class="tag-icon">🏷️</div>
                <div class="tag-info">
                    <div class="tag-name">${this.escapeHtml(tag.name)}</div>
                    <div class="tag-count">${tag.count} post${tag.count !== 1 ? 's' : ''}</div>
                </div>
                <div class="tag-actions">
                    <button class="icon-btn" onclick="admin.editTag('${this.escapeHtml(tag.name)}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="admin.deleteTagConfirm('${this.escapeHtml(tag.name)}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterTags(query) {
        const filtered = this.tags.filter(tag => 
            tag.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderTags(filtered);
    }

    openTagModal(tag = null) {
        this.currentEditTag = tag;
        const modal = document.getElementById('tag-modal');
        const title = document.getElementById('tag-modal-title');

        title.textContent = tag ? 'Edit Tag' : 'New Tag';
        document.getElementById('tag-name').value = tag?.name || '';

        modal.classList.add('active');
    }

    editTag(name) {
        const tag = this.tags.find(t => t.name === name);
        if (tag) {
            this.openTagModal(tag);
        }
    }

    async saveTag() {
        const newName = document.getElementById('tag-name').value.trim();

        if (!newName) {
            this.showToast('Please enter a tag name', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-tag-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            if (this.currentEditTag && this.currentEditTag.name !== newName) {
                // Rename tag across all posts
                const updatedCount = await this.githubAPI.renameTag(this.currentEditTag.name, newName);
                this.showToast(`Tag renamed in ${updatedCount} post(s)`, 'success');
            } else if (!this.currentEditTag) {
                this.showToast('Tags are created by adding them to posts', 'info');
            }

            this.closeAllModals();
            await this.loadPosts();
            this.updateDashboardStats();

        } catch (error) {
            this.showToast('Failed to save tag: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Tag';
        }
    }

    deleteTagConfirm(name) {
        document.getElementById('delete-message').textContent = `Are you sure you want to remove "${name}" from all posts?`;
        this.deleteCallback = async () => {
            try {
                const updatedCount = await this.githubAPI.deleteTag(name);
                this.showToast(`Tag removed from ${updatedCount} post(s)`, 'success');
                await this.loadPosts();
                this.updateDashboardStats();
            } catch (error) {
                this.showToast('Failed to delete tag: ' + error.message, 'error');
            }
        };
        document.getElementById('delete-modal').classList.add('active');
    }

    // ============================================
    // Spotify Integration
    // ============================================

    async loadSpotifyPlaylists() {
        const container = document.getElementById('spotify-content');
        
        if (!this.spotifyAPI || !this.spotifyAPI.hasCredentials()) {
            container.innerHTML = `
                <div class="spotify-not-connected">
                    <div class="spotify-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                    </div>
                    <h3>Connect Your Spotify Account</h3>
                    <p>Add your Spotify credentials in the login screen to display your playlists</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="loading">Loading playlists...</div>';

        try {
            this.playlists = await this.spotifyAPI.getUserPlaylists();
            this.renderSpotifyPlaylists();
            this.updateDashboardStats();
        } catch (error) {
            container.innerHTML = `
                <div class="spotify-not-connected">
                    <div class="spotify-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                    </div>
                    <h3>Error Loading Playlists</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    renderSpotifyPlaylists() {
        const container = document.getElementById('spotify-content');
        
        if (this.playlists.length === 0) {
            container.innerHTML = `
                <div class="spotify-not-connected">
                    <div class="spotify-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                    </div>
                    <h3>No Playlists Found</h3>
                    <p>No public playlists found for this account</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="spotify-playlists">
                ${this.playlists.map(playlist => `
                    <div class="playlist-card">
                        <div class="playlist-image" style="background-image: url('${playlist.image || '../src/assets/images/default-blog-image.svg'}')"></div>
                        <div class="playlist-info">
                            <div class="playlist-name" title="${this.escapeHtml(playlist.name)}">${this.escapeHtml(playlist.name)}</div>
                            <div class="playlist-tracks">${playlist.tracks} tracks</div>
                            <button class="playlist-embed-btn" onclick="admin.copyEmbedCode('${playlist.id}')">
                                Copy Embed Code
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    connectSpotify() {
        this.showToast('Add Spotify credentials in the login screen, then log in again', 'info');
    }

    copyEmbedCode(playlistId) {
        const embedCode = this.spotifyAPI.getEmbedCode(playlistId);
        navigator.clipboard.writeText(embedCode).then(() => {
            this.showToast('Embed code copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy embed code', 'error');
        });
    }

    // ============================================
    // Modals
    // ============================================

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentEditPost = null;
        this.currentEditCategory = null;
        this.currentEditTag = null;
    }

    confirmDelete() {
        if (this.deleteCallback) {
            this.deleteCallback();
            this.deleteCallback = null;
        }
        this.closeAllModals();
    }

    // ============================================
    // Utilities
    // ============================================

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize admin dashboard
const admin = new AdminDashboard();
