/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Increase default timeout for tests hitting external APIs.
  testTimeout: 30000
};