// Navigation Manager Component
export class NavigationManager {
  private currentPage: string = 'home';
  private navigationHistory: string[] = [];
  private validPages: string[] = ['home', 'blog', 'categories', 'tags', 'network', 'about'];

  constructor() {
    // Initialize navigation manager
  }

  /**
   * Initialize the navigation manager
   */
  public async init(): Promise<void> {
    console.log('🧭 Initializing Navigation Manager...');
    
    // Setup navigation event listeners
    this.setupNavigationListeners();
    
    // Setup browser history handling
    this.setupHistoryHandling();
    
    // Initialize current page from URL
    this.currentPage = this.getCurrentPageFromURL();
  }

  /**
   * Setup navigation event listeners
   */
  private setupNavigationListeners(): void {
    // Handle navigation link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const navLink = target.closest('[data-page]') as HTMLElement;
      
      if (navLink) {
        event.preventDefault();
        const page = navLink.getAttribute('data-page');
        if (page && this.isValidPage(page)) {
          this.navigateTo(page);
        }
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (event) => {
      // Handle keyboard shortcuts for navigation
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.navigateTo('home');
            break;
          case '2':
            event.preventDefault();
            this.navigateTo('blog');
            break;
          case '3':
            event.preventDefault();
            this.navigateTo('categories');
            break;
          case '4':
            event.preventDefault();
            this.navigateTo('tags');
            break;
          case '5':
            event.preventDefault();
            this.navigateTo('network');
            break;
          case '6':
            event.preventDefault();
            this.navigateTo('about');
            break;
        }
      }
    });
  }

  /**
   * Setup browser history handling
   */
  private setupHistoryHandling(): void {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      const page = this.getCurrentPageFromURL();
      this.showPage(page, false); // Don't push to history on popstate
    });

    // Update title based on current page
    this.updatePageTitle();
  }

  /**
   * Navigate to a specific page
   */
  public navigateTo(page: string, pushToHistory: boolean = true): void {
    if (!this.isValidPage(page)) {
      console.warn(`Invalid page: ${page}`);
      return;
    }

    // Add current page to history before navigating
    if (pushToHistory && this.currentPage !== page) {
      this.navigationHistory.push(this.currentPage);
      
      // Limit history size
      if (this.navigationHistory.length > 50) {
        this.navigationHistory.shift();
      }
    }

    this.showPage(page, pushToHistory);
  }

  /**
   * Show a specific page
   */
  private showPage(page: string, pushToHistory: boolean = true): void {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      p.classList.remove('page--active');
      p.setAttribute('aria-hidden', 'true');
    });

    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
      targetPage.classList.add('page--active');
      targetPage.setAttribute('aria-hidden', 'false');
    }

    // Update navigation active state
    this.updateNavigationActiveState(page);

    // Update URL and history
    if (pushToHistory) {
      this.updateURL(page);
    }

    // Update current page
    this.currentPage = page;

    // Update page title
    this.updatePageTitle();

    // Announce page change to screen readers
    this.announcePageChange(page);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Focus management for accessibility
    this.manageFocus(page);

    // Trigger page change event
    this.dispatchPageChangeEvent(page);
  }

  /**
   * Update navigation active state
   */
  private updateNavigationActiveState(activePage: string): void {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      const page = link.getAttribute('data-page');
      const isActive = page === activePage;
      
      link.classList.toggle('nav__link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /**
   * Update browser URL
   */
  private updateURL(page: string): void {
    const url = page === 'home' ? '/' : `/#${page}`;
    window.history.pushState({ page }, '', url);
  }

  /**
   * Update page title
   */
  private updatePageTitle(): void {
    const pageTitle = this.getPageTitle(this.currentPage);
    document.title = `${pageTitle} - HarryTien`;
  }

  /**
   * Get title for a specific page
   */
  private getPageTitle(page: string): string {
    const titles: Record<string, string> = {
      home: 'Home',
      blog: 'Blog',
      categories: 'Categories',
      tags: 'Tags',
      network: 'Network',
      about: 'About'
    };

    return titles[page] || 'Page';
  }

  /**
   * Announce page change to screen readers
   */
  private announcePageChange(page: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${this.getPageTitle(page)} page`;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Manage focus for accessibility
   */
  private manageFocus(page: string): void {
    // Focus the main heading of the page for screen readers
    const pageElement = document.getElementById(page);
    if (pageElement) {
      const heading = pageElement.querySelector('h1, .page-header__title');
      if (heading && 'focus' in heading) {
        // Add tabindex to make it focusable
        (heading as HTMLElement).setAttribute('tabindex', '-1');
        (heading as HTMLElement).focus();
        
        // Remove tabindex after focus
        setTimeout(() => {
          (heading as HTMLElement).removeAttribute('tabindex');
        }, 100);
      }
    }
  }

  /**
   * Dispatch page change event
   */
  private dispatchPageChangeEvent(page: string): void {
    const event = new CustomEvent('pagechange', {
      detail: {
        page,
        previousPage: this.navigationHistory[this.navigationHistory.length - 1] || 'home'
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Get current page from URL
   */
  private getCurrentPageFromURL(): string {
    const hash = window.location.hash.substring(1);
    return this.isValidPage(hash) ? hash : 'home';
  }

  /**
   * Check if a page is valid
   */
  private isValidPage(page: string): boolean {
    return this.validPages.includes(page);
  }

  /**
   * Go back to previous page
   */
  public goBack(): void {
    if (this.navigationHistory.length > 0) {
      const previousPage = this.navigationHistory.pop();
      if (previousPage) {
        this.showPage(previousPage, true);
      }
    } else {
      // If no history, go to home
      this.navigateTo('home');
    }
  }

  /**
   * Get current page
   */
  public getCurrentPage(): string {
    return this.currentPage;
  }

  /**
   * Get navigation history
   */
  public getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  public clearHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Check if can go back
   */
  public canGoBack(): boolean {
    return this.navigationHistory.length > 0;
  }

  /**
   * Get breadcrumb for current page
   */
  public getBreadcrumb(): Array<{ name: string; page: string }> {
    const breadcrumb = [{ name: 'Home', page: 'home' }];
    
    if (this.currentPage !== 'home') {
      breadcrumb.push({
        name: this.getPageTitle(this.currentPage),
        page: this.currentPage
      });
    }
    
    return breadcrumb;
  }

  /**
   * Setup keyboard shortcuts help
   */
  public showKeyboardShortcuts(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal__header">
          <h2 class="modal__title">Keyboard Shortcuts</h2>
          <button class="modal__close" aria-label="Close shortcuts">&times;</button>
        </div>
        <div class="modal__body">
          <div style="display: grid; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>Home</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+1</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>Blog</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+2</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>Categories</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+3</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>Tags</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+4</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>Network</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+5</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 4px; background-color: var(--color-background-alt);">
              <span>About</span>
              <kbd style="padding: 0.25rem 0.5rem; background: var(--color-text); color: var(--color-background); border-radius: 4px; font-size: 0.875rem;">Ctrl+6</kbd>
            </div>
          </div>
          <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-light);">
            Use Cmd instead of Ctrl on Mac
          </p>
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
    }, 10);
  }

  /**
   * Add help shortcut (Ctrl+?)
   */
  public setupHelpShortcut(): void {
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault();
        this.showKeyboardShortcuts();
      }
    });
  }

  /**
   * Get page statistics
   */
  public getPageStats(): Record<string, number> {
    const stats: Record<string, number> = { total: 0 };
    
    this.validPages.forEach(page => {
      stats[page] = this.navigationHistory.filter(p => p === page).length;
      stats.total += stats[page];
    });
    
    return stats;
  }
} 