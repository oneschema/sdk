import js from "@eslint/js"
import globals from "globals"
import importX from "eslint-plugin-import-x"
import unusedImports from "eslint-plugin-unused-imports"
import tseslint from "typescript-eslint"

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2021,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "import-x": importX,
      "unused-imports": unusedImports,
    },
    settings: {
      "import-x/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] },
      "import-x/resolver": {
        typescript: { project: "assets" },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.eslintRecommended.rules,
      ...tseslint.configs.recommended.at(-1).rules,
      ...importX.flatConfigs.recommended.rules,
      ...importX.flatConfigs.typescript.rules,
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-unused-expressions": "off",
      indent: "off",
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "never"],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "import-x/order": "off",
      "sort-imports": "off",
      "import-x/default": "off",
      "import-x/no-named-as-default-member": "off",
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]
