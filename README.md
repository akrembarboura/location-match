# Location Match 🏖️🇹🇳

**Location Match** is a modern, specialized property rental platform focused on the coastal city of Mahdia, Tunisia. It connects property owners with both vacationers seeking summer getaways and university students looking for reliable housing.

## 🎯 Business Overview

The platform addresses a dual-market need in Mahdia:
- **Summer Vacationers**: Discover villas, apartments, and houses near the sea with transparent pricing in Tunisian Dinars (TND) and authentic photos.
- **Student Housing**: A dedicated section for university students to find affordable, practical long-term housing during the academic year.
- **Property Owners**: A streamlined portal for landlords ("Propriétaires") to list and manage their properties easily.

## 💻 Tech Stack

Built with cutting-edge web technologies for maximum performance, SEO, and developer experience:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (shadcn/ui architecture) & [Framer Motion](https://www.framer.com/motion/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for validation
- **Data Fetching & State**: [TanStack React Query](https://tanstack.com/query/latest)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons & Assets**: [Lucide React](https://lucide.dev/) & [Embla Carousel](https://www.embla-carousel.com/)

## 🚀 Key Features

- **Categorized Search**: Filter by property type (Villas, Studios, Beachfront, Student Housing).
- **Internationalization (i18n)**: Fully localized in French (`fr.ts`) to serve the local and diaspora market.
- **Dedicated Dashboards**: Separate routing and UI for admins, owners, and standard users.
- **Responsive Design**: Mobile-first approach ensuring a seamless booking experience on any device.

## 🛠️ Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `/app`: Next.js App Router pages and layouts (e.g., `/admin`, `/owner`, `/student`, `/houses`).
- `/src/components`: Reusable UI components, layout shells, and interactive elements.
- `/src/lib`: Utility functions, API queries, types, and i18n dictionaries.
- `/src/hooks`: Custom React hooks for business logic.
- `/src/assets`: Static images and design assets.

## 📝 License

This project is proprietary and confidential.
