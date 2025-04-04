import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  preset: 'ts-jest',
  verbose: true,
};

export default config;