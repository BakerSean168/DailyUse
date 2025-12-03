/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

/**
 * Vitest Configuration for domain-client package
 *
 * This configuration merges with the shared config and adds project-specific settings.
 * The workspace configuration (vitest.workspace.ts) takes precedence when running tests
 * from the workspace root.
 */
export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'happy-dom',
  }),
  defineConfig({
    test: {
      name: 'domain-client',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 5000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
        },
      },
    },
  }),
);
