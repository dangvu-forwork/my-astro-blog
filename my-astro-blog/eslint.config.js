import eslintPluginAstro from "eslint-plugin-astro"
import tsParser from "@typescript-eslint/parser"

export default [
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],

  {
    ignores: [".astro/**", "dist/**"]
  },

  {
    files: ["**/*.astro"],
    languageOptions: {
        parserOptions: {
            parser: tsParser
        }
    }
  }
]