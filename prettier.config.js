/** @type {import("prettier").Config} */
const config = {
  arrowParens: 'always',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 80,
  endOfLine: 'auto',
  plugins: ['prettier-plugin-tailwindcss'],
}

export default config
