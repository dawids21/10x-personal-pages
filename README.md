# Personal Pages test

A web application that helps students and freelancers establish a professional online presence without requiring
technical expertise. Create beautiful personal pages and project portfolios by simply importing YAML documents—no
coding, hosting setup, or domain registration needed.

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, efficient static site generation with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive components where needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com/)** - Comprehensive backend solution
    - PostgreSQL database
    - Built-in authentication
    - Backend-as-a-Service SDK
    - Open source and self-hostable

### Testing

- **[Vitest](https://vitest.dev/)** - Unit and integration testing
- **[Playwright](https://playwright.dev/)** - End-to-end browser testing

### CI/CD & Hosting

- **Cloudflare Pages** - Hosting with SSR via Pages Functions/Workers
- **GitHub Actions** - Optional CI for tests/lint; Cloudflare Pages handles builds and preview deployments

## Getting Started

### Prerequisites

- Node.js `22.14.0` (as specified in `.nvmrc`)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/dawids21/10x-personal-pages.git
cd 10x-personal-pages
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create a .env file with your Supabase credentials
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

| Script             | Description                              |
|--------------------|------------------------------------------|
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Build production-ready application       |
| `npm run preview`  | Preview production build locally         |
| `npm run astro`    | Run Astro CLI commands                   |
| `npm run lint`     | Check code for linting errors            |
| `npm run lint:fix` | Automatically fix linting errors         |
| `npm run format`   | Format code with Prettier                |

## Deployment: Cloudflare Pages

This project is hosted on Cloudflare Pages.

- Connect your GitHub repository to Cloudflare Pages (Framework preset: Astro)
- Configure environment variables in Pages project Settings ➜ Variables:
  - SUPABASE_URL
  - SUPABASE_KEY
- Build command: `npm run build`
- Output directory: `dist`
- Preview deployments: enabled automatically for pull requests

Optional: Keep GitHub Actions for tests and lint; Pages will build and deploy on push.

## Project Scope

### MVP Features (In Scope)

**Authentication & Account Management**

- Email/password registration and login via Supabase Auth
- Account deletion with immediate data removal

**Page Creation & Management**

- YAML-based main page configuration (name, bio, skills, experience, education, contact)
- YAML-based project subpage creation (name, description, tech stack, links, dates)
- Template downloads for both main and project pages
- Real-time YAML validation with clear error messages
- Immediate publishing (no preview mode)

**Customization**

- Two pre-designed themes
- Custom URL selection (3-30 characters, alphanumeric + hyphens)
- Project ordering through UI

**Public Access**

- Publicly accessible pages without authentication
- Project subpages with generated URLs

## Project Status

**Current Phase**: MVP Development

## License

MIT

---

**Questions or Issues?** Please open an issue on GitHub or refer to the project documentation in the `docs/` directory.
