import js from "@eslint/js"
import globals from "globals"
import importX from "eslint-plugin-import-x"
import react from "@eslint-react/eslint-plugin"
import hooks from "eslint-plugin-react-hooks"
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
      ...react.configs["recommended-typescript"].plugins,
      "react-hooks": hooks,
      "unused-imports": unusedImports,
    },
    settings: {
      ...react.configs["recommended-typescript"].settings,
      "import-x/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] },
      "import-x/resolver": {
        typescript: { project: "assets" },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs["recommended-typescript"].rules,
      ...tseslint.configs.eslintRecommended.rules,
      ...tseslint.configs.recommended.at(-1).rules,
      ...Object.fromEntries(
        Object.keys(react.configs["recommended-typescript"].rules)
          .filter(
            (rule) =>
              [
                "@eslint-react/error-boundaries",
                "@eslint-react/exhaustive-deps",
                "@eslint-react/no-array-index-key",
                "@eslint-react/no-children-count",
                "@eslint-react/no-children-for-each",
                "@eslint-react/no-children-map",
                "@eslint-react/no-children-only",
                "@eslint-react/no-children-to-array",
                "@eslint-react/no-clone-element",
                "@eslint-react/no-context-provider",
                "@eslint-react/no-create-ref",
                "@eslint-react/no-forward-ref",
                "@eslint-react/no-nested-component-definitions",
                "@eslint-react/no-nested-lazy-component-declarations",
                "@eslint-react/no-set-state-in-component-did-mount",
                "@eslint-react/no-set-state-in-component-did-update",
                "@eslint-react/no-set-state-in-component-will-update",
                "@eslint-react/no-unnecessary-use-prefix",
                "@eslint-react/no-unused-class-component-members",
                "@eslint-react/no-use-context",
                "@eslint-react/purity",
                "@eslint-react/rules-of-hooks",
                "@eslint-react/set-state-in-effect",
                "@eslint-react/set-state-in-render",
                "@eslint-react/static-components",
                "@eslint-react/unsupported-syntax",
                "@eslint-react/use-memo",
                "@eslint-react/use-state",
                "@eslint-react/jsx-no-key-after-spread",
                "@eslint-react/jsx-no-leaked-dollar",
                "@eslint-react/jsx-no-leaked-semicolon",
                "@eslint-react/rsc-function-definition",
                "@eslint-react/dom-no-dangerously-set-innerhtml",
                "@eslint-react/dom-no-flush-sync",
                "@eslint-react/dom-no-hydrate",
                "@eslint-react/dom-no-render",
                "@eslint-react/dom-no-unsafe-iframe-sandbox",
                "@eslint-react/dom-no-use-form-state",
              ].includes(rule) ||
              rule.startsWith("@eslint-react/web-api-") ||
              rule.startsWith("@eslint-react/naming-convention-"),
          )
          .map((rule) => [rule, "off"]),
      ),
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
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
