/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
// The Tailwind v4 plugin is skipped under Vitest (mode === 'test'): tests assert
// on class strings/behaviour, not computed styles, so CSS processing is wasted work.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'test' ? [] : [tailwindcss()])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'cobertura', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx', // app entrypoint (rendered by the browser, not tests)
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/components/ui/**', // generated shadcn/ui primitives
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        // Mirrors the repository ruleset's 70% code-coverage gate.
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
}))
