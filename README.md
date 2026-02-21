# AdSphere — Spec-Driven Campaign Orchestration Platform

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

AdSphere is a **frontend-first** platform for digital advertising campaign management. 

This repository serves as a technical demonstration of **Spec-Driven Development (SDD)** and strict **Domain-Driven Architecture** within a modern React/Next.js ecosystem. 

Rather than building a wide array of basic features, this project focuses on a **Vertical Slice** of a complex feature (Campaign Creation) to showcase advanced state management, strict typings, and pure domain rules.

---

## 🎯 Architecture Focus: Spec-Driven Development (SDD)

The defining characteristic of this project is its adherence to **Spec-Driven Development**.

1. **Specs before Code**: Features start as a markdown document (`campaign.spec.md`) defining the exact states, inputs, and business rules.
2. **Explicit States**: The system state is strictly modeled using TypeScript Discriminated Unions (`campaign.state.ts`). There are no "hidden" boolean flags (e.g., `isLoading`, `isError`). 
3. **Pure Domain Logic**: All business rules (date validation, time slot conflicts, etc.) and state transitions are pure, isolated functions (`campaign.rules.ts`, `campaign.machine.ts`) with zero dependencies on the UI or Framework.
4. **Boundary Defense**: External input is validated aggressively at the edge using `Zod` (`campaign.schema.ts`) before it ever enters the domain logic.
5. **Dumb UI**: The React Components (`CampaignForm.tsx`) hold zero business logic. They simply emit events to the Application layer (`validateCampaign.usecase.ts`) and render the resulting state.

*For a deep dive into the architecture, check out the [PROJECT_SPEC.md](./PROJECT_SPEC.md).*

---

## 🚀 Features Developed

### The Campaign Builder (Vertical Slice)
- **Reactive UI**: A complete, multi-step campaign configuration form.
- **Strict Data Contracts**: Enforces rules like "end dates must follow start dates" and "no overlapping schedule time slots".
- **Comprehensive State Machine**: Manages the exact lifecycle of a campaign draft from `idle` ➔ `editing` ➔ `validating` ➔ `invalid` / `ready_to_publish` ➔ `published`.
- **Domain Driven Validation**: Purely functional tests and validations, independent of the React framework.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 18+](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Contract Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) (For isolated Domain and Machine validation)
- **Package Manager**: pnpm

---

## 💻 Getting Started

### Prerequisites
Make sure you have `Node.js` (v18+) and `pnpm` installed.

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sdd
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Running Tests

To verify the pure domain logic and state machine transitions (The core of the SDD approach):

```bash
pnpm run test
```
*(This triggers Vitest to validate `campaign.rules.test.ts` and `campaign.machine.test.ts`)*

---

*This project was built to demonstrate architectural maturity, contract-first development, and clean UI separation.*
