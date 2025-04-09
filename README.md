This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Instructor Chat System

A Next.js-based chat system for instructors, with TypeScript integration, Redux for state management, and comprehensive testing.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing Infrastructure](#testing-infrastructure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Project Structure](#project-structure)

## Features

- Real-time chat with WebSocket integration
- Course management with detailed metrics
- User authentication and profile management
- End-to-end encryption for secure messaging
- Offline support with PWA capabilities
- Internationalization with i18n
- Dark mode and accessibility features

## Tech Stack

- **Framework**: Next.js with TypeScript
- **State Management**: Redux with Redux Toolkit
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **API**: RESTful + GraphQL with Apollo Client
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js 16+

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Run the development server:

```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the application

## Testing Infrastructure

We've implemented a comprehensive testing strategy with different levels of tests:

### Unit Tests

Unit tests use Vitest and React Testing Library to test individual components and functions.

```bash
# Run all unit and integration tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly, particularly focusing on Redux store integration.

### End-to-End Tests

E2E tests use Playwright to simulate user interactions with the application.

```bash
# Install Playwright browsers
bun playwright install

# Run E2E tests
bun playwright test

# Run E2E tests in UI mode
bun playwright test --ui
```

## CI/CD Pipeline

We use GitHub Actions for continuous integration and deployment.

### CI Workflow

The CI workflow runs on every pull request and push to main branches:

1. **Lint**: Runs ESLint to ensure code quality
2. **Test**: Runs unit and integration tests with Vitest
3. **E2E**: Runs end-to-end tests with Playwright
4. **Build**: Builds the application and verifies it compiles successfully

### CD Workflow

The CD workflow runs when a release is published or manually triggered:

1. **Build**: Builds the application with production environment variables
2. **Deploy**: Deploys to Netlify (staging or production)
3. **Notify**: Sends a Slack notification upon successful deployment

## Project Structure

```
ins-cht-sys/
├── .github/           # GitHub Actions workflows
├── e2e/               # End-to-end tests with Playwright
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   └── __tests__/ # Component tests
│   ├── hooks/         # Custom React hooks
│   │   └── __tests__/ # Hook tests
│   ├── lib/           # Utility functions
│   ├── pages/         # Next.js pages
│   │   └── api/       # API routes
│   ├── schemas/       # Zod validation schemas
│   ├── services/      # API service layer
│   │   └── __tests__/ # Service tests
│   ├── store/         # Redux store configuration
│   │   └── slices/    # Redux slices
│   ├── styles/        # Global styles
│   └── types/         # TypeScript type definitions
├── .eslintrc.js       # ESLint configuration
├── jest.config.js     # Jest configuration
├── next.config.js     # Next.js configuration
├── playwright.config.ts # Playwright configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
