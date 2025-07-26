# HarryTien Personal Website

A modern, responsive personal website built with HTML, CSS, and TypeScript. Features a clean design with sections for blog posts, project showcase, categories, tags, network resources, and personal information.

## 🌟 Features

- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Single Page Application**: Smooth navigation without page reloads
- **Blog System**: Notion-like editor with markdown support
- **Project Showcase**: Display your projects with technologies and links
- **Category & Tag System**: Organize content with filtering capabilities
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Dark Mode**: Automatic system preference detection
- **TypeScript**: Strongly typed for better development experience

## 📁 Project Structure

```
harrytien107.github.io/
├── .github/
│   └── workflows/
│       └── main.yml        # GitHub Actions deployment workflow
├── index.html              # Main HTML file
├── public/
│   └── favicon.ico         # Site favicon
├── src/
│   ├── styles/
│   │   ├── base.css        # Reset, typography, base styles
│   │   ├── layout.css      # Layout and grid systems
│   │   ├── components.css  # Component-specific styles
│   │   └── utilities.css   # Utility classes
│   ├── scripts/
│   │   ├── main.ts         # Main application logic
│   │   └── components/     # Reusable TypeScript modules
│   └── assets/
│       └── images/         # Optimized images
├── .lighthouserc.json      # Lighthouse CI configuration
├── package.json            # Node.js project configuration
├── package-lock.json       # NPM dependency lock file
├── tsconfig.json           # TypeScript configuration
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- A web server for development (optional, can run from file system)

### Setup Instructions

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/harrytien107/harrytien107.github.io.git
   cd harrytien107.github.io
   ```

2. **Add your profile image**
   - Replace `src/assets/images/profile.jpg` with your actual profile picture
   - Recommended size: 300x300 pixels (square)
   - Supported formats: JPG, PNG, WebP

3. **Add your favicon**
   - Replace `public/favicon.ico` with your site favicon
   - Recommended sizes: 16x16, 32x32, 48x48 pixels

4. **Customize content**
   - Update personal information in the HTML
   - Modify social media links in the About section
   - Add your actual GitHub username and project links

5. **Serve the website**
   
   **Option A: Using npm scripts (Recommended)**
   ```bash
   npm run serve
   # or
   npm run dev
   ```
   
   **Option B: Simple HTTP Server (Python)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option C: Live Server (VS Code Extension)**
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"
   
   **Option D: Other options**
   - Use any local web server like XAMPP, MAMP, or serve
   - Or simply open `index.html` in your browser

6. **Visit your website**
   - Open `http://localhost:8000` in your browser
   - Navigate through different sections using the navigation menu

## 🎨 Customization

### Colors and Theming

The website uses CSS custom properties for easy theming. Update the values in `src/styles/base.css`:

```css
:root {
  --color-primary: #3b82f6;        /* Primary brand color */
  --color-secondary: #64748b;      /* Secondary color */
  --color-accent: #f59e0b;         /* Accent color */
  /* ... other color variables */
}
```

### Content Management

1. **Projects**: Edit the sample projects in `src/scripts/main.ts` in the `loadSampleData()` method
2. **Blog Posts**: Use the built-in blog editor or modify the sample posts
3. **Categories & Tags**: Update the sample data to match your content
4. **Social Links**: Update the href attributes in the About section

### Styling

- **Base styles**: `src/styles/base.css` - Typography, colors, CSS reset
- **Layout**: `src/styles/layout.css` - Grid systems, page layouts
- **Components**: `src/styles/components.css` - Buttons, cards, modals
- **Utilities**: `src/styles/utilities.css` - Spacing, colors, responsive utilities

## 🎯 Usage Guide

### Navigation

- **Desktop**: Click navigation links or use keyboard shortcuts (Ctrl+1-6)
- **Mobile**: Use the hamburger menu button
- **Keyboard**: Tab navigation and Enter/Space to activate
- **Screen readers**: Full ARIA labels and semantic markup

### Blog Editor

1. Click "New Post" on the Blog page
2. Use the Notion-like editor interface
3. Add title, categories, tags, and content
4. Use toolbar for basic formatting (bold, italic, headings, links)
5. Save or publish your post

### Content Management

- **Projects**: Click on project cards for detailed view
- **Categories**: Browse posts by category with dedicated views  
- **Tags**: Tag cloud interface with post filtering
- **Search**: Built-in search functionality for content discovery

## 🔧 Development

### TypeScript Development

The project uses TypeScript for better code quality and development experience:

```bash
# Install dependencies (if you want to use TypeScript tools)
npm install

# Type check your TypeScript files
npm run type-check

# Watch mode for automatic type checking
npx tsc --noEmit --watch

# Install TypeScript globally (optional)
npm install -g typescript
```

### Component Architecture

The application uses a modular component system:

- **BlogManager**: Handles blog posts and editor functionality
- **ProjectManager**: Manages project display and interactions
- **CategoryManager**: Handles content categorization
- **TagManager**: Manages tagging system
- **NavigationManager**: Controls page routing and navigation

### Adding New Features

1. Create new component files in `src/scripts/components/`
2. Import and initialize in `src/scripts/main.ts`
3. Add corresponding styles in the appropriate CSS files
4. Update HTML structure if needed

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## ♿ Accessibility Features

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance
- Reduced motion support

## 🚀 Deployment

### Automated GitHub Pages Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys your site to GitHub Pages when you push to the main branch.

**Setup Steps:**
1. Push your code to a GitHub repository
2. Go to repository **Settings** → **Pages**
3. Under **Source**, select **"GitHub Actions"**
4. The workflow will automatically trigger on your next push to `main`
5. Your site will be available at `https://username.github.io/repository-name`

**Workflow Features:**
- ✅ Automatic deployment on push to main branch
- ✅ TypeScript type checking
- ✅ File optimization and preparation
- ✅ Lighthouse CI performance monitoring
- ✅ Manual deployment trigger option

**Manual GitHub Pages Setup (Alternative)**

If you prefer manual deployment:
1. Go to repository Settings → Pages
2. Select source branch (usually `main`)
3. Choose root folder or `/docs` folder
4. Your site will be available at `https://username.github.io/repository-name`

**Monitoring Your Deployment:**
- Check the "Actions" tab in your GitHub repository to see deployment status
- View Lighthouse performance reports in the workflow artifacts
- Any deployment errors will be shown in the Actions log

**Troubleshooting:**
- Ensure your repository is public or you have GitHub Pages enabled for private repos
- Check that the `main` branch contains all your files including `index.html` at the root level
- Verify the workflow has the necessary permissions (should be automatic)
- Look at the Actions tab for detailed error logs if deployment fails
- If you see README.md instead of your website, ensure `index.html` is at the root level

### Other Hosting Platforms

- **Netlify**: Drag and drop the `public` folder
- **Vercel**: Connect your GitHub repository
- **Surge.sh**: Use the Surge CLI tool
- **Firebase Hosting**: Use Firebase CLI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by modern web design principles
- Built with accessibility and performance in mind
- Thanks to the web development community for best practices

## 📞 Support

If you have questions or need help:

1. Check the documentation above
2. Look at the code comments for implementation details
3. Create an issue in the GitHub repository
4. Reach out via the contact information in the About section

---

**Happy coding!** 🎉 