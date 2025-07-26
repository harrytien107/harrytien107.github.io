# HarryTien - Personal Website

A Jekyll-powered personal website hosted on GitHub Pages featuring a blog, projects showcase, and more.

## 🚀 Features

- **Jekyll-powered** - Native markdown support for blog posts
- **Responsive Design** - Beautiful, modern UI with mobile-first approach
- **Blog System** - Automatic post listing with tags and categories
- **SEO Optimized** - Built-in SEO tags and sitemap
- **GitHub Pages Compatible** - Automated deployment with GitHub Actions

## 📁 Project Structure

```
├── _config.yml          # Jekyll configuration
├── _layouts/            # Page layouts
│   ├── default.html     # Main site layout
│   └── post.html        # Blog post layout
├── _includes/           # Reusable components
│   ├── header.html      # Site header with navigation
│   └── footer.html      # Site footer
├── _pages/              # Site pages
│   ├── blog.html        # Blog listing page
│   ├── about.html       # About page
│   ├── categories.html  # Categories page
│   ├── tags.html        # Tags page
│   └── network.html     # Network projects page
├── _posts/              # Blog posts (markdown)
├── _sass/               # Sass stylesheets
├── assets/              # Static assets
│   └── css/
│       └── main.scss    # Main stylesheet
├── src/                 # Source files (images, etc.)
└── public/              # Public assets (favicon, etc.)
```

## 🛠️ Development

### Prerequisites

- Ruby (3.1 or higher)
- Bundler gem
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harrytien107/harrytien107.github.io.git
   cd harrytien107.github.io
   ```

2. **Install dependencies:**
   ```bash
   bundle install
   ```

3. **Serve the site locally:**
   ```bash
   bundle exec jekyll serve
   ```

4. **Open in browser:**
   Visit `http://localhost:4000`

### Creating New Blog Posts

1. Create a new markdown file in `_posts/` directory
2. Use the naming convention: `YYYY-MM-DD-title.md`
3. Add front matter:
   ```yaml
   ---
   layout: post
   title: Your Post Title
   description: Brief description of your post
   date: YYYY-MM-DD
   readTime: X min read
   tags: [tag1, tag2, tag3]
   ---
   ```

## 🌐 Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch. The deployment is handled by GitHub Actions with Jekyll build process.

### Manual Deployment

If you need to deploy manually:

1. **Build the site:**
   ```bash
   bundle exec jekyll build
   ```

2. **The built site will be in `_site/` directory**

## 📝 Content Management

### Adding Projects

Edit the `index.html` file to update the projects section with your latest work.

### Updating Navigation

Modify the navigation in `_config.yml`:

```yaml
navigation:
  - title: Home
    url: /
  - title: Blog
    url: /blog/
  # Add more navigation items
```

### Social Links

Update social media links in `_config.yml`:

```yaml
social:
  github: your-username
  spotify: your-spotify-url
  # Add more social links
```

## 🎨 Customization

### Styles

All styles are organized in the `_sass/` directory:
- `base.css` - Base styles and CSS variables
- `layout.css` - Layout and grid styles
- `components.css` - Component-specific styles
- `utilities.css` - Utility classes

### Colors and Themes

Customize the color scheme by editing CSS custom properties in `_sass/base.css`.

## 📦 Built With

- [Jekyll](https://jekyllrb.com/) - Static site generator
- [GitHub Pages](https://pages.github.com/) - Hosting
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- HTML5, CSS3, JavaScript - Frontend technologies

## 📧 Contact

- **GitHub:** [@harrytien107](https://github.com/harrytien107)
- **Website:** [harrytien107.github.io](https://harrytien107.github.io)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Jekyll and GitHub Pages 