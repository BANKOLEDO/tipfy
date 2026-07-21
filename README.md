# tipfy — Frontend

Digital tipping platform frontend built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** (dev server & build)
- **Tailwind CSS v4** (theme tokens, utility classes)
- **Framer Motion** (page transitions, micro-interactions)
- **Zustand** (state management)
- **React Router v7** (client-side routing)
- **Lucide React** (icons)
- **qrcode.react** (QR code generation & download)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── landing/      # Landing page sections
│   │   └── ui/           # Reusable UI primitives (Button, Input, Card, etc.)
│   ├── config/           # App constants
│   ├── layouts/          # Dashboard layout with sidebar & mobile bottom tabs
│   ├── lib/              # API client, stores, utilities
│   └── pages/
│       ├── dashboard/    # Dashboard, Tips, Withdraw, Team, Settings
│       └──               # Landing, Auth, Tip flow, Blog, Legal pages
```

## Features

- Floating nav with glassmorphism
- 3D SVG illustrations (Wallet, TipJar, CoinStack, MoneyBag)
- Public tip page with Monnify payment redirect
- QR code generation with branded PNG download
- Responsive dashboard with mobile bottom tab bar
- Protected routes with auth state

## Build

```bash
pnpm build
```

Output goes to `dist/`.
