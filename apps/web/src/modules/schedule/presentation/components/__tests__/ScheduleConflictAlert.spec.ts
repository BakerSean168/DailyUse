import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ScheduleConflictAlert from '../ScheduleConflictAlert.vue';
import type { ScheduleTaskClientDTO, ScheduleClientDTO, ConflictDetectionResult } from '@dailyuse/contracts/schedule';

// Create Vuetify instance for testing
const vuetify = createVuetify({
  components,
  directives,
});

// Test fixtures
const mockConflictResult: ConflictDetectionResult = {
  hasConflict: true,
  conflicts: [
    {
      scheduleUuid: 'schedule-1',
      scheduleTitle: 'Existing Meeting',
      overlapStart: 1000,
      overlapEnd: 1800,
      overlapDuration: 30,
      severity: 'severe',
    },
    {
      scheduleUuid: 'schedule-2',
      scheduleTitle: 'Team Standup',
      overlapStart: 1500,
      overlapEnd: 2400,
      overlapDuration: 15,
      severity: 'moderate',
    },
  ],
  suggestions: [
    {
      type: 'move_earlier',
      newStartTime: 500,
      newEndTime: 1000,
      description: 'Move to available slot before conflicts',
    },
    {
      type: 'move_later',
      newStartTime: 2500,
      newEndTime: 3000,
      description: 'Move to available slot after conflicts',
    },
  ],
};

const mockNoConflictResult: ConflictDetectionResult = {
  hasConflict: false,
  conflicts: [],
  suggestions: [],
};

describe('ScheduleConflictAlert', () => {
  const mountComponent = (props: any = {}) => {
    return mount(ScheduleConflictAlert, {
      props: {
        conflicts: null,
        isLoading: false,
        error: null,
        ...props,
      },
      global: {
        plugins: [vuetify],
      },
    });
  };

  describe('Loading State', () => {
    it('should show progress bar when loading', () => {
      const wrapper = mountComponent({ isLoading: true });
      const progressBar = wrapper.findComponent({ name: 'VProgressLinear' });
      expect(progressBar.exists()).toBe(true);
    });

    it('should not show progress bar when not loading', () => {
      const wrapper = mountComponent({ isLoading: false });
      const progressBar = wrapper.findComponent({ name: 'VProgressLinear' });
      expect(progressBar.exists()).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should display error alert when error prop is set', () => {
      const errorMessage = 'Failed to detect conflicts';
      const wrapper = mountComponent({ error: errorMessage });
      
      const alerts = wrapper.findAllComponents({ name: 'VAlert' });
      const errorAlert = alerts.find(a => a.props('type') === 'error');
      
      expect(errorAlert?.exists()).toBe(true);
      expect(errorAlert?.text()).toContain(errorMessage);
    });

    it('should not display error alert when error is null', () => {
      const wrapper = mountComponent({ error: null });
      
      const alerts = wrapper.findAllComponents({ name: 'VAlert' });
      const errorAlert = alerts.find(a => a.props('type') === 'error' && a.text().includes('Failed'));
      
      expect(errorAlert?.exists()).toBe(false);
    });
  });

  describe('No Conflicts State', () => {
    it('should display success alert when no conflicts detected', () => {
      const wrapper = mountComponent({ 
        conflicts: mockNoConflictResult,
        isLoading: false,
      });
      
      const alerts = wrapper.findAllComponents({ name: 'VAlert' });
      const successAlert = alerts.find(a => a.props('type') === 'success');
      
      expect(successAlert?.exists()).toBe(true);
      expect(successAlert?.text()).toContain('无时间冲突');
    });

    it('should not display success alert when conflicts exist', () => {
      const wrapper = mountComponent({ 
        conflicts: mockConflictResult,
        isLoading: false,
      });
      
      const alerts = wrapper.findAllComponents({ name: 'VAlert' });
      const successAlert = alerts.find(a => a.text().includes('无时间冲突'));
      
      expect(successAlert?.exists()).toBe(false);
    });
  });

  describe('Conflicts Display', () => {
    it('should display conflict count', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const text = wrapper.text();
      expect(text).toContain('检测到 2 个时间冲突');
    });

    it('should display all conflicting schedules', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const text = wrapper.text();
      expect(text).toContain('Existing Meeting');
      expect(text).toContain('Team Standup');
    });

    it('should display overlap duration for each conflict', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const text = wrapper.text();
      expect(text).toContain('30 分钟');
      expect(text).toContain('15 分钟');
    });

    it('should display severity chips with correct colors', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const chips = wrapper.findAllComponents({ name: 'VChip' });
      
      // Should have severity chips for each conflict
      expect(chips.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Helper Functions - Duration Formatting', () => {
    it('should format minutes correctly (less than 60)', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      const vm = wrapper.vm as any;
      
      expect(vm.formatDuration(30)).toBe('30 分钟');
      expect(vm.formatDuration(45)).toBe('45 分钟');
    });

    it('should format hours correctly', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      const vm = wrapper.vm as any;
      
      expect(vm.formatDuration(60)).toBe('1 小时');
      expect(vm.formatDuration(120)).toBe('2 小时');
    });

    it('should format hours and minutes correctly', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      const vm = wrapper.vm as any;
      
      expect(vm.formatDuration(90)).toBe('1 小时 30 分钟');
      expect(vm.formatDuration(145)).toBe('2 小时 25 分钟');
    });
  });

  describe('Helper Functions - Severity', () => {
    it('should return correct severity color', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      const vm = wrapper.vm as any;
      
      expect(vm.getSeverityColor('severe')).toBe('error');
      expect(vm.getSeverityColor('moderate')).toBe('warning');
      expect(vm.getSeverityColor('minor')).toBe('info');
    });

    it('should return correct severity label', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      const vm = wrapper.vm as any;
      
      expect(vm.getSeverityLabel('severe')).toBe('严重');
      expect(vm.getSeverityLabel('moderate')).toBe('中');
      expect(vm.getSeverityLabel('minor')).toBe('轻微');
    });
  });

  describe('Suggestions Display', () => {
    it('should display suggestion buttons when suggestions exist', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const buttons = wrapper.findAllComponents({ name: 'VBtn' });
      
      // Should have buttons for each suggestion + ignore button
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should format suggestion labels correctly', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const text = wrapper.text();
      // Should show formatted time or action
      expect(text).toContain('建议调整');
    });

    it('should display ignore conflict button', () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      const text = wrapper.text();
      expect(text).toContain('忽略冲突');
    });
  });

  describe('Event Emissions', () => {
    it('should emit apply-suggestion event when suggestion button clicked', async () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      // Find first suggestion button (not the ignore button)
      const buttons = wrapper.findAllComponents({ name: 'VBtn' });
      const suggestionButton = buttons[0]; // First button should be a suggestion
      
      await suggestionButton.trigger('click');
      
      expect(wrapper.emitted('apply-suggestion')).toBeTruthy();
      expect(wrapper.emitted('apply-suggestion')?.[0]).toEqual([
        mockConflictResult.suggestions[0],
      ]);
    });

    it('should emit ignore-conflict event when ignore button clicked', async () => {
      const wrapper = mountComponent({ conflicts: mockConflictResult });
      
      // Find ignore button (should be the last button)
      const buttons = wrapper.findAllComponents({ name: 'VBtn' });
      const ignoreButton = buttons[buttons.length - 1];
      
      await ignoreButton.trigger('click');
      
      expect(wrapper.emitted('ignore-conflict')).toBeTruthy();
      expect(wrapper.emitted('ignore-conflict')?.[0]).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null conflicts prop', () => {
      const wrapper = mountComponent({ conflicts: null });
      
      expect(wrapper.exists()).toBe(true);
      // Should not show any conflict-related content
      expect(wrapper.text()).not.toContain('检测到');
    });

    it('should handle empty conflicts array', () => {
      const emptyResult: ConflictDetectionResult = {
        hasConflict: false,
        conflicts: [],
        suggestions: [],
      };
      
      const wrapper = mountComponent({ conflicts: emptyResult });
      
      expect(wrapper.text()).toContain('无时间冲突');
    });

    it('should handle conflicts without suggestions', () => {
      const noSuggestionsResult: ConflictDetectionResult = {
        ...mockConflictResult,
        suggestions: [],
      };
      
      const wrapper = mountComponent({ conflicts: noSuggestionsResult });
      
      const text = wrapper.text();
      expect(text).toContain('检测到');
      expect(text).toContain('时间冲突');
      expect(text).not.toContain('建议调整');
    });

    it('should handle single conflict', () => {
      const singleConflictResult: ConflictDetectionResult = {
        hasConflict: true,
        conflicts: [mockConflictResult.conflicts[0]],
        suggestions: mockConflictResult.suggestions,
      };
      
      const wrapper = mountComponent({ conflicts: singleConflictResult });
      
      expect(wrapper.text()).toContain('时间冲突');
      expect(wrapper.text()).toContain('Existing Meeting');
      expect(wrapper.text()).not.toContain('Team Standup');
    });
  });

  describe('Reactivity', () => {
    it('should update when conflicts prop changes', async () => {
      const wrapper = mountComponent({ conflicts: null });
      
      expect(wrapper.text()).not.toContain('检测到');
      
      await wrapper.setProps({ conflicts: mockConflictResult });
      
      expect(wrapper.text()).toContain('检测到 2 个时间冲突');
    });

    it('should update when loading state changes', async () => {
      const wrapper = mountComponent({ isLoading: false });
      
      let progressBar = wrapper.findComponent({ name: 'VProgressLinear' });
      expect(progressBar.exists()).toBe(false);
      
      await wrapper.setProps({ isLoading: true });
      
      progressBar = wrapper.findComponent({ name: 'VProgressLinear' });
      expect(progressBar.exists()).toBe(true);
    });

    it('should update when error changes', async () => {
      const wrapper = mountComponent({ error: null });
      
      expect(wrapper.text()).not.toContain('Failed');
      
      await wrapper.setProps({ error: 'Failed to detect conflicts' });
      
      expect(wrapper.text()).toContain('Failed to detect conflicts');
    });
  });
});

