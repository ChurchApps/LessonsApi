module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", {
      isolatedModules: true,
      tsconfig: {
        module: "commonjs",
        target: "es2022",
        esModuleInterop: true,
        allowJs: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }]
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  testTimeout: 10000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
