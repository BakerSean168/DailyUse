/** @type {import('jest').Config} */
export default {
  // 使用 ts-jest preset
  preset: 'ts-jest',

  // 测试环境
  testEnvironment: 'jsdom',

  // 测试环境选项
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  // 支持的文件扩展名
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],

  // 文件转换规则
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'preserve',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        isolatedModules: true,
      },
    ],
  },

  // 模块名称映射（路径别名）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@dailyuse/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
    '^@dailyuse/domain-client$': '<rootDir>/../../packages/domain-client/src/index.ts',
    '^@dailyuse/ui-vuetify$': '<rootDir>/../../packages/ui-vuetify/src/index.ts',
    '^@dailyuse/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    // CSS 模块处理
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 静态资源处理
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/test/__mocks__/fileMock.js',
  },

  // 测试匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{spec,test}.{js,ts}',
    '<rootDir>/src/**/*.{spec,test}.{js,ts}',
  ],

  // 忽略的路径
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '\\.snap$'],

  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup.ts'],

  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.{js,ts,vue}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/test/**',
    '!src/main.ts',
    '!src/App.vue',
    '!src/**/*.stories.ts',
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // 覆盖率输出目录
  coverageDirectory: '<rootDir>/coverage',

  // 清除 mock
  clearMocks: true,

  // 每个测试文件的最大并发数
  maxWorkers: '50%',

  // 测试超时时间 (ms)
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // 转换忽略
  transformIgnorePatterns: ['node_modules/(?!(@vue|@vueuse|echarts|zrender)/)'],
};
