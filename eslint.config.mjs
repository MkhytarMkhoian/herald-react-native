import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['**/lib/', '**/node_modules/', 'coverage/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['packages/react/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: { globals: { module: 'writable' } },
  },
]);
