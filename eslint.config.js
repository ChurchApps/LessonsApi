const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      ...prettierConfig.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "prefer-const": "warn",
      "no-var": "error",
      // Formatting rules that work with Prettier
      "max-len": "off",
      indent: "off", // Let Prettier handle this
      quotes: "off", // Let Prettier handle this
      semi: "off", // Let Prettier handle this
      "comma-dangle": "off", // Let Prettier handle this
      "object-curly-spacing": "off", // Let Prettier handle this
      "array-bracket-spacing": "off", // Let Prettier handle this
      "space-before-function-paren": "off", // Let Prettier handle this
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      parser: undefined, // Use default parser for JS files
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      ...prettierConfig.rules,
      "prefer-const": "warn",
      "no-var": "error",
      "max-len": "off",
      indent: "off",
      quotes: "off",
      semi: "off",
      "comma-dangle": "off",
      "object-curly-spacing": "off",
      "array-bracket-spacing": "off",
      "space-before-function-paren": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js"],
  },
];
