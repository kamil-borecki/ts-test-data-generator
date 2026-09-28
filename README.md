# TypeScript Test Data Generator

A browser-based generator for test data from a TypeScript type definition or a manually configured schema.

**Live demo:** [kamil-borecki.github.io/ts-test-data-generator](https://kamil-borecki.github.io/ts-test-data-generator/)

## Features

- Paste a TypeScript `type` definition and turn it into fields automatically.
- Configure value variants and ranges for strings, numbers, booleans, and dates.
- Generate one to 1000 test records with Faker.
- Preview and copy generated data as JSON or a TypeScript declaration.
- Preview the resulting TypeScript schema.

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

The development server is available at the URL printed by Vite (normally `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run lint` | Run Oxlint. |
| `npm run preview` | Preview the production build locally. |

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` deploys the application to GitHub Pages after every push to `main`.

For the first deployment, open the repository **Settings → Pages** and ensure **Source** is set to **GitHub Actions**. The deployed site is available at:

`https://kamil-borecki.github.io/ts-test-data-generator/`

## Stack

- React + TypeScript
- Vite
- Mantine
- Faker
