// Main application TypeScript file
import { BlogManager } from './components/BlogManager.js';
import { ProjectManager } from './components/ProjectManager.js';
import { CategoryManager } from './components/CategoryManager.js';
import { TagManager } from './components/TagManager.js';
import { NavigationManager } from './components/NavigationManager.js';

// Types and Interfaces
interface AppConfig {
  currentPage: string;
  isInitialized: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  github?: string;
  demo?: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  date: string;
  readTime: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

// Main Application Class
class PersonalWebsiteApp {
  private config: AppConfig;
  private navigationManager: NavigationManager;
  private blogManager: BlogManager;
  private projectManager: ProjectManager;
  private categoryManager: CategoryManager;
  private tagManager: TagManager;

  constructor() {
    this.config = {
      currentPage: 'home',
      isInitialized: false
    };

    // Initialize managers
    this.navigationManager = new NavigationManager();
    this.blogManager = new BlogManager();
    this.projectManager = new ProjectManager();
    this.categoryManager = new CategoryManager();
    this.tagManager = new TagManager();
  }

  /**
   * Initialize the application
   */
  public async init(): Promise<void> {
    try {
      console.log('🚀 Initializing Personal Website App...');
      
      // Initialize all managers
      await this.navigationManager.init();
      await this.blogManager.init();
      await this.projectManager.init();
      await this.categoryManager.init();
      await this.tagManager.init();

      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Show initial page
      this.navigateToPage(this.getInitialPage());
      
      this.config.isInitialized = true;
      console.log('✅ Personal Website App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showErrorMessage('Failed to initialize the application. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for the application
   */
  private setupEventListeners(): void {
    // Navigation event listeners
    this.setupNavigationListeners();
    
    // Mobile menu toggle
    this.setupMobileMenuToggle();
    
    // Blog editor event listeners
    this.setupBlogEditorListeners();
    
    // Window resize listener
    window.addEventListener('resize', this.debounce(() => {
      this.handleWindowResize();
    }, 250));

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      const page = this.getPageFromHash();
      this.navigateToPage(page);
    });
  }

  /**
   * Set up navigation event listeners
   */
  private setupNavigationListeners(): void {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const page = (event.target as HTMLElement).getAttribute('data-page');
        if (page) {
          this.navigateToPage(page);
        }
      });
    });
  }

  /**
   * Set up mobile menu toggle functionality
   */
  private setupMobileMenuToggle(): void {
    const toggleBtn = document.querySelector('.nav__toggle') as HTMLButtonElement;
    const nav = document.querySelector('.nav') as HTMLElement;

    if (toggleBtn && nav) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        
        toggleBtn.setAttribute('aria-expanded', (!isOpen).toString());
        nav.classList.toggle('nav--open', !isOpen);
        
        // Close menu when clicking on nav links
        if (!isOpen) {
          const navLinks = nav.querySelectorAll('.nav__link');
          navLinks.forEach(link => {
            link.addEventListener('click', () => {
              toggleBtn.setAttribute('aria-expanded', 'false');
              nav.classList.remove('nav--open');
            }, { once: true });
          });
        }
      });

      // Close menu when clicking outside
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (!nav.contains(target) && !toggleBtn.contains(target)) {
          toggleBtn.setAttribute('aria-expanded', 'false');
          nav.classList.remove('nav--open');
        }
      });
    }
  }

  /**
   * Set up blog editor event listeners
   */
  private setupBlogEditorListeners(): void {
    const newPostBtn = document.getElementById('new-post-btn');
    if (newPostBtn) {
      newPostBtn.addEventListener('click', () => {
        this.blogManager.createNewPost();
      });
    }
  }

  /**
   * Navigate to a specific page
   */
  public navigateToPage(page: string): void {
    if (!this.isValidPage(page)) {
      console.warn(`Invalid page: ${page}. Redirecting to home.`);
      page = 'home';
    }

    // Update URL hash
    window.location.hash = page;

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('page--active'));

    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
      targetPage.classList.add('page--active');
    }

    // Update navigation active state
    this.updateNavigationActiveState(page);

    // Load page-specific content
    this.loadPageContent(page);

    // Update current page
    this.config.currentPage = page;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Update navigation active state
   */
  private updateNavigationActiveState(activePage: string): void {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      const page = link.getAttribute('data-page');
      link.classList.toggle('nav__link--active', page === activePage);
    });
  }

  /**
   * Load page-specific content
   */
  private async loadPageContent(page: string): Promise<void> {
    try {
      switch (page) {
        case 'home':
          await this.loadHomeContent();
          break;
        case 'blog':
          await this.loadBlogContent();
          break;
        case 'categories':
          await this.loadCategoriesContent();
          break;
        case 'tags':
          await this.loadTagsContent();
          break;
        case 'network':
          // Network page is static, no additional loading needed
          break;
        case 'about':
          // About page is static, no additional loading needed
          break;
        default:
          console.warn(`No content loader for page: ${page}`);
      }
    } catch (error) {
      console.error(`Failed to load content for page ${page}:`, error);
      this.showErrorMessage(`Failed to load ${page} content.`);
    }
  }

  /**
   * Load home page content
   */
  private async loadHomeContent(): Promise<void> {
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer && !projectsContainer.hasChildNodes()) {
      const projects = await this.projectManager.getProjects();
      this.projectManager.renderProjects(projects, projectsContainer);
    }
  }

  /**
   * Load blog page content
   */
  private async loadBlogContent(): Promise<void> {
    const blogContainer = document.getElementById('blog-posts-container');
    if (blogContainer) {
      const posts = await this.blogManager.getPosts();
      this.blogManager.renderPosts(posts, blogContainer);
    }
  }

  /**
   * Load categories page content
   */
  private async loadCategoriesContent(): Promise<void> {
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer) {
      const categories = await this.categoryManager.getCategories();
      this.categoryManager.renderCategories(categories, categoriesContainer);
    }
  }

  /**
   * Load tags page content
   */
  private async loadTagsContent(): Promise<void> {
    const tagsContainer = document.getElementById('tags-container');
    if (tagsContainer) {
      const tags = await this.tagManager.getTags();
      this.tagManager.renderTags(tags, tagsContainer);
    }
  }

  /**
   * Load initial application data
   */
  private async loadInitialData(): Promise<void> {
    try {
      // Load sample data (in a real app, this would come from an API or CMS)
      await this.loadSampleData();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  /**
   * Load sample data for development
   */
  private async loadSampleData(): Promise<void> {
    // Sample projects
    const sampleProjects: Project[] = [
      {
        id: '1',
        title: 'Network Security Dashboard',
        description: 'A comprehensive dashboard for monitoring network security metrics and threats in real-time.',
        technologies: ['TypeScript', 'React', 'D3.js', 'Node.js'],
        github: 'https://github.com/harrytien107/network-security-dashboard',
        demo: 'https://network-security-demo.netlify.app'
      },
      {
        id: '2',
        title: 'Automated Network Diagnostics Tool',
        description: 'Python-based tool for automated network diagnostics and performance analysis.',
        technologies: ['Python', 'Flask', 'SQLite', 'Chart.js'],
        github: 'https://github.com/harrytien107/network-diagnostics',
        demo: 'https://network-diagnostics-demo.herokuapp.com'
      },
      {
        id: '3',
        title: 'Cinematic Review Platform',
        description: 'A movie review platform with advanced filtering and recommendation features.',
        technologies: ['Vue.js', 'Express.js', 'MongoDB', 'TailwindCSS'],
        github: 'https://github.com/harrytien107/cinematic-reviews'
      }
    ];

    // Sample blog posts
    const samplePosts: BlogPost[] = [
      {
        id: '1',
        title: 'Understanding Modern Network Security Challenges',
        content: 'Network security landscape has evolved significantly...',
        excerpt: 'Exploring the latest challenges in network security and how to address them effectively.',
        tags: ['security', 'networking', 'cybersecurity'],
        categories: ['Network Security'],
        date: '2024-01-15',
        readTime: 8
      },
      {
        id: '2',
        title: 'Building Resilient Network Infrastructure',
        content: 'Creating robust network infrastructure requires...',
        excerpt: 'Best practices for designing and implementing resilient network infrastructure.',
        tags: ['infrastructure', 'networking', 'architecture'],
        categories: ['Network Engineering'],
        date: '2024-01-10',
        readTime: 12
      }
    ];

    // Sample categories
    const sampleCategories: Category[] = [
      {
        id: '1',
        name: 'Network Security',
        description: 'Articles about network security, threat analysis, and cybersecurity best practices.',
        icon: '🔒',
        postCount: 8
      },
      {
        id: '2',
        name: 'Network Engineering',
        description: 'Technical posts about network design, protocols, and infrastructure.',
        icon: '🌐',
        postCount: 12
      },
      {
        id: '3',
        name: 'Cinema & Reviews',
        description: 'Movie reviews, cinema analysis, and entertainment thoughts.',
        icon: '🎬',
        postCount: 5
      }
    ];

    // Sample tags
    const sampleTags: Tag[] = [
      { id: '1', name: 'networking', count: 15 },
      { id: '2', name: 'security', count: 10 },
      { id: '3', name: 'typescript', count: 8 },
      { id: '4', name: 'python', count: 6 },
      { id: '5', name: 'cybersecurity', count: 12 },
      { id: '6', name: 'infrastructure', count: 9 },
      { id: '7', name: 'cinema', count: 5 }
    ];

    // Store sample data
    this.projectManager.setProjects(sampleProjects);
    this.blogManager.setPosts(samplePosts);
    this.categoryManager.setCategories(sampleCategories);
    this.tagManager.setTags(sampleTags);
  }

  /**
   * Handle window resize events
   */
  private handleWindowResize(): void {
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 768) {
      const toggleBtn = document.querySelector('.nav__toggle') as HTMLButtonElement;
      const nav = document.querySelector('.nav') as HTMLElement;
      
      if (toggleBtn && nav) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('nav--open');
      }
    }
  }

  /**
   * Get initial page from URL hash or default to home
   */
  private getInitialPage(): string {
    const hash = window.location.hash.substring(1);
    return this.isValidPage(hash) ? hash : 'home';
  }

  /**
   * Get current page from URL hash
   */
  private getPageFromHash(): string {
    const hash = window.location.hash.substring(1);
    return this.isValidPage(hash) ? hash : 'home';
  }

  /**
   * Check if a page name is valid
   */
  private isValidPage(page: string): boolean {
    const validPages = ['home', 'blog', 'categories', 'tags', 'network', 'about'];
    return validPages.includes(page);
  }

  /**
   * Show error message to user
   */
  private showErrorMessage(message: string): void {
    // Create and show a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert--error';
    errorDiv.innerHTML = `
      <span class="alert__icon">⚠️</span>
      ${message}
    `;
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Debounce utility function
   */
  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number;
    return (...args: Parameters<T>): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Get current application configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Check if application is initialized
   */
  public isInitialized(): boolean {
    return this.config.isInitialized;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new PersonalWebsiteApp();
  await app.init();
  
  // Make app globally available for debugging
  (window as any).personalWebsiteApp = app;
});

// Export for module usage
export { PersonalWebsiteApp };
export type { AppConfig, Project, BlogPost, Category, Tag }; 