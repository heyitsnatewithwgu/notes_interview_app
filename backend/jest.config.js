// Jest configuration for the NestJS backend.
//
// One config runs both test layers (kept in separate locations):
//   - Unit tests:  src  -> *.spec.ts       (isolated, mocked repository)
//   - E2E tests:   test -> *.e2e-spec.ts   (full app over in-memory SQLite + supertest)
//
// Coverage is aggregated across both layers and emitted as Cobertura XML
// (consumed by the GitHub code-coverage ruleset — see docs/platform/BRANCH_PROTECTION.md).
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.ts'],
  // main.ts is the bootstrap entrypoint (started as a process, not imported by tests).
  coveragePathIgnorePatterns: ['/node_modules/', 'src/main.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'cobertura', 'lcov'],
  coverageThreshold: {
    // Mirrors the repository ruleset's 70% code-coverage gate.
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
  testEnvironment: 'node',
  clearMocks: true,
};
