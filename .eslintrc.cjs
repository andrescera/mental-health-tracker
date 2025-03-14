/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    ecmaVersion: 2023,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import", "jsx-a11y", "prettier"],
  extends: [
    "eslint:recommended",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended", // Make sure this is LAST in the extends array
  ],
  rules: {
    // TypeScript-specific rules
    "unused-vars": "off",
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-ts-comment": [
      "warn",
      {
        "ts-ignore": "allow-with-description",
        "ts-expect-error": "allow-with-description",
        minimumDescriptionLength: 5,
      },
    ],
    "@typescript-eslint/no-floating-promises": "error",

    // React-specific rules
    "react/react-in-jsx-scope": "off", // Not needed with NextJS
    "react/prop-types": "off", // Use TypeScript for prop validation
    "react/jsx-key": "error",
    "react/no-array-index-key": "off",
    "react/self-closing-comp": "warn",
    "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
    "react/jsx-no-useless-fragment": "warn",

    // React Hooks rules
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Import rules
    "import/no-unresolved": "off", // TypeScript handles this
    "import/order": [
      "warn",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "object",
          "type",
          "index",
        ],
        pathGroups: [
          {
            pattern: "react",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "next/**",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "~/components/**",
            group: "internal",
            position: "before",
          },
          {
            pattern: "~/lib/**",
            group: "internal",
            position: "before",
          },
          {
            pattern: "~/trpc/**",
            group: "internal",
            position: "before",
          },
          {
            pattern: "~/server/**",
            group: "internal",
            position: "before",
          },
        ],
        pathGroupsExcludedImportTypes: ["react", "next"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-cycle": "error",
    "import/no-duplicates": "warn",

    // General best practices
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    "no-debugger": "warn",
    "no-alert": "warn",
    "no-unused-expressions": "off", // TypeScript plugin handles this
    "no-unused-vars": "off", // TypeScript plugin handles this
    "prefer-const": "warn",
    eqeqeq: ["error", "always", { null: "ignore" }],
    curly: ["warn", "all"],
    "dot-notation": "warn",
    "no-var": "error",
    "object-shorthand": "warn",
    "arrow-body-style": ["warn", "as-needed"],
    "padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "*", next: "return" },
      { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
      { blankLine: "any", prev: ["const", "let", "var"], next: ["const", "let", "var"] },
    ],

    // Accessibility
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/img-redundant-alt": "error",

    // NextJS specific rules
    "react/no-unknown-property": ["error", { ignore: ["jsx", "global"] }],

    // Prettier integration
    "prettier/prettier": ["warn", {}, { usePrettierrc: true }],
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: ["./tsconfig.json"],
      },
    },
  },
  ignorePatterns: [
    "**/*.js",
    "**/*.json",
    "node_modules",
    "public",
    "dist",
    ".next",
    "coverage",
    "next.config.js",
  ],
};

module.exports = config;
