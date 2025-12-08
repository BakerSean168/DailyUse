/**
 * TimeEstimationCard Component - Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeEstimationCard } from '../TimeEstimationCard';
import type { TimeEstimate } from '@dailyuse/contracts/goal';

describe('TimeEstimationCard', () => {
  const mockEstimate: TimeEstimate = {
    taskId: 'task-123',
    taskTitle: 'Test Task',
    estimatedMinutes: 60,
    confidenceScore: 0.8,
    reasoning: 'Based on task description and historical data',
    adjustedMinutes: 66,
    adjustmentReason: 'Adjusted by +10% based on user efficiency',
  };

  describe('Display', () => {
    it('should render estimation card with title', () => {
      render(<TimeEstimationCard estimate={mockEstimate} />);
      expect(screen.getByText('时间预估')).toBeTruthy();
    });

    it('should display estimated minutes', () => {
      render(<TimeEstimationCard estimate={mockEstimate} />);
      expect(screen.getByText('60')).toBeTruthy();
      expect(screen.getByText('分钟')).toBeTruthy();
    });

    it('should display confidence score as percentage', () => {
      render(<TimeEstimationCard estimate={mockEstimate} />);
      expect(screen.getByText('80%')).toBeTruthy();
    });

    it('should display reasoning text', () => {
      render(<TimeEstimationCard estimate={mockEstimate} />);
      expect(
        screen.getByText('Based on task description and historical data')
      ).toBeTruthy();
    });

    it('should show high confidence label for score >= 0.8', () => {
      render(<TimeEstimationCard estimate={mockEstimate} />);
      expect(screen.getByText('高置信度')).toBeTruthy();
    });

    it('should show adjustment details when available', () => {
      render(<TimeEstimationCard estimate={mockEstimate} showDetails={true} />);
      expect(screen.getByText(/历史数据调整/)).toBeTruthy();
      expect(screen.getByText('基础估算: 60分钟')).toBeTruthy();
    });

    it('should not show adjustment details when showDetails is false', () => {
      render(
        <TimeEstimationCard estimate={mockEstimate} showDetails={false} />
      );
      expect(screen.queryByText(/历史数据调整/)).toBeFalsy();
    });
  });

  describe('Editing', () => {
    it('should allow editing estimated minutes', async () => {
      const onEstimateChange = vi.fn();
      const { rerender } = render(
        <TimeEstimationCard
          estimate={mockEstimate}
          onEstimateChange={onEstimateChange}
        />
      );

      // Click to edit
      const timeDisplay = screen.getByText('60');
      fireEvent.click(timeDisplay);

      // Change value
      const input = screen.getByDisplayValue('60') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '90' } });

      // Save
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onEstimateChange).toHaveBeenCalledWith(90);
      });
    });

    it('should cancel editing when cancel button clicked', async () => {
      const onEstimateChange = vi.fn();
      render(
        <TimeEstimationCard
          estimate={mockEstimate}
          onEstimateChange={onEstimateChange}
        />
      );

      // Click to edit
      const timeDisplay = screen.getByText('60');
      fireEvent.click(timeDisplay);

      // Change value
      const input = screen.getByDisplayValue('60') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '90' } });

      // Cancel
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      // Value should revert
      expect(onEstimateChange).not.toHaveBeenCalled();
    });

    it('should not call onEstimateChange with invalid input', async () => {
      const onEstimateChange = vi.fn();
      render(
        <TimeEstimationCard
          estimate={mockEstimate}
          onEstimateChange={onEstimateChange}
        />
      );

      const timeDisplay = screen.getByText('60');
      fireEvent.click(timeDisplay);

      const input = screen.getByDisplayValue('60') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-10' } });

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      expect(onEstimateChange).not.toHaveBeenCalled();
    });
  });

  describe('Re-estimation', () => {
    it('should call onReEstimate when refresh button clicked', async () => {
      const onReEstimate = vi.fn().mockResolvedValue(undefined);
      render(
        <TimeEstimationCard
          estimate={mockEstimate}
          onReEstimate={onReEstimate}
        />
      );

      const refreshButton = screen.getByRole('button', { name: '' });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onReEstimate).toHaveBeenCalled();
      });
    });

    it('should show loading state during re-estimation', () => {
      const onReEstimate = vi.fn(() => new Promise(() => {})); // Never resolves
      const { rerender } = render(
        <TimeEstimationCard
          estimate={mockEstimate}
          onReEstimate={onReEstimate}
        />
      );

      const refreshButton = screen.getByRole('button');
      fireEvent.click(refreshButton);

      rerender(
        <TimeEstimationCard
          estimate={mockEstimate}
          loading={true}
          onReEstimate={onReEstimate}
        />
      );

      expect(screen.getByText('正在生成预估...')).toBeTruthy();
    });

    it('should disable refresh button when loading', () => {
      const onReEstimate = vi.fn();
      render(
        <TimeEstimationCard
          estimate={mockEstimate}
          loading={true}
          onReEstimate={onReEstimate}
        />
      );

      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toHaveAttribute('disabled');
    });
  });

  describe('Confidence Levels', () => {
    it('should show medium confidence for score 0.5-0.8', () => {
      const mediumEstimate: TimeEstimate = {
        ...mockEstimate,
        confidenceScore: 0.65,
      };

      render(<TimeEstimationCard estimate={mediumEstimate} />);
      expect(screen.getByText('65%')).toBeTruthy();
      expect(screen.getByText('中等置信度')).toBeTruthy();
    });

    it('should show low confidence for score < 0.5', () => {
      const lowEstimate: TimeEstimate = {
        ...mockEstimate,
        confidenceScore: 0.3,
      };

      render(<TimeEstimationCard estimate={lowEstimate} />);
      expect(screen.getByText('30%')).toBeTruthy();
      expect(screen.getByText('低置信度')).toBeTruthy();
    });
  });

  describe('Adjustment Calculation', () => {
    it('should show positive adjustment percentage', () => {
      const adjustedEstimate: TimeEstimate = {
        ...mockEstimate,
        estimatedMinutes: 100,
        adjustedMinutes: 110,
      };

      render(
        <TimeEstimationCard estimate={adjustedEstimate} showDetails={true} />
      );
      expect(screen.getByText(/\+10%/)).toBeTruthy();
    });

    it('should show negative adjustment percentage', () => {
      const adjustedEstimate: TimeEstimate = {
        ...mockEstimate,
        estimatedMinutes: 100,
        adjustedMinutes: 80,
      };

      render(
        <TimeEstimationCard estimate={adjustedEstimate} showDetails={true} />
      );
      expect(screen.getByText(/-20%/)).toBeTruthy();
    });
  });
});
