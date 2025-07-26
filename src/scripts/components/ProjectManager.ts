// Project Manager Component
export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  github?: string;
  demo?: string;
}

export class ProjectManager {
  private projects: Project[] = [];

  constructor() {
    // Initialize project manager
  }

  /**
   * Initialize the project manager
   */
  public async init(): Promise<void> {
    console.log('💼 Initializing Project Manager...');
    // Setup project-specific functionality
  }

  /**
   * Get all projects
   */
  public async getProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  /**
   * Set projects
   */
  public setProjects(projects: Project[]): void {
    this.projects = [...projects];
  }

  /**
   * Add a new project
   */
  public addProject(project: Project): void {
    this.projects.push(project);
  }

  /**
   * Update an existing project
   */
  public updateProject(id: string, updatedProject: Partial<Project>): void {
    const index = this.projects.findIndex(project => project.id === id);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], ...updatedProject };
    }
  }

  /**
   * Delete a project
   */
  public deleteProject(id: string): void {
    this.projects = this.projects.filter(project => project.id !== id);
  }

  /**
   * Render projects to a container
   */
  public renderProjects(projects: Project[], container: HTMLElement): void {
    container.innerHTML = '';

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4xl col-span-full">
          <h3 class="text-xl text-muted mb-base">No projects yet</h3>
          <p class="text-light">Projects will be displayed here when available.</p>
        </div>
      `;
      return;
    }

    projects.forEach(project => {
      const projectElement = this.createProjectElement(project);
      container.appendChild(projectElement);
    });
  }

  /**
   * Create a project element
   */
  private createProjectElement(project: Project): HTMLElement {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project-card';
    
    projectDiv.innerHTML = `
      ${project.image ? 
        `<div class="project-card__image" style="background-image: url('${project.image}')"></div>` :
        `<div class="project-card__image"></div>`
      }
      <div class="project-card__content">
        <h3 class="project-card__title">${project.title}</h3>
        <p class="project-card__description">${project.description}</p>
        <div class="project-card__tech">
          ${project.technologies.map(tech => 
            `<span class="project-card__tech-item">${tech}</span>`
          ).join('')}
        </div>
        <div class="project-card__links">
          ${project.github ? 
            `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="project-card__link">
              GitHub
            </a>` : 
            ''
          }
          ${project.demo ? 
            `<a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="project-card__link">
              Live Demo
            </a>` : 
            ''
          }
          ${!project.github && !project.demo ? 
            `<span class="project-card__link" style="opacity: 0.5;">Coming Soon</span>` : 
            ''
          }
        </div>
      </div>
    `;

    // Add hover effects and interactions
    this.addProjectEventListeners(projectDiv, project);

    return projectDiv;
  }

  /**
   * Add event listeners to a project element
   */
  private addProjectEventListeners(element: HTMLElement, project: Project): void {
    // Add click handler for project card (optional detail view)
    element.addEventListener('click', (e) => {
      // Don't trigger if clicking on links
      if ((e.target as HTMLElement).tagName === 'A') {
        return;
      }
      
      // Optional: Show project details modal
      this.showProjectDetails(project);
    });

    // Add keyboard navigation
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.showProjectDetails(project);
      }
    });
  }

  /**
   * Show project details in a modal (optional feature)
   */
  private showProjectDetails(project: Project): void {
    // Create modal for project details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal__header">
          <h2 class="modal__title">${project.title}</h2>
          <button class="modal__close" aria-label="Close project details">&times;</button>
        </div>
        <div class="modal__body">
          ${project.image ? 
            `<img src="${project.image}" alt="${project.title}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">` :
            ''
          }
          <p style="margin-bottom: 1rem; line-height: 1.6;">${project.description}</p>
          
          <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 600;">Technologies Used:</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
            ${project.technologies.map(tech => 
              `<span class="tag tag--primary">${tech}</span>`
            ).join('')}
          </div>
          
          <div style="display: flex; gap: 1rem;">
            ${project.github ? 
              `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn btn--primary">
                View on GitHub
              </a>` : 
              ''
            }
            ${project.demo ? 
              `<a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary">
                Live Demo
              </a>` : 
              ''
            }
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('.modal__close');
    const closeModal = () => {
      modal.classList.remove('modal-overlay--open');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 250);
    };

    closeBtn?.addEventListener('click', closeModal);
    
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
   * Filter projects by technology
   */
  public filterByTechnology(technology: string): Project[] {
    return this.projects.filter(project => 
      project.technologies.some(tech => 
        tech.toLowerCase().includes(technology.toLowerCase())
      )
    );
  }

  /**
   * Search projects by title or description
   */
  public searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase();
    return this.projects.filter(project => 
      project.title.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all unique technologies from projects
   */
  public getAllTechnologies(): string[] {
    const technologies = new Set<string>();
    this.projects.forEach(project => {
      project.technologies.forEach(tech => technologies.add(tech));
    });
    return Array.from(technologies).sort();
  }

  /**
   * Get featured projects (first 3 projects for home page)
   */
  public getFeaturedProjects(): Project[] {
    return this.projects.slice(0, 3);
  }
} 