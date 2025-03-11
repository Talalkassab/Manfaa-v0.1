# Development Notes

## VS Code Setup

### CSS Linting with TailwindCSS

If you're seeing linting errors in your CSS files related to TailwindCSS directives (e.g., `@tailwind`, `@apply`), these are false positives from the CSS Language Service. TailwindCSS uses custom at-rules that the standard CSS linter doesn't recognize.

We've included a `.vscode/settings.json` file that disables the default CSS validation and enables proper TailwindCSS support. If you're still seeing these errors, please ensure:

1. You have the TailwindCSS VSCode extension installed:
   ```
   Name: Tailwind CSS IntelliSense
   ID: bradlc.vscode-tailwindcss
   ```

2. Your `.vscode/settings.json` contains:
   ```json
   {
     "css.validate": false,
     "less.validate": false,
     "scss.validate": false
   }
   ```

### Recommended Extensions

For the best development experience with this project, we recommend installing the following VSCode extensions:

- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`): Provides autocomplete, syntax highlighting, and linting for Tailwind CSS classes
- **PostCSS Language Support** (`csstools.postcss`): Adds support for PostCSS features
- **ESLint** (`dbaeumer.vscode-eslint`): JavaScript/TypeScript linting
- **Prettier - Code formatter** (`esbenp.prettier-vscode`): Code formatting

## Common Issues

### TailwindCSS Not Working

If TailwindCSS styles are not applying correctly:

1. Ensure that `postcss.config.js` and `tailwind.config.js` are in the root directory
2. Check that the content paths in `tailwind.config.js` match your project structure
3. Verify that the TailwindCSS directives are properly included in your CSS:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### TypeScript JSX Errors

If you're seeing errors like `'React' refers to a UMD global, but the current file is a module`, ensure:

1. React is imported in every file that uses JSX:
   ```typescript
   import React from 'react';
   ```

2. Or configure the TypeScript compiler for the newer JSX transform in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx"
     }
   }
   ```

## Project Structure

The project follows a Next.js App Router structure:

- `src/app`: Page components and layouts
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and hooks
- `supabase`: Database schema and security policies

## Git Workflow

1. Create feature branches from `main`
2. Use conventional commit messages
3. Submit PRs with detailed descriptions
4. Keep PRs focused on a single feature or fix 