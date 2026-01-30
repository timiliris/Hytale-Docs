---
id: contributing
title: Contributing to the Wiki
sidebar_label: Contributing
sidebar_position: 1
description: How to contribute to the Hytale Developer Wiki
---

# Contributing to the Wiki

Thank you for your interest in contributing to the Hytale Developer Wiki! This is a community-driven project and we welcome contributions of all kinds.

## Ways to Contribute

### 1. Fix Errors or Typos

Found a mistake? Submit a quick fix:

1. Click "Edit this page" at the bottom of any doc
2. Make your correction on GitHub
3. Submit a Pull Request

### 2. Add New Content

Have knowledge to share? Write new documentation:

1. Fork the repository
2. Create your content following our guidelines
3. Submit a Pull Request

### 3. Translate

Help make the wiki accessible in more languages:

- French (FR)
- Spanish (ES)
- German (DE)

### 4. Report Issues

Found a problem but can't fix it yourself?

[Open an Issue on GitHub](https://github.com/hytale-community/hytale-wiki/issues)

## Getting Started

### Prerequisites

- Node.js 20+
- Git
- Basic Markdown knowledge

### Local Development

```bash
# Clone the repository
git clone https://github.com/hytale-community/hytale-wiki.git
cd hytale-wiki

# Install dependencies
npm install

# Start development server
npm start
```

The site will be available at `http://localhost:3000`

## Content Guidelines

### Writing Style

- **Voice**: Active voice, second person ("you")
- **Tone**: Professional but approachable
- **Language**: Clear and concise

### Document Structure

Every document should include:

```markdown
---
id: unique-id
title: Document Title
sidebar_label: Short Label
description: Brief description for SEO
---

# Document Title

Introduction paragraph explaining the topic.

## Main Sections

Content organized with clear headings.

## Code Examples

Include practical examples where relevant.

## Next Steps

Link to related documentation.
```

### Code Examples

Always include context with code:

````markdown
```java title="MyPlugin.java"
public class MyPlugin extends Plugin {
    // Your code here
}
```
````

### Images

- Format: PNG or WebP
- Max width: 1200px
- Location: `/static/img/docs/`
- Naming: `section-description.png`

## Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b docs/my-improvement
   ```

2. **Make your changes**
   - Follow the style guidelines
   - Test locally with `npm start`

3. **Commit with clear messages**
   ```bash
   git commit -m "docs: add guide for custom blocks"
   ```

4. **Push and create PR**
   ```bash
   git push origin docs/my-improvement
   ```

5. **Wait for review**
   - A maintainer will review your PR
   - Address any feedback

### Commit Message Format

```
type: description

Types:
- docs: Documentation changes
- fix: Bug fixes
- feat: New features
- style: Formatting changes
```

## File Organization

```
docs/
├── getting-started/
├── modding/
│   ├── data-assets/
│   ├── plugins/
│   └── art-assets/
├── servers/
├── api/
├── tools/
├── guides/
└── community/
```

## Translation Guidelines

### Starting a Translation

1. Copy the English file to the appropriate i18n folder
2. Translate the content
3. Keep the frontmatter `id` unchanged
4. Submit a PR

### What to Translate

- All prose text
- Code comments (optionally)

### What NOT to Translate

- Code blocks
- Technical terms
- URLs and file paths
- Frontmatter IDs

## Recognition

Contributors are recognized in:

- The [Contributors page](https://github.com/hytale-community/hytale-wiki/graphs/contributors)
- Release notes when significant

## Code of Conduct

Please read our [Code of Conduct](/docs/community/code-of-conduct) before contributing.

## Questions?

- Join our [Discord](https://discord.gg/hytale)
- Ask in [GitHub Discussions](https://github.com/hytale-community/hytale-wiki/discussions)

---

Thank you for helping make the Hytale Developer Wiki better!
