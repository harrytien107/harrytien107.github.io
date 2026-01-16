/**
 * HarryTien Admin Dashboard - Main Application
 * Handles UI interactions and orchestrates API calls
 */

class AdminDashboard {
    constructor() {
        this.githubAPI = null;
        this.cryptoUtils = new CryptoUtils();
        this.posts = [];
        this.projects = [];
        this.categories = [];
        this.tags = [];
        this.currentEditPost = null;
        this.currentEditProject = null;
        this.currentEditCategory = null;
        this.currentEditTag = null;
        this.deleteCallback = null;
        this.pendingImageUpload = null;
        this.pendingProjectImageUpload = null;

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

        // Thumbnail upload - Fixed: direct file input change
        document.getElementById('post-thumbnail')?.addEventListener('change', (e) => this.handleThumbnailSelect(e));
        document.getElementById('remove-thumbnail-btn')?.addEventListener('click', () => this.removeThumbnail());

        // Projects
        document.getElementById('new-project-btn')?.addEventListener('click', () => this.openProjectModal());
        document.getElementById('save-project-btn')?.addEventListener('click', () => this.saveProject());
        document.getElementById('projects-search')?.addEventListener('input', (e) => this.filterProjects(e.target.value));

        // Project image upload
        document.getElementById('project-image')?.addEventListener('change', (e) => this.handleProjectImageSelect(e));
        document.getElementById('remove-project-image-btn')?.addEventListener('click', () => this.removeProjectImage());

        // Categories
        document.getElementById('new-category-btn')?.addEventListener('click', () => this.openCategoryModal());
        document.getElementById('save-category-btn')?.addEventListener('click', () => this.saveCategory());
        document.getElementById('categories-search')?.addEventListener('input', (e) => this.filterCategories(e.target.value));

        // Tags
        document.getElementById('new-tag-btn')?.addEventListener('click', () => this.openTagModal());
        document.getElementById('save-tag-btn')?.addEventListener('click', () => this.saveTag());
        document.getElementById('tags-search')?.addEventListener('input', (e) => this.filterTags(e.target.value));

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
                const { githubToken } = credentials;
                if (githubToken) {
                    document.getElementById('github-token').value = githubToken;
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
                    githubToken
                });
            } else {
                this.cryptoUtils.clearCredentials();
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
        this.posts = [];
        this.projects = [];
        this.categories = [];
        this.tags = [];

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
            projects: 'My Projects',
            categories: 'Categories',
            tags: 'Tags'
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
            case 'new-project':
                this.navigateTo('projects');
                this.openProjectModal();
                break;
            case 'new-category':
                this.navigateTo('categories');
                this.openCategoryModal();
                break;
            case 'new-tag':
                this.navigateTo('tags');
                this.openTagModal();
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
                this.loadProjects()
            ]);
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats() {
        document.getElementById('stat-posts').textContent = this.posts.length;
        document.getElementById('stat-projects').textContent = this.projects.length;
        document.getElementById('stat-categories').textContent = this.categories.length;
        document.getElementById('stat-tags').textContent = this.tags.length;

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
        this.pendingImageUpload = null;
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
            } else {
                document.getElementById('thumbnail-preview').innerHTML = '<span>No image selected</span>';
                document.getElementById('remove-thumbnail-btn').style.display = 'none';
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

    // Fixed: Handle thumbnail selection and preview
    handleThumbnailSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            e.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image size must be less than 5MB', 'error');
            e.target.value = '';
            return;
        }

        // Store file for later upload
        this.pendingImageUpload = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('thumbnail-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Thumbnail preview">`;
            document.getElementById('remove-thumbnail-btn').style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        this.showToast('Image selected. It will be uploaded when you save the post.', 'info');
    }

    removeThumbnail() {
        document.getElementById('thumbnail-preview').innerHTML = '<span>No image selected</span>';
        document.getElementById('post-thumbnail').value = '';
        document.getElementById('post-image-path').value = '';
        document.getElementById('remove-thumbnail-btn').style.display = 'none';
        this.pendingImageUpload = null;
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
            // Upload image if pending
            if (this.pendingImageUpload) {
                this.showToast('Uploading image...', 'info');
                const result = await this.githubAPI.uploadPostImage(this.pendingImageUpload);
                post.image = result.path;
                this.pendingImageUpload = null;
            }

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
    // Projects Management
    // ============================================

    async loadProjects() {
        const container = document.getElementById('projects-list');
        container.innerHTML = '<div class="loading">Loading projects...</div>';

        try {
            this.projects = await this.githubAPI.getProjects();
            this.renderProjects();
        } catch (error) {
            container.innerHTML = `<div class="empty-state"><p>Error loading projects: ${error.message}</p></div>`;
            this.showToast('Failed to load projects', 'error');
        }
    }

    renderProjects(projects = this.projects) {
        const container = document.getElementById('projects-list');
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    <h3>No projects found</h3>
                    <p>Add your first project to showcase your work</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map((project, index) => `
            <div class="post-card" data-index="${index}">
                <div class="post-card-image" style="background-image: url('${project.image ? (project.image.startsWith('/') ? '..' + project.image : project.image) : '../src/assets/images/default-blog-image.svg'}')">
                </div>
                <div class="post-card-content">
                    <h3 class="post-card-title">${this.escapeHtml(project.title)}</h3>
                    <p class="post-card-excerpt">${this.escapeHtml(project.description || '')}</p>
                    <div class="post-card-meta">
                        ${project.tech.slice(0, 3).map(t => `<span class="tech-badge">${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                    <div class="post-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="admin.editProject(${index})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="admin.deleteProjectConfirm(${index})">
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

    filterProjects(query) {
        const filtered = this.projects.filter(project => 
            project.title.toLowerCase().includes(query.toLowerCase()) ||
            project.description?.toLowerCase().includes(query.toLowerCase()) ||
            project.tech.some(t => t.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderProjects(filtered);
    }

    openProjectModal(project = null, index = null) {
        this.currentEditProject = project ? { ...project, index } : null;
        this.pendingProjectImageUpload = null;
        const modal = document.getElementById('project-modal');
        const title = document.getElementById('project-modal-title');
        const form = document.getElementById('project-form');

        title.textContent = project ? 'Edit Project' : 'New Project';
        form.reset();

        if (project) {
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-tech').value = project.tech.join(', ');
            document.getElementById('project-github').value = project.github || '';
            document.getElementById('project-demo').value = project.demo || '';
            document.getElementById('project-image-path').value = project.image || '';
            document.getElementById('project-index').value = index;

            // Show image preview
            if (project.image) {
                const preview = document.getElementById('project-image-preview');
                preview.innerHTML = `<img src="${project.image.startsWith('/') ? '..' + project.image : project.image}" alt="Project image">`;
                document.getElementById('remove-project-image-btn').style.display = 'block';
            } else {
                document.getElementById('project-image-preview').innerHTML = '<span>No image selected</span>';
                document.getElementById('remove-project-image-btn').style.display = 'none';
            }
        } else {
            document.getElementById('project-image-preview').innerHTML = '<span>No image selected</span>';
            document.getElementById('remove-project-image-btn').style.display = 'none';
        }

        modal.classList.add('active');
    }

    editProject(index) {
        const project = this.projects[index];
        if (project) {
            this.openProjectModal(project, index);
        }
    }

    handleProjectImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            e.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image size must be less than 5MB', 'error');
            e.target.value = '';
            return;
        }

        // Store file for later upload
        this.pendingProjectImageUpload = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('project-image-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Project image preview">`;
            document.getElementById('remove-project-image-btn').style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        this.showToast('Image selected. It will be uploaded when you save the project.', 'info');
    }

    removeProjectImage() {
        document.getElementById('project-image-preview').innerHTML = '<span>No image selected</span>';
        document.getElementById('project-image').value = '';
        document.getElementById('project-image-path').value = '';
        document.getElementById('remove-project-image-btn').style.display = 'none';
        this.pendingProjectImageUpload = null;
    }

    async saveProject() {
        const project = {
            title: document.getElementById('project-title').value.trim(),
            description: document.getElementById('project-description').value.trim(),
            tech: document.getElementById('project-tech').value.split(',').map(t => t.trim()).filter(t => t),
            github: document.getElementById('project-github').value.trim(),
            demo: document.getElementById('project-demo').value.trim(),
            image: document.getElementById('project-image-path').value
        };

        if (!project.title || !project.description) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-project-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>Saving...</span>';

        try {
            // Upload image if pending
            if (this.pendingProjectImageUpload) {
                this.showToast('Uploading image...', 'info');
                const result = await this.githubAPI.uploadPostImage(this.pendingProjectImageUpload);
                project.image = result.path;
                this.pendingProjectImageUpload = null;
            }

            const index = document.getElementById('project-index').value;
            
            if (this.currentEditProject && index !== '') {
                await this.githubAPI.updateProject(parseInt(index), project);
                this.showToast('Project updated successfully', 'success');
            } else {
                await this.githubAPI.createProject(project);
                this.showToast('Project created successfully', 'success');
            }

            this.closeAllModals();
            await this.loadProjects();
            this.updateDashboardStats();

        } catch (error) {
            this.showToast('Failed to save project: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>Save Project</span>';
        }
    }

    deleteProjectConfirm(index) {
        const project = this.projects[index];
        document.getElementById('delete-message').textContent = `Are you sure you want to delete "${project.title}"?`;
        this.deleteCallback = async () => {
            try {
                await this.githubAPI.deleteProject(index);
                this.showToast('Project deleted successfully', 'success');
                await this.loadProjects();
                this.updateDashboardStats();
            } catch (error) {
                this.showToast('Failed to delete project: ' + error.message, 'error');
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
    // Modals
    // ============================================

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentEditPost = null;
        this.currentEditProject = null;
        this.currentEditCategory = null;
        this.currentEditTag = null;
        this.pendingImageUpload = null;
        this.pendingProjectImageUpload = null;
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
