import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",  
      globals: {
        ...globals.node,
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "no-undef": "off",
      "eqeqeq": ["error", "always"],
    }
  }
];