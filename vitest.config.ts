import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
    alias: {
      // obsidian npm package ships types only — runtime is injected by the
      // Obsidian app. For tests we substitute a lightweight stub so vitest
      // can resolve imports. Tests that need the API inject their own
      // requestFn so the stub's runtime exports are never called.
      obsidian: resolve(__dirname, 'tests/mocks/obsidian.ts'),
    },
  },
})
