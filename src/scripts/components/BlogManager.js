// Blog Manager Component - Markdown Edition
export class BlogManager {
  constructor() {
    // Check if marked.js is available
    if (typeof window !== 'undefined' && window.marked) {
      this.marked = window.marked;
    } else {
      console.warn('marked.js library not found. Please include it in your HTML.');
    }
  }

  /**
   * Initialize the blog manager
   */
  async init() {
    console.log('📝 Initializing Blog Manager (Markdown Edition)...');
    
    // Check if we're on a blog post page
    if (this.isBlogPostPage()) {
      await this.initBlogPostPage();
    }
  }

  /**
   * Check if current page is a blog post page
   */
  isBlogPostPage() {
    return window.location.pathname.includes('blog-template.html') || 
           window.location.search.includes('post=');
  }

  /**
   * Initialize blog post page functionality
   */
  async initBlogPostPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const postFile = urlParams.get('post');
    
    if (!postFile) {
      this.displayError('No blog post specified.');
      return;
    }

    try {
      await this.loadAndRenderPost(postFile);
    } catch (error) {
      console.error('Error loading blog post:', error);
      this.displayError('Sorry, this blog post could not be loaded.');
    }
  }

  /**
   * Load and render a Markdown blog post
   */
  async loadAndRenderPost(filename) {
    try {
      // Show loading state
      this.showLoadingState();

      // Fetch the markdown file
      const response = await fetch(`${filename}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load post: ${response.status} ${response.statusText}`);
      }
      
      const markdownContent = await response.text();
      
      // Parse frontmatter and content
      const parseResult = this.parseFrontmatter(markdownContent);
      
      // Update page metadata
      this.updatePageMetadata(parseResult.frontmatter);
      
      // Convert markdown to HTML and render
      const htmlContent = this.marked ? this.marked.parse(parseResult.content) : parseResult.content;
      this.renderContent(htmlContent);
      
    } catch (error) {
      console.error('Error in loadAndRenderPost:', error);
      throw error;
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  parseFrontmatter(content) {
    const lines = content.split('\n');
    
    // Check if content starts with frontmatter delimiter
    if (lines[0] !== '---') {
      return { 
        frontmatter: this.getDefaultFrontmatter(), 
        content: content 
      };
    }
    
    // Find the end of frontmatter
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex === -1) {
      return { 
        frontmatter: this.getDefaultFrontmatter(), 
        content: content 
      };
    }
    
    // Parse frontmatter lines
    const frontmatterLines = lines.slice(1, endIndex);
    const contentLines = lines.slice(endIndex + 1);
    
    const frontmatter = {};
    
    frontmatterLines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        frontmatter[key] = value;
      }
    });
    
    return {
      frontmatter: { ...this.getDefaultFrontmatter(), ...frontmatter },
      content: contentLines.join('\n')
    };
  }

  /**
   * Get default frontmatter values
   */
  getDefaultFrontmatter() {
    return {
      title: 'Untitled Post',
      description: 'A blog post',
      date: new Date().toLocaleDateString(),
      readTime: '1 min read',
      tags: ''
    };
  }

  /**
   * Update page metadata based on frontmatter
   */
  updatePageMetadata(frontmatter) {
    // Update page title
    if (frontmatter.title) {
      document.title = `${frontmatter.title} - HarryTien`;
      
      const postTitle = document.getElementById('post-title');
      const postHeaderTitle = document.getElementById('post-header-title');
      const breadcrumbTitle = document.getElementById('breadcrumb-title');
      
      if (postTitle) postTitle.textContent = `${frontmatter.title} - HarryTien`;
      if (postHeaderTitle) postHeaderTitle.textContent = frontmatter.title;
      if (breadcrumbTitle) breadcrumbTitle.textContent = frontmatter.title;
    }
    
    // Update meta description
    if (frontmatter.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = frontmatter.description;
      }
    }
    
    // Update post metadata (date and read time)
    if (frontmatter.date || frontmatter.readTime) {
      const metaElement = document.getElementById('post-meta');
      if (metaElement) {
        metaElement.style.display = 'block';
        
        const postDate = document.getElementById('post-date');
        const postReadTime = document.getElementById('post-read-time');
        
        if (frontmatter.date && postDate) {
          postDate.textContent = frontmatter.date;
        }
        
        if (frontmatter.readTime && postReadTime) {
          postReadTime.textContent = frontmatter.readTime;
        }
      }
    }
    
    // Update tags
    if (frontmatter.tags) {
      const tagsElement = document.getElementById('post-tags');
      if (tagsElement) {
        const tags = frontmatter.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tags.length > 0) {
          tagsElement.innerHTML = tags.map(tag => 
            `<span class="tag">${this.escapeHtml(tag)}</span>`
          ).join('');
          tagsElement.style.display = 'block';
        }
      }
    }
  }

  /**
   * Render the markdown content as HTML
   */
  renderContent(htmlContent) {
    const contentElement = document.getElementById('blog-content');
    if (contentElement) {
      contentElement.innerHTML = htmlContent;
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const contentElement = document.getElementById('blog-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Loading blog post...</p>
        </div>
      `;
    }
  }

  /**
   * Display error message
   */
  displayError(message) {
    const contentElement = document.getElementById('blog-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="error-message">
          <h3>Oops! Something went wrong</h3>
          <p>${this.escapeHtml(message)}</p>
          <p><a href="../blog.html" class="btn btn--outline">← Back to Blog</a></p>
        </div>
      `;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  /**
   * Get blog post data (for external use)
   */
  async getBlogPost(filename) {
    try {
      const response = await fetch(`${filename}.md`);
      if (!response.ok) return null;
      
      const markdownContent = await response.text();
      const parseResult = this.parseFrontmatter(markdownContent);
      
      return {
        id: filename,
        title: parseResult.frontmatter.title,
        description: parseResult.frontmatter.description,
        date: parseResult.frontmatter.date,
        readTime: parseResult.frontmatter.readTime,
        tags: parseResult.frontmatter.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        content: parseResult.content,
        frontmatter: parseResult.frontmatter
      };
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
  }

  /**
   * Legacy method for backward compatibility (returns empty array since we're not managing posts in memory)
   */
  async getPosts() {
    console.warn('getPosts() is deprecated. Use getBlogPost() for individual posts.');
    return [];
  }
} 