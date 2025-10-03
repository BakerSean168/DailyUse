/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Shared Vitest configuration for all projects
 *
 * This provides common settings that can be merged into individual project configs.
 * Use with mergeConfig() for custom configurations.
 *
 * @example
 * ```ts
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import { createSharedConfig } from '../../vitest.shared';
 *
 * export default mergeConfig(
 *   createSharedConfig({
 *     projectRoot: __dirname,
 *     environment: 'node',
 *   }),
 *   defineConfig({
 *     test: {
 *       name: 'my-project',
 *     }
 *   })
 * );
 * ```
 */

interface SharedConfigOptions {
  /** Project root directory (e.g., './packages/domain-server') */
  projectRoot: string;
  /** Test environment: 'node' | 'happy-dom' | 'jsdom' */
  environment?: 'node' | 'happy-dom' | 'jsdom';
  /** Additional path aliases */
  aliases?: Record<string, string>;
}

/**
 * Create a shared configuration for a project
 */
export function createSharedConfig(options: SharedConfigOptions) {
  const { projectRoot, environment = 'node', aliases = {} } = options;

  // Common aliases for all projects
  const baseAliases = {
    '@': path.resolve(projectRoot, './src'),
    '@dailyuse/contracts': path.resolve(projectRoot, '../../packages/contracts/src'),
    '@dailyuse/domain-core': path.resolve(projectRoot, '../../packages/domain-core/src'),
    '@dailyuse/domain-server': path.resolve(projectRoot, '../../packages/domain-server/src'),
    '@dailyuse/domain-client': path.resolve(projectRoot, '../../packages/domain-client/src'),
    '@dailyuse/ui': path.resolve(projectRoot, '../../packages/ui/src'),
    '@dailyuse/utils': path.resolve(projectRoot, '../../packages/utils/src'),
    ...aliases,
  };

  return defineConfig({
    resolve: {
      alias: baseAliases,
    },
    test: {
      globals: true,
      environment,
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'dist-electron',
        '.git',
        '.cache',
        '.nx',
        'src/test/setup.ts',
        '**/prisma/**',
      ],
      coverage: {
        enabled: false, // Controlled by workspace config
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test/', 'prisma/', '**/*.d.ts', '**/*.config.*', 'dist/'],
      },
    },
  });
}

/**
 * Default shared configuration
 */
export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
