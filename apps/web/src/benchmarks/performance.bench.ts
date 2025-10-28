/**
 * Performance Benchmark Suite (STORY-014)
 * 性能基准测试套件
 *
 * 使用 Vitest Bench API 进行性能测试
 * 文档: https://vitest.dev/guide/features.html#benchmarking
 */

import { bench, describe } from 'vitest';
import { Goal, GoalFolder } from '@dailyuse/domain-client';
import { statusRuleEngine } from '../modules/goal/application/services/StatusRuleEngine';
import type { GoalData } from '../modules/goal/application/services/StatusRuleEngine';

/**
 * 性能基准配置
 */
const BENCHMARK_CONFIG = {
  DAG_RENDERING: {
    target: 500, // ms for 100 nodes
    small: 10,
    medium: 50,
    large: 100,
  },
  GOAL_CRUD: {
    target: 100, // ms per operation
    iterations: 100,
  },
  WEIGHT_CALC: {
    target: 50, // ms
    keyResults: 10,
  },
  RULE_EVAL: {
    target: 10, // ms per evaluation
    goals: 50,
  },
};

/**
 * 生成测试数据
 */
function generateTestGoals(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    uuid: `test-goal-${i}`,
    title: `Test Goal ${i}`,
    description: `Description for test goal ${i}`,
    status: 'ACTIVE',
    color: '#3357FF',
    keyResults: Array.from({ length: 5 }, (_, j) => ({
      uuid: `kr-${i}-${j}`,
      progress: Math.floor(Math.random() * 100),
      weight: 20,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

function generateTestGoalData(count: number): GoalData[] {
  return Array.from({ length: count }, (_, i) => ({
    uuid: `test-goal-${i}`,
    status: 'ACTIVE' as any,
    keyResults: Array.from({ length: 5 }, (_, j) => ({
      uuid: `kr-${i}-${j}`,
      progress: Math.floor(Math.random() * 100),
      weight: 20,
    })),
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

/**
 * 1. Goal CRUD 操作基准测试
 */
describe('Goal CRUD Performance', () => {
  const testGoals = generateTestGoals(BENCHMARK_CONFIG.GOAL_CRUD.iterations);

  bench(
    'Create Goal',
    () => {
      const goal = {
        uuid: `goal-${Date.now()}`,
        title: 'Test Goal',
        description: 'Test Description',
        status: 'ACTIVE',
        keyResults: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // Simulate goal creation
      JSON.stringify(goal);
    },
    {
      iterations: BENCHMARK_CONFIG.GOAL_CRUD.iterations,
    },
  );

  bench(
    'Read Goal',
    () => {
      const goal = testGoals[Math.floor(Math.random() * testGoals.length)];
      // Simulate goal read
      const _ = { ...goal };
    },
    {
      iterations: BENCHMARK_CONFIG.GOAL_CRUD.iterations,
    },
  );

  bench(
    'Update Goal',
    () => {
      const goal = testGoals[Math.floor(Math.random() * testGoals.length)];
      // Simulate goal update
      const updated = {
        ...goal,
        title: 'Updated Title',
        updatedAt: Date.now(),
      };
      JSON.stringify(updated);
    },
    {
      iterations: BENCHMARK_CONFIG.GOAL_CRUD.iterations,
    },
  );

  bench(
    'Delete Goal (Filter)',
    () => {
      const goalToDelete = testGoals[0].uuid;
      // Simulate delete by filtering
      const remaining = testGoals.filter((g) => g.uuid !== goalToDelete);
    },
    {
      iterations: BENCHMARK_CONFIG.GOAL_CRUD.iterations,
    },
  );
});

/**
 * 2. 权重计算基准测试
 */
describe('Weight Calculation Performance', () => {
  const keyResults = Array.from({ length: BENCHMARK_CONFIG.WEIGHT_CALC.keyResults }, (_, i) => ({
    uuid: `kr-${i}`,
    weight: Math.floor(100 / BENCHMARK_CONFIG.WEIGHT_CALC.keyResults),
    progress: Math.floor(Math.random() * 100),
  }));

  bench('Calculate Total Weight', () => {
    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  });

  bench('Calculate Average Progress', () => {
    const avgProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
  });

  bench('Calculate Weighted Progress', () => {
    const weightedProgress = keyResults.reduce(
      (sum, kr) => sum + (kr.progress * kr.weight) / 100,
      0,
    );
  });

  bench('Validate Weight Sum', () => {
    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const isValid = Math.abs(totalWeight - 100) < 0.01;
  });
});

/**
 * 3. 规则评估基准测试
 */
describe('Rule Evaluation Performance', () => {
  const testGoals = generateTestGoalData(BENCHMARK_CONFIG.RULE_EVAL.goals);

  bench('Single Rule Evaluation', () => {
    const goal = testGoals[0];
    statusRuleEngine.evaluate(goal);
  });

  bench('Batch Rule Evaluation (10 goals)', () => {
    for (let i = 0; i < 10; i++) {
      statusRuleEngine.evaluate(testGoals[i]);
    }
  });

  bench('Batch Rule Evaluation (50 goals)', () => {
    testGoals.forEach((goal) => {
      statusRuleEngine.evaluate(goal);
    });
  });

  bench('All Rules Evaluation (single goal)', () => {
    const goal = testGoals[0];
    statusRuleEngine.evaluateAll(goal);
  });
});

/**
 * 4. DAG 数据处理基准测试
 */
describe('DAG Data Processing Performance', () => {
  bench('Build DAG nodes (10 goals)', () => {
    const goals = generateTestGoals(10);
    const nodes = goals.map((goal, i) => ({
      id: goal.uuid,
      name: goal.title,
      x: i * 100,
      y: i * 50,
      symbolSize: 40,
    }));
  });

  bench('Build DAG nodes (50 goals)', () => {
    const goals = generateTestGoals(50);
    const nodes = goals.map((goal, i) => ({
      id: goal.uuid,
      name: goal.title,
      x: (i % 10) * 100,
      y: Math.floor(i / 10) * 100,
      symbolSize: 40,
    }));
  });

  bench('Build DAG nodes (100 goals)', () => {
    const goals = generateTestGoals(100);
    const nodes = goals.map((goal, i) => ({
      id: goal.uuid,
      name: goal.title,
      x: (i % 10) * 100,
      y: Math.floor(i / 10) * 100,
      symbolSize: 40,
    }));
  });

  bench('Build DAG edges (100 relationships)', () => {
    const edges = Array.from({ length: 100 }, (_, i) => ({
      source: `goal-${i}`,
      target: `goal-${i + 1}`,
    }));
  });
});

/**
 * 5. JSON 序列化/反序列化基准测试
 */
describe('JSON Serialization Performance', () => {
  const smallGoal = generateTestGoals(1)[0];
  const mediumGoals = generateTestGoals(10);
  const largeGoals = generateTestGoals(100);

  bench('Serialize small goal (1 goal, 5 KRs)', () => {
    JSON.stringify(smallGoal);
  });

  bench('Serialize medium dataset (10 goals)', () => {
    JSON.stringify(mediumGoals);
  });

  bench('Serialize large dataset (100 goals)', () => {
    JSON.stringify(largeGoals);
  });

  const smallJSON = JSON.stringify(smallGoal);
  const mediumJSON = JSON.stringify(mediumGoals);
  const largeJSON = JSON.stringify(largeGoals);

  bench('Deserialize small goal', () => {
    JSON.parse(smallJSON);
  });

  bench('Deserialize medium dataset', () => {
    JSON.parse(mediumJSON);
  });

  bench('Deserialize large dataset', () => {
    JSON.parse(largeJSON);
  });
});

/**
 * 6. 数组操作基准测试
 */
describe('Array Operations Performance', () => {
  const smallArray = generateTestGoals(10);
  const mediumArray = generateTestGoals(50);
  const largeArray = generateTestGoals(100);

  bench('Filter goals (10 items)', () => {
    smallArray.filter((g) => g.status === 'ACTIVE');
  });

  bench('Filter goals (100 items)', () => {
    largeArray.filter((g) => g.status === 'ACTIVE');
  });

  bench('Map goals (10 items)', () => {
    smallArray.map((g) => ({ ...g, processed: true }));
  });

  bench('Map goals (100 items)', () => {
    largeArray.map((g) => ({ ...g, processed: true }));
  });

  bench('Sort goals (100 items)', () => {
    [...largeArray].sort((a, b) => a.title.localeCompare(b.title));
  });

  bench('Find goal (100 items)', () => {
    largeArray.find((g) => g.uuid === 'test-goal-50');
  });
});
