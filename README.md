# HytaleDocs

Community documentation and wiki for [Hytale](https://hytale.com), the upcoming game from Hypixel Studios.

**Live site:** [hytale-docs.com](https://hytale-docs.com)

## Features

- **Multilingual** - Full support for English, French and Spanish 
- **Documentation** - Comprehensive guides for gameplay, modding, servers, and API
- **Interactive Tools** - Server calculator, project generator, JSON validator
- **Dark/Light Mode** - Theme support with system preference detection
- **SEO Optimized** - Sitemap, structured data, meta tags
- **Responsive** - Mobile-friendly design

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [MDX](https://mdxjs.com/) - Documentation content

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/timiliris/Hytale-Docs.git
cd Hytale-Docs

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                  # Next.js app router
│   ├── [locale]/         # Localized pages
│   │   ├── docs/         # Documentation pages
│   │   ├── tools/        # Interactive tools
│   │   ├── privacy/      # Privacy policy
│   │   └── terms/        # Terms of use
│   ├── sitemap.ts        # Dynamic sitemap
│   └── robots.ts         # Robots.txt
├── components/           # React components
│   ├── homepage/         # Homepage sections
│   ├── layout/           # Navbar, footer, sidebar
│   ├── mdx/              # MDX components
│   ├── seo/              # JSON-LD structured data
│   └── ui/               # shadcn/ui components
├── content/              # MDX documentation files
│   └── docs/
│       ├── en/           # English docs
│       └── es/           # Spanish docs
│       └── fr/           # French docs
├── i18n/                 # Internationalization config
├── lib/                  # Utilities
└── messages/             # Translation files
    ├── en.json
    ├── es.json
    └── fr.json
```

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding Documentation

Documentation is written in MDX format. Add new files to `content/docs/[locale]/`.

## License

This project uses a **dual-license** approach:

| Component | License | Summary |
|-----------|---------|---------|
| **Source Code** | [Elastic License 2.0](LICENSE) | View, fork, contribute. No hosted competing service. |
| **Documentation** | [CC BY-NC-SA 4.0](LICENSE) | Share & adapt with attribution. Non-commercial. |
| **Trademarks** | All Rights Reserved | "HytaleDocs" name and logo protected. |

**You CAN:**
- View and study the source code
- Fork the project to contribute improvements
- Use the documentation for personal/educational purposes

**You CANNOT:**
- Host a competing service using this codebase
- Use the code or content for commercial purposes
- Use the HytaleDocs name/branding without permission

See the full [LICENSE](LICENSE) file for details.

## Disclaimer

HytaleDocs is a community project and is **not affiliated with, endorsed by, or connected to Hypixel Studios or Riot Games**. Hytale is a trademark of Hypixel Studios.

---

Made with love by the Hytale community