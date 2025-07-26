// Category Manager Component
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
}

export class CategoryManager {
  private categories: Category[] = [];

  constructor() {
    // Initialize category manager
  }

  /**
   * Initialize the category manager
   */
  public async init(): Promise<void> {
    console.log('📁 Initializing Category Manager...');
    // Setup category-specific functionality
  }

  /**
   * Get all categories
   */
  public async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  /**
   * Set categories
   */
  public setCategories(categories: Category[]): void {
    this.categories = [...categories];
  }

  /**
   * Add a new category
   */
  public addCategory(category: Category): void {
    this.categories.push(category);
  }

  /**
   * Update an existing category
   */
  public updateCategory(id: string, updatedCategory: Partial<Category>): void {
    const index = this.categories.findIndex(category => category.id === id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updatedCategory };
    }
  }

  /**
   * Delete a category
   */
  public deleteCategory(id: string): void {
    this.categories = this.categories.filter(category => category.id !== id);
  }

  /**
   * Get category by name
   */
  public getCategoryByName(name: string): Category | undefined {
    return this.categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get category by ID
   */
  public getCategoryById(id: string): Category | undefined {
    return this.categories.find(category => category.id === id);
  }

  /**
   * Render categories to a container
   */
  public renderCategories(categories: Category[], container: HTMLElement): void {
    container.innerHTML = '';

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4xl col-span-full">
          <h3 class="text-xl text-muted mb-base">No categories yet</h3>
          <p class="text-light">Categories will be displayed here when available.</p>
        </div>
      `;
      return;
    }

    categories.forEach(category => {
      const categoryElement = this.createCategoryElement(category);
      container.appendChild(categoryElement);
    });
  }

  /**
   * Create a category element
   */
  private createCategoryElement(category: Category): HTMLElement {
    const categoryDiv = document.createElement('a');
    categoryDiv.className = 'category-card';
    categoryDiv.href = '#';
    categoryDiv.setAttribute('data-category-id', category.id);
    
    categoryDiv.innerHTML = `
      <div class="category-card__icon" role="img" aria-label="${category.name} icon">
        ${category.icon}
      </div>
      <div class="category-card__content">
        <h3 class="category-card__title">${category.name}</h3>
        <p class="category-card__count">${category.postCount} post${category.postCount !== 1 ? 's' : ''}</p>
        <p class="category-card__description">${category.description}</p>
      </div>
    `;

    // Add event listeners
    this.addCategoryEventListeners(categoryDiv, category);

    return categoryDiv;
  }

  /**
   * Add event listeners to a category element
   */
  private addCategoryEventListeners(element: HTMLElement, category: Category): void {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleCategoryClick(category);
    });

    // Add keyboard navigation
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleCategoryClick(category);
      }
    });
  }

  /**
   * Handle category click
   */
  private handleCategoryClick(category: Category): void {
    console.log(`Clicked on category: ${category.name}`);
    
    // In a real application, this would:
    // 1. Navigate to a category-specific page
    // 2. Filter blog posts by category
    // 3. Update the URL to reflect the category filter
    
    // For demonstration, show an alert
    this.showCategoryPosts(category);
  }

  /**
   * Show posts for a specific category
   */
  private showCategoryPosts(category: Category): void {
    // Create modal to show category posts
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 800px;">
        <div class="modal__header">
          <h2 class="modal__title">
            <span style="margin-right: 0.5rem;">${category.icon}</span>
            ${category.name}
          </h2>
          <button class="modal__close" aria-label="Close category posts">&times;</button>
        </div>
        <div class="modal__body">
          <p style="margin-bottom: 1.5rem; color: var(--color-text-light);">
            ${category.description}
          </p>
          
          <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--color-background-alt); border-radius: 8px;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1rem; font-weight: 600;">Category Stats</h3>
            <p style="margin: 0; color: var(--color-text-light);">
              ${category.postCount} post${category.postCount !== 1 ? 's' : ''} in this category
            </p>
          </div>
          
          <div id="category-posts-list">
            <div class="text-center py-2xl">
              <div class="spinner"></div>
              <p style="margin-top: 1rem; color: var(--color-text-light);">Loading posts...</p>
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
    const handleEscape = (e: KeyboardEvent) => {
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
      this.loadCategoryPosts(category, modal);
    }, 10);
  }

  /**
   * Load posts for a category (simulated)
   */
  private loadCategoryPosts(category: Category, modal: HTMLElement): void {
    const postsList = modal.querySelector('#category-posts-list');
    
    // Simulate API call delay
    setTimeout(() => {
      if (postsList) {
        // In a real app, you'd fetch actual posts from the blog manager
        postsList.innerHTML = `
          <div style="display: grid; gap: 1rem;">
            ${this.generateSampleCategoryPosts(category).map(post => `
              <div style="padding: 1rem; border: 1px solid var(--color-border); border-radius: 8px;">
                <h4 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 600;">
                  ${post.title}
                </h4>
                <p style="margin-bottom: 0.5rem; color: var(--color-text-light); font-size: 0.875rem;">
                  ${post.date} • ${post.readTime} min read
                </p>
                <p style="margin: 0; color: var(--color-text-light);">
                  ${post.excerpt}
                </p>
              </div>
            `).join('')}
          </div>
          
          ${category.postCount === 0 ? 
            `<div class="text-center py-2xl">
              <p style="color: var(--color-text-light);">No posts in this category yet.</p>
            </div>` : 
            ''
          }
        `;
      }
    }, 1000);
  }

  /**
   * Generate sample posts for a category (for demonstration)
   */
  private generateSampleCategoryPosts(category: Category) {
    const samplePosts = {
      'Network Security': [
        {
          title: 'Understanding Modern Network Security Challenges',
          excerpt: 'Exploring the latest challenges in network security and how to address them effectively.',
          date: '2024-01-15',
          readTime: 8
        },
        {
          title: 'Implementing Zero Trust Architecture',
          excerpt: 'A comprehensive guide to implementing zero trust security in your network infrastructure.',
          date: '2024-01-10',
          readTime: 12
        }
      ],
      'Network Engineering': [
        {
          title: 'Building Resilient Network Infrastructure',
          excerpt: 'Best practices for designing and implementing resilient network infrastructure.',
          date: '2024-01-08',
          readTime: 10
        },
        {
          title: 'Advanced Routing Protocols Explained',
          excerpt: 'Deep dive into modern routing protocols and their practical applications.',
          date: '2024-01-05',
          readTime: 15
        }
      ],
      'Cinema & Reviews': [
        {
          title: 'The Art of Cinematography in Modern Films',
          excerpt: 'Analyzing the visual storytelling techniques used in contemporary cinema.',
          date: '2024-01-12',
          readTime: 6
        }
      ]
    };

    return samplePosts[category.name as keyof typeof samplePosts] || [];
  }

  /**
   * Search categories by name or description
   */
  public searchCategories(query: string): Category[] {
    const lowerQuery = query.toLowerCase();
    return this.categories.filter(category => 
      category.name.toLowerCase().includes(lowerQuery) ||
      category.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get categories sorted by post count
   */
  public getCategoriesByPostCount(ascending: boolean = false): Category[] {
    return [...this.categories].sort((a, b) => 
      ascending ? a.postCount - b.postCount : b.postCount - a.postCount
    );
  }

  /**
   * Update post count for a category
   */
  public updatePostCount(categoryName: string, count: number): void {
    const category = this.getCategoryByName(categoryName);
    if (category) {
      this.updateCategory(category.id, { postCount: count });
    }
  }

  /**
   * Get total post count across all categories
   */
  public getTotalPostCount(): number {
    return this.categories.reduce((total, category) => total + category.postCount, 0);
  }
} 