// Tag Manager Component
export class TagManager {
  constructor() {
    this.tags = [];
  }

  /**
   * Initialize the tag manager
   */
  async init() {
    console.log('🏷️ Initializing Tag Manager...');
    // Setup tag-specific functionality
  }

  /**
   * Get all tags
   */
  async getTags() {
    return [...this.tags];
  }

  /**
   * Set tags
   */
  setTags(tags) {
    this.tags = [...tags];
  }

  /**
   * Add a new tag
   */
  addTag(tag) {
    const existingTag = this.getTagByName(tag.name);
    if (existingTag) {
      this.updateTag(existingTag.id, { count: existingTag.count + 1 });
    } else {
      this.tags.push(tag);
    }
  }

  /**
   * Update an existing tag
   */
  updateTag(id, updatedTag) {
    const index = this.tags.findIndex(tag => tag.id === id);
    if (index !== -1) {
      this.tags[index] = { ...this.tags[index], ...updatedTag };
    }
  }

  /**
   * Delete a tag
   */
  deleteTag(id) {
    this.tags = this.tags.filter(tag => tag.id !== id);
  }

  /**
   * Get tag by name
   */
  getTagByName(name) {
    return this.tags.find(tag => 
      tag.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get tag by ID
   */
  getTagById(id) {
    return this.tags.find(tag => tag.id === id);
  }

  /**
   * Render tags to a container
   */
  renderTags(tags, container) {
    container.innerHTML = '';

    if (tags.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4xl w-full">
          <h3 class="text-xl text-muted mb-base">No tags yet</h3>
          <p class="text-light">Tags will be displayed here when available.</p>
        </div>
      `;
      return;
    }

    // Sort tags by count (descending) for better visual hierarchy
    const sortedTags = [...tags].sort((a, b) => b.count - a.count);

    sortedTags.forEach(tag => {
      const tagElement = this.createTagElement(tag);
      container.appendChild(tagElement);
    });
  }

  /**
   * Create a tag element
   */
  createTagElement(tag) {
    const tagSpan = document.createElement('span');
    
    // Calculate tag size based on count (tag cloud effect)
    const tagSize = this.calculateTagSize(tag.count);
    tagSpan.className = `tag tag--large ${tagSize}`;
    tagSpan.setAttribute('data-tag-id', tag.id);
    tagSpan.setAttribute('data-tag-name', tag.name);
    tagSpan.style.cursor = 'pointer';
    
    tagSpan.innerHTML = `
      ${tag.name}
      <span class="tag__count">${tag.count}</span>
    `;

    // Add event listeners
    this.addTagEventListeners(tagSpan, tag);

    return tagSpan;
  }

  /**
   * Calculate tag size based on usage count
   */
  calculateTagSize(count) {
    const maxCount = Math.max(...this.tags.map(t => t.count));
    const minCount = Math.min(...this.tags.map(t => t.count));
    const ratio = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;

    if (ratio > 0.8) return 'tag--xl';
    if (ratio > 0.6) return 'tag--lg';
    if (ratio > 0.4) return 'tag--md';
    if (ratio > 0.2) return 'tag--sm';
    return 'tag--xs';
  }

  /**
   * Add event listeners to a tag element
   */
  addTagEventListeners(element, tag) {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleTagClick(tag);
    });

    // Add hover effects
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-2px) scale(1.05)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0) scale(1)';
    });

    // Add keyboard navigation
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleTagClick(tag);
      }
    });
  }

  /**
   * Handle tag click
   */
  handleTagClick(tag) {
    console.log(`Clicked on tag: ${tag.name}`);
    
    // In a real application, this would:
    // 1. Filter blog posts by tag
    // 2. Navigate to a tag-specific page
    // 3. Update the URL to reflect the tag filter
    
    // For demonstration, show tag details
    this.showTagDetails(tag);
  }

  /**
   * Show details for a specific tag
   */
  showTagDetails(tag) {
    // Create modal to show tag details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal__header">
          <h2 class="modal__title">
            🏷️ ${tag.name}
          </h2>
          <button class="modal__close" aria-label="Close tag details">&times;</button>
        </div>
        <div class="modal__body">
          <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--color-background-alt); border-radius: 8px;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1rem; font-weight: 600;">Tag Statistics</h3>
            <p style="margin-bottom: 0.5rem; color: var(--color-text-light);">
              <strong>${tag.count}</strong> post${tag.count !== 1 ? 's' : ''} tagged with "${tag.name}"
            </p>
            <p style="margin: 0; color: var(--color-text-light); font-size: 0.875rem;">
              This tag represents ${this.calculateTagPercentage(tag.count)}% of all tagged content
            </p>
          </div>
          
          <div id="tag-posts-list">
            <div class="text-center py-2xl">
              <div class="spinner"></div>
              <p style="margin-top: 1rem; color: var(--color-text-light);">Loading posts with this tag...</p>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline modal-close-btn">Close</button>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('.modal__close');
    const closeModalBtn = modal.querySelector('.modal-close-btn');
    
    const closeModal = () => {
      modal.classList.remove('modal-overlay--open');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 250);
    };

    closeBtn?.addEventListener('click', closeModal);
    closeModalBtn?.addEventListener('click', closeModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Add to DOM and show
    document.body.appendChild(modal);
    setTimeout(() => {
      modal.classList.add('modal-overlay--open');
      // Simulate loading posts
      this.loadTagPosts(tag, modal);
    }, 10);
  }

  /**
   * Load posts for a tag (simulated)
   */
  loadTagPosts(tag, modal) {
    const postsList = modal.querySelector('#tag-posts-list');
    
    // Simulate API call delay
    setTimeout(() => {
      if (postsList) {
        // In a real app, you'd fetch actual posts from the blog manager
        const samplePosts = this.generateSampleTagPosts(tag);
        
        postsList.innerHTML = `
          <div style="display: grid; gap: 1rem;">
            ${samplePosts.map(post => `
              <div style="padding: 1rem; border: 1px solid var(--color-border); border-radius: 8px;">
                <h4 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 600;">
                  ${post.title}
                </h4>
                <p style="margin-bottom: 0.5rem; color: var(--color-text-light); font-size: 0.875rem;">
                  ${post.date} • ${post.readTime} min read
                </p>
                <p style="margin-bottom: 0.5rem; color: var(--color-text-light);">
                  ${post.excerpt}
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                  ${post.tags.map(t => `<span class="tag" style="font-size: 0.75rem;">${t}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          ${samplePosts.length === 0 ? 
            `<div class="text-center py-2xl">
              <p style="color: var(--color-text-light);">No posts with this tag yet.</p>
            </div>` : 
            ''
          }
        `;
      }
    }, 1000);
  }

  /**
   * Generate sample posts for a tag (for demonstration)
   */
  generateSampleTagPosts(tag) {
    const samplePostsMap = {
      'networking': [
        {
          title: 'Understanding Modern Network Security Challenges',
          excerpt: 'Exploring the latest challenges in network security and how to address them effectively.',
          date: '2024-01-15',
          readTime: 8,
          tags: ['networking', 'security', 'cybersecurity']
        },
        {
          title: 'Building Resilient Network Infrastructure',
          excerpt: 'Best practices for designing and implementing resilient network infrastructure.',
          date: '2024-01-08',
          readTime: 10,
          tags: ['networking', 'infrastructure', 'architecture']
        }
      ],
      'security': [
        {
          title: 'Understanding Modern Network Security Challenges',
          excerpt: 'Exploring the latest challenges in network security and how to address them effectively.',
          date: '2024-01-15',
          readTime: 8,
          tags: ['networking', 'security', 'cybersecurity']
        },
        {
          title: 'Implementing Zero Trust Architecture',
          excerpt: 'A comprehensive guide to implementing zero trust security in your network infrastructure.',
          date: '2024-01-10',
          readTime: 12,
          tags: ['security', 'architecture', 'cybersecurity']
        }
      ],
      'typescript': [
        {
          title: 'Advanced TypeScript Patterns for Network Applications',
          excerpt: 'Exploring advanced TypeScript patterns for building robust network applications.',
          date: '2024-01-12',
          readTime: 15,
          tags: ['typescript', 'programming', 'networking']
        }
      ],
      'python': [
        {
          title: 'Python for Network Automation',
          excerpt: 'Using Python to automate network configuration and monitoring tasks.',
          date: '2024-01-05',
          readTime: 12,
          tags: ['python', 'automation', 'networking']
        }
      ]
    };

    return samplePostsMap[tag.name.toLowerCase()] || [];
  }

  /**
   * Calculate what percentage of total posts this tag represents
   */
  calculateTagPercentage(count) {
    const totalCount = this.tags.reduce((sum, tag) => sum + tag.count, 0);
    return totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
  }

  /**
   * Search tags by name
   */
  searchTags(query) {
    const lowerQuery = query.toLowerCase();
    return this.tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get tags sorted by count
   */
  getTagsByCount(ascending = false) {
    return [...this.tags].sort((a, b) => 
      ascending ? a.count - b.count : b.count - a.count
    );
  }

  /**
   * Get tags sorted alphabetically
   */
  getTagsAlphabetically(ascending = true) {
    return [...this.tags].sort((a, b) => 
      ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }

  /**
   * Get popular tags (top N by count)
   */
  getPopularTags(limit = 10) {
    return this.getTagsByCount().slice(0, limit);
  }

  /**
   * Update tag count
   */
  updateTagCount(tagName, count) {
    const tag = this.getTagByName(tagName);
    if (tag) {
      this.updateTag(tag.id, { count });
    }
  }

  /**
   * Increment tag count
   */
  incrementTagCount(tagName) {
    const tag = this.getTagByName(tagName);
    if (tag) {
      this.updateTag(tag.id, { count: tag.count + 1 });
    }
  }

  /**
   * Decrement tag count (and remove if count reaches 0)
   */
  decrementTagCount(tagName) {
    const tag = this.getTagByName(tagName);
    if (tag) {
      if (tag.count <= 1) {
        this.deleteTag(tag.id);
      } else {
        this.updateTag(tag.id, { count: tag.count - 1 });
      }
    }
  }

  /**
   * Get total post count across all tags
   */
  getTotalTaggedPosts() {
    return this.tags.reduce((total, tag) => total + tag.count, 0);
  }

  /**
   * Get related tags (tags that commonly appear together)
   */
  getRelatedTags(tagName, limit = 5) {
    // In a real application, this would analyze co-occurrence patterns
    // For now, return popular tags excluding the current one
    return this.getPopularTags(limit + 1)
      .filter(tag => tag.name.toLowerCase() !== tagName.toLowerCase())
      .slice(0, limit);
  }
} 