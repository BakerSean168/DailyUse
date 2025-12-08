/**
 * PriorityCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriorityCard } from '../PriorityCard';
import type { PriorityScore } from '@dailyuse/application-client/goal';

const mockPriorityScore: PriorityScore = {
  taskId: 'task-1',
  taskTitle: 'Test Task',
  score: 75,
  level: 'critical',
  factors: {
    urgency: 8,
    importance: 8,
    impact: 6,
    effort: 3,
    dependencies: 4,
    momentum: 5,
  },
  eisenhowerQuadrant: 'urgent-important',
  recommendation: '立即开始此任务',
  reasoning: '截止日期临近，重要性高',
  createdAt: new Date(),
};

describe('PriorityCard', () => {
  describe('Rendering', () => {
    it('should render empty state when no score provided', () => {
      render(<PriorityCard />);
      expect(screen.getByText('未分析优先级')).toBeInTheDocument();
    });

    it('should render priority score', () => {
      render(<PriorityCard score={mockPriorityScore} />);
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('should render priority level', () => {
      render(<PriorityCard score={mockPriorityScore} />);
      expect(screen.getByText('紧急')).toBeInTheDocument();
    });

    it('should render Eisenhower quadrant', () => {
      render(<PriorityCard score={mockPriorityScore} />);
      expect(screen.getByText('紧急且重要')).toBeInTheDocument();
    });
  });

  describe('Recommendation Display', () => {
    it('should display recommendation text', () => {
      render(<PriorityCard score={mockPriorityScore} />);
      expect(screen.getByText('立即开始此任务')).toBeInTheDocument();
    });

    it('should have recommendation in blue box', () => {
      const { container } = render(<PriorityCard score={mockPriorityScore} />);
      const blueBox = container.querySelector('.bg-blue-50');
      expect(blueBox).toBeInTheDocument();
    });
  });

  describe('Details Toggle', () => {
    it('should show details by default', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);
      expect(screen.getByText('紧急度')).toBeInTheDocument();
    });

    it('should hide details when showDetails is false', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={false} />);
      // Details should be collapsed initially
      const expandButton = screen.getByText('展开详情');
      expect(expandButton).toBeInTheDocument();
    });

    it('should toggle details on button click', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);

      const toggleButton = screen.getByText('收起详情');
      fireEvent.click(toggleButton);

      // Should show expand button now
      expect(screen.getByText('展开详情')).toBeInTheDocument();
    });
  });

  describe('Factor Visualization', () => {
    it('should display all factor labels when expanded', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);

      expect(screen.getByText('紧急度')).toBeInTheDocument();
      expect(screen.getByText('重要度')).toBeInTheDocument();
      expect(screen.getByText('影响度')).toBeInTheDocument();
      expect(screen.getByText('努力度')).toBeInTheDocument();
      expect(screen.getByText('依赖性')).toBeInTheDocument();
      expect(screen.getByText('动量')).toBeInTheDocument();
    });

    it('should display factor values', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);

      expect(screen.getByText('8.0/10')).toBeInTheDocument();
      expect(screen.getByText('3.0/10')).toBeInTheDocument();
      expect(screen.getByText('4.0/10')).toBeInTheDocument();
    });

    it('should render progress bars for factors', () => {
      const { container } = render(<PriorityCard score={mockPriorityScore} showDetails={true} />);
      const progressBars = container.querySelectorAll('.bg-gray-200.rounded-full');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Level Colors', () => {
    it('should use red for critical level', () => {
      const criticalScore: PriorityScore = {
        ...mockPriorityScore,
        score: 80,
        level: 'critical',
      };
      const { container } = render(<PriorityCard score={criticalScore} />);
      const coloredBox = container.querySelector('.bg-red-600');
      expect(coloredBox).toBeInTheDocument();
    });

    it('should use orange for high level', () => {
      const highScore: PriorityScore = {
        ...mockPriorityScore,
        score: 60,
        level: 'high',
      };
      const { container } = render(<PriorityCard score={highScore} />);
      const coloredBox = container.querySelector('.bg-orange-500');
      expect(coloredBox).toBeInTheDocument();
    });

    it('should use yellow for medium level', () => {
      const mediumScore: PriorityScore = {
        ...mockPriorityScore,
        score: 40,
        level: 'medium',
      };
      const { container } = render(<PriorityCard score={mediumScore} />);
      const coloredBox = container.querySelector('.bg-yellow-500');
      expect(coloredBox).toBeInTheDocument();
    });

    it('should use blue for low level', () => {
      const lowScore: PriorityScore = {
        ...mockPriorityScore,
        score: 10,
        level: 'low',
      };
      const { container } = render(<PriorityCard score={lowScore} />);
      const coloredBox = container.querySelector('.bg-blue-500');
      expect(coloredBox).toBeInTheDocument();
    });
  });

  describe('Reanalyze Button', () => {
    it('should show reanalyze button when onReanalyze provided', () => {
      const mockCallback = vi.fn();
      render(<PriorityCard score={mockPriorityScore} onReanalyze={mockCallback} />);

      expect(screen.getByText('重新分析')).toBeInTheDocument();
    });

    it('should not show reanalyze button when onReanalyze not provided', () => {
      render(<PriorityCard score={mockPriorityScore} />);

      // Should only have expand/collapse button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });

    it('should call onReanalyze when button clicked', () => {
      const mockCallback = vi.fn();
      render(<PriorityCard score={mockPriorityScore} onReanalyze={mockCallback} />);

      const reanalyzeButton = screen.getByText('重新分析');
      fireEvent.click(reanalyzeButton);

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should show loading state', () => {
      const mockCallback = vi.fn();
      const { rerender } = render(
        <PriorityCard score={mockPriorityScore} onReanalyze={mockCallback} loading={false} />
      );

      expect(screen.getByText('重新分析')).toBeInTheDocument();

      rerender(
        <PriorityCard score={mockPriorityScore} onReanalyze={mockCallback} loading={true} />
      );

      expect(screen.getByText('重新分析中...')).toBeInTheDocument();
    });

    it('should disable button during loading', () => {
      const mockCallback = vi.fn();
      render(
        <PriorityCard score={mockPriorityScore} onReanalyze={mockCallback} loading={true} />
      );

      const reanalyzeButton = screen.getByText('重新分析中...') as HTMLButtonElement;
      expect(reanalyzeButton.disabled).toBe(true);
    });
  });

  describe('Eisenhower Quadrant Labels', () => {
    it('should display correct label for urgent-important', () => {
      const score: PriorityScore = {
        ...mockPriorityScore,
        eisenhowerQuadrant: 'urgent-important',
      };
      render(<PriorityCard score={score} />);
      expect(screen.getByText('紧急且重要')).toBeInTheDocument();
    });

    it('should display correct label for not-urgent-important', () => {
      const score: PriorityScore = {
        ...mockPriorityScore,
        eisenhowerQuadrant: 'not-urgent-important',
      };
      render(<PriorityCard score={score} />);
      expect(screen.getByText('不紧急但重要')).toBeInTheDocument();
    });

    it('should display correct label for urgent-not-important', () => {
      const score: PriorityScore = {
        ...mockPriorityScore,
        eisenhowerQuadrant: 'urgent-not-important',
      };
      render(<PriorityCard score={score} />);
      expect(screen.getByText('紧急但不重要')).toBeInTheDocument();
    });

    it('should display correct label for not-urgent-not-important', () => {
      const score: PriorityScore = {
        ...mockPriorityScore,
        eisenhowerQuadrant: 'not-urgent-not-important',
      };
      render(<PriorityCard score={score} />);
      expect(screen.getByText('既不紧急也不重要')).toBeInTheDocument();
    });
  });

  describe('Analysis Reasoning', () => {
    it('should display reasoning text when expanded', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);
      expect(screen.getByText('分析原因')).toBeInTheDocument();
      expect(screen.getByText('截止日期临近，重要性高')).toBeInTheDocument();
    });

    it('should not display reasoning when collapsed', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={false} />);
      const expandButton = screen.getByText('展开详情');
      expect(expandButton).toBeInTheDocument();

      // Details should be hidden
      const detailSection = screen.queryByText('分析原因');
      expect(detailSection).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('should display creation timestamp', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);
      expect(screen.getByText(/分析时间:/)).toBeInTheDocument();
    });

    it('should format timestamp in Chinese locale', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const score: PriorityScore = {
        ...mockPriorityScore,
        createdAt: testDate,
      };
      render(<PriorityCard score={score} showDetails={true} />);

      // Check if timestamp is displayed
      const timestampText = screen.getByText(/分析时间:/);
      expect(timestampText).toBeInTheDocument();
    });
  });

  describe('Different Score Values', () => {
    it('should handle score of 100', () => {
      const perfectScore: PriorityScore = {
        ...mockPriorityScore,
        score: 100,
      };
      render(<PriorityCard score={perfectScore} />);
      expect(screen.getByText('100/100')).toBeInTheDocument();
    });

    it('should handle score of 0', () => {
      const zeroScore: PriorityScore = {
        ...mockPriorityScore,
        score: 0,
      };
      render(<PriorityCard score={zeroScore} />);
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('should handle decimal scores', () => {
      const decimalScore: PriorityScore = {
        ...mockPriorityScore,
        score: 45.5,
      };
      render(<PriorityCard score={decimalScore} />);
      expect(screen.getByText('45.5/100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<PriorityCard score={mockPriorityScore} showDetails={true} />);

      expect(screen.getByRole('button', { name: /收起详情|重新分析/ })).toBeInTheDocument();
    });

    it('should have proper text contrast in color boxes', () => {
      const criticalScore: PriorityScore = {
        ...mockPriorityScore,
        level: 'critical',
      };
      const { container } = render(<PriorityCard score={criticalScore} />);

      const colorBox = container.querySelector('.bg-red-600.text-white');
      expect(colorBox).toBeInTheDocument();
    });
  });
});
