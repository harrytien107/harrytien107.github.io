// Blog Manager Component
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  date: string;
  readTime: number;
}

export class BlogManager {
  private posts: BlogPost[] = [];
  private isEditorOpen: boolean = false;

  constructor() {
    // Initialize blog manager
  }

  /**
   * Initialize the blog manager
   */
  public async init(): Promise<void> {
    console.log('📝 Initializing Blog Manager...');
    // Setup blog-specific functionality
    this.setupBlogEditor();
  }

  /**
   * Get all blog posts
   */
  public async getPosts(): Promise<BlogPost[]> {
    return [...this.posts];
  }

  /**
   * Set blog posts
   */
  public setPosts(posts: BlogPost[]): void {
    this.posts = [...posts];
  }

  /**
   * Add a new blog post
   */
  public addPost(post: BlogPost): void {
    this.posts.unshift(post);
  }

  /**
   * Update an existing blog post
   */
  public updatePost(id: string, updatedPost: Partial<BlogPost>): void {
    const index = this.posts.findIndex(post => post.id === id);
    if (index !== -1) {
      this.posts[index] = { ...this.posts[index], ...updatedPost };
    }
  }

  /**
   * Delete a blog post
   */
  public deletePost(id: string): void {
    this.posts = this.posts.filter(post => post.id !== id);
  }

  /**
   * Render blog posts to a container
   */
  public renderPosts(posts: BlogPost[], container: HTMLElement): void {
    container.innerHTML = '';

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4xl">
          <h3 class="text-xl text-muted mb-base">No blog posts yet</h3>
          <p class="text-light">Start writing your first blog post!</p>
        </div>
      `;
      return;
    }

    posts.forEach(post => {
      const postElement = this.createPostElement(post);
      container.appendChild(postElement);
    });
  }

  /**
   * Create a blog post element
   */
  private createPostElement(post: BlogPost): HTMLElement {
    const postDiv = document.createElement('article');
    postDiv.className = 'blog-post-card';
    
    postDiv.innerHTML = `
      <div class="blog-post-card__content">
        <div class="blog-post-card__meta">
          <span class="blog-post-card__date">${this.formatDate(post.date)}</span>
          <span class="blog-post-card__read-time">${post.readTime} min read</span>
        </div>
        <h2 class="blog-post-card__title">
          <a href="#" data-post-id="${post.id}">${post.title}</a>
        </h2>
        <p class="blog-post-card__excerpt">${post.excerpt}</p>
        <div class="blog-post-card__tags">
          ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="blog-post-card__footer">
          <a href="#" class="blog-post-card__read-more" data-post-id="${post.id}">Read more →</a>
          <div class="blog-post-card__actions">
            <button class="btn btn--small btn--outline" data-action="edit" data-post-id="${post.id}">Edit</button>
            <button class="btn btn--small btn--outline" data-action="delete" data-post-id="${post.id}">Delete</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.addPostEventListeners(postDiv, post);

    return postDiv;
  }

  /**
   * Add event listeners to a post element
   */
  private addPostEventListeners(element: HTMLElement, post: BlogPost): void {
    // Edit button
    const editBtn = element.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.editPost(post.id);
      });
    }

    // Delete button
    const deleteBtn = element.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.confirmDeletePost(post.id);
      });
    }

    // Read more links
    const readMoreLinks = element.querySelectorAll('[data-post-id]');
    readMoreLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPost(post.id);
      });
    });
  }

  /**
   * Setup blog editor functionality
   */
  private setupBlogEditor(): void {
    // This will be called when the blog editor is needed
  }

  /**
   * Create a new blog post
   */
  public createNewPost(): void {
    this.openBlogEditor();
  }

  /**
   * Edit an existing blog post
   */
  private editPost(postId: string): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.openBlogEditor(post);
    }
  }

  /**
   * Open the blog editor
   */
  private openBlogEditor(post?: BlogPost): void {
    if (this.isEditorOpen) {
      return;
    }

    this.isEditorOpen = true;
    
    // Create editor modal
    const modal = this.createEditorModal(post);
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
      modal.classList.add('modal-overlay--open');
    }, 10);
  }

  /**
   * Create editor modal
   */
  private createEditorModal(post?: BlogPost): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal" style="width: 90vw; max-width: 1000px;">
        <div class="modal__header">
          <h2 class="modal__title">${post ? 'Edit Post' : 'New Post'}</h2>
          <button class="modal__close" aria-label="Close editor">&times;</button>
        </div>
        <div class="modal__body">
          <div class="blog-editor">
            <div class="blog-editor__header">
              <input 
                type="text" 
                class="blog-editor__title-input" 
                placeholder="Post title..." 
                value="${post?.title || ''}"
              >
              <div class="blog-editor__meta">
                <div class="blog-editor__meta-item">
                  <label>Categories:</label>
                  <input type="text" placeholder="e.g., Technology, Web Development" value="${post?.categories.join(', ') || ''}">
                </div>
                <div class="blog-editor__meta-item">
                  <label>Tags:</label>
                  <input type="text" placeholder="e.g., javascript, tutorial, tips" value="${post?.tags.join(', ') || ''}">
                </div>
              </div>
            </div>
            <div class="blog-editor__content">
              <textarea 
                class="blog-editor__content-input" 
                placeholder="Start writing your post..."
              >${post?.content || ''}</textarea>
            </div>
            <div class="blog-editor__toolbar">
              <button class="blog-editor__tool" data-action="bold" title="Bold">B</button>
              <button class="blog-editor__tool" data-action="italic" title="Italic">I</button>
              <button class="blog-editor__tool" data-action="heading" title="Heading">H</button>
              <button class="blog-editor__tool" data-action="link" title="Link">🔗</button>
              <button class="blog-editor__tool" data-action="image" title="Image">📷</button>
              <button class="blog-editor__tool" data-action="code" title="Code">💻</button>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline modal-cancel">Cancel</button>
          <button class="btn btn--primary modal-save">${post ? 'Update' : 'Publish'}</button>
        </div>
      </div>
    `;

    // Add event listeners
    this.addEditorEventListeners(modal, post);

    return modal;
  }

  /**
   * Add event listeners to editor modal
   */
  private addEditorEventListeners(modal: HTMLElement, post?: BlogPost): void {
    // Close modal
    const closeBtn = modal.querySelector('.modal__close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    
    const closeModal = () => {
      modal.classList.remove('modal-overlay--open');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        this.isEditorOpen = false;
      }, 250);
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Save/Update post
    const saveBtn = modal.querySelector('.modal-save');
    saveBtn?.addEventListener('click', () => {
      this.savePost(modal, post);
      closeModal();
    });

    // Toolbar actions
    const toolButtons = modal.querySelectorAll('.blog-editor__tool');
    toolButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        if (action) {
          this.handleToolbarAction(action, modal);
        }
      });
    });
  }

  /**
   * Save or update a blog post
   */
  private savePost(modal: HTMLElement, existingPost?: BlogPost): void {
    const titleInput = modal.querySelector('.blog-editor__title-input') as HTMLInputElement;
    const categoryInput = modal.querySelector('input[placeholder*="Technology"]') as HTMLInputElement;
    const tagInput = modal.querySelector('input[placeholder*="javascript"]') as HTMLInputElement;
    const contentInput = modal.querySelector('.blog-editor__content-input') as HTMLTextAreaElement;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const categories = categoryInput.value.split(',').map(c => c.trim()).filter(c => c);
    const tags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);

    if (!title || !content) {
      alert('Please fill in both title and content.');
      return;
    }

    const excerpt = this.generateExcerpt(content);
    const readTime = this.calculateReadTime(content);

    if (existingPost) {
      // Update existing post
      this.updatePost(existingPost.id, {
        title,
        content,
        excerpt,
        tags,
        categories,
        readTime
      });
    } else {
      // Create new post
      const newPost: BlogPost = {
        id: this.generateId(),
        title,
        content,
        excerpt,
        tags,
        categories,
        date: new Date().toISOString().split('T')[0],
        readTime
      };
      this.addPost(newPost);
    }

    // Refresh the blog posts display
    this.refreshPostsDisplay();
  }

  /**
   * Handle toolbar actions
   */
  private handleToolbarAction(action: string, modal: HTMLElement): void {
    const textarea = modal.querySelector('.blog-editor__content-input') as HTMLTextAreaElement;
    
    // Simple implementation - in a real app, you'd use a rich text editor
    switch (action) {
      case 'bold':
        this.wrapSelectedText(textarea, '**', '**');
        break;
      case 'italic':
        this.wrapSelectedText(textarea, '*', '*');
        break;
      case 'heading':
        this.wrapSelectedText(textarea, '## ', '');
        break;
      case 'code':
        this.wrapSelectedText(textarea, '`', '`');
        break;
      case 'link':
        this.insertLink(textarea);
        break;
      case 'image':
        this.insertImage(textarea);
        break;
    }
  }

  /**
   * Wrap selected text with markers
   */
  private wrapSelectedText(textarea: HTMLTextAreaElement, prefix: string, suffix: string): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
  }

  /**
   * Insert a link
   */
  private insertLink(textarea: HTMLTextAreaElement): void {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:') || 'Link';
    if (url) {
      const link = `[${text}](${url})`;
      this.insertAtCursor(textarea, link);
    }
  }

  /**
   * Insert an image
   */
  private insertImage(textarea: HTMLTextAreaElement): void {
    const url = prompt('Enter image URL:');
    const alt = prompt('Enter alt text:') || 'Image';
    if (url) {
      const image = `![${alt}](${url})`;
      this.insertAtCursor(textarea, image);
    }
  }

  /**
   * Insert text at cursor position
   */
  private insertAtCursor(textarea: HTMLTextAreaElement, text: string): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
  }

  /**
   * Confirm delete post
   */
  private confirmDeletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.deletePost(postId);
      this.refreshPostsDisplay();
    }
  }

  /**
   * Open a blog post for reading
   */
  private openPost(postId: string): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      // In a real app, this would navigate to a dedicated post page
      console.log('Opening post:', post.title);
      alert(`Opening "${post.title}"\n\n${post.content.substring(0, 200)}...`);
    }
  }

  /**
   * Refresh the posts display
   */
  private refreshPostsDisplay(): void {
    const container = document.getElementById('blog-posts-container');
    if (container) {
      this.renderPosts(this.posts, container);
    }
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, maxLength: number = 150): string {
    const plainText = content.replace(/[#*`\[\]()]/g, '');
    return plainText.length <= maxLength 
      ? plainText 
      : plainText.substring(0, maxLength) + '...';
  }

  /**
   * Calculate reading time
   */
  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 