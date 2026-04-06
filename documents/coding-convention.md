# CRAM Coding Style Guidelines

This document outlines the required coding style and formatting conventions for the CRAM project. All developers must follow these rules when writing code to ensure consistency, readability, and maintainability across the entire codebase. 

## 1. Naming Conventions

Consistent naming is critical for understanding the intent behind variables and functions.

- **Variables and Functions:** Use `camelCase` for all variables, functions, and standard object properties (e.g., `userEmail`, `fetchData()`, `isActive`).
- **Boolean Variables:** Prefix boolean variables with `is`, `has`, or `should` (e.g., `isLoading`, `hasError`).
- **Constants:** Use `UPPER_SNAKE_CASE` for global or environment constants (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`).
- **Classes and Models:** Use `PascalCase` for JavaScript class names and Mongoose database models (e.g., `Course`, `User`).
- **React Components:** Use `PascalCase` for all React component names and their corresponding files (e.g., `LoginForm.tsx`, `AuthDialog.tsx`).
- **Custom Hooks:** React hooks must start with the `use` prefix (e.g., `useAuth`).

## 2. Formatting and Syntax

Code must be formatted uniformly to prevent unnecessary diffs and improve readability.

- **Indentation:** Use **4 spaces** for indentation. Do not use tabs. 
- **Semicolons:** Always use semicolons at the end of valid statements.
- **Quotes:** 
  - Use single quotes (`'`) for standard JavaScript/TypeScript strings.
  - Use double quotes (`"`) for JSX attributes (e.g., `<input type="email" />`) and JSON keys.
- **Line Length:** Try to keep line lengths under 100 characters. Break long lines into multiple lines for readability.
- **Variable Declarations:** 
  - Always use `const` by default.
  - Only use `let` if you explicitly need to reassign the variable. 
  - **Never use `var`.**
- **Trailing Commas:** Add trailing commas when defining multiline arrays or objects to make future line additions cleaner.
- **Braces:** Always use curly braces for `if`, `else`, `for`, and `while` statements, even if they only contain a single line, to prevent syntax errors during future edits.

## 3. Comments and Documentation

Code should be as self-explanatory as possible, but clear comments are necessary for complex logic.

- **Purpose of Comments:** Comments should explain *why* the code exists or the intent behind complex logic, not *what* the code is doing (the code itself should explain what it is doing).
- **Single-line Comments:** Use `//` for brief, inline explanations. Leave one space after the slashes. Place inline comments on the line directly above the code it describes.
- **Block Comments / JSDoc:** Use `/** ... */` format to document the purpose, parameters, and return types of complex functions or API controllers.
- **TODOs:** If you are leaving incomplete work or thoughts, clearly mark them with `// TODO: [explanation]`.

## 4. Frontend Specific (React & TypeScript)

- **Component Types:** Only use functional components. Class components are strictly prohibited.
- **Type Checking (TypeScript):**
  - Explicitly define `interface` or `type` objects for all component props and state.
  - Avoid using the `any` keyword. If a type is unknown, use `unknown` and perform type narrowing. 
- **De-structuring:** Always destructure props directly in the function signature when defining functional components (e.g., `function MyComponent({ title, id }: MyComponentProps)`).
- **CSS and Styling:** When using Tailwind CSS, keep `className` strings organized. Group structural classes (layout, flex, grid) first, followed by visual styling (colors, typography).

## 5. Backend Specific (Node.js & Express)

- **Asynchronous Logic:** Always use `async/await` for asynchronous operations. Avoid using raw `.then().catch()` chains.
- **Require Statements:** All `require` statements must be placed at the very top of the file, separated by built-in modules first, third-party libraries second, and local file imports last.
- **Error Handling:** Avoid letting unhandled promise rejections crash the server. Always wrap controller logic in `try/catch` blocks and explicitly log errors before returning a formal HTTP error response. 
