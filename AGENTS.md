# Project: Jenna (AI Assistant)

Jenna is an all-purpose AI agent that uses LLMs and supporting tools to perform a variety of tasks.

## Project structure

```
src/app/api/chat/route.ts
src/app/api/settings/route.ts
src/app/api/tools/route.ts
src/app/chat/page.tsx
src/components/ai-elements/*.tsx  # AI-specific UI components
src/lib/models.ts
src/lib/tools/*                 # agent tool implementations
```

## Coding guidelines
- **Frameworks:** Use Next.js 15 and React 19.
- **Styling:** Use Tailwind CSS and follow shadcn UI patterns.
- **TypeScript:** Never use the `any` type.

## Commands / workflow
- **Do not** run `pnpm dev` or `pnpm build` in this environment.
- After completing a code task, run `pnpm run precheck` to execute both linting and type checking. Do not run the linters or type checker separately.
