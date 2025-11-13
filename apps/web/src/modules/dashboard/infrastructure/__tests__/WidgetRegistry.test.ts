import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WidgetRegistry, widgetRegistry } from '../WidgetRegistry';
import type { WidgetMetadata } from '../types/WidgetMetadata';
import { defineComponent } from 'vue';

// Mock 组件
const MockWidget = defineComponent({
  name: 'MockWidget',
  template: '<div>Mock Widget</div>',
});

describe('WidgetRegistry', () => {
  let registry: WidgetRegistry;

  beforeEach(() => {
    // 每次测试前清空注册表
    registry = WidgetRegistry.getInstance();
    registry.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WidgetRegistry.getInstance();
      const instance2 = WidgetRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export default instance', () => {
      expect(widgetRegistry).toBeInstanceOf(WidgetRegistry);
    });
  });

  describe('registerWidget', () => {
    it('should register a widget successfully', () => {
      const metadata: WidgetMetadata = {
        id: 'test-widget',
        name: 'Test Widget',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      registry.registerWidget(metadata);

      expect(registry.count).toBe(1);
      expect(registry.getWidget('test-widget')).toEqual(metadata);
    });

    it('should throw error if required fields are missing', () => {
      const invalidMetadata = {
        id: '',
        name: 'Test',
        component: MockWidget,
      } as WidgetMetadata;

      expect(() => registry.registerWidget(invalidMetadata)).toThrow();
    });

    it('should warn and overwrite if widget ID already exists', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metadata1: WidgetMetadata = {
        id: 'duplicate',
        name: 'First',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'small',
      };

      const metadata2: WidgetMetadata = {
        id: 'duplicate',
        name: 'Second',
        component: MockWidget,
        defaultVisible: false,
        defaultOrder: 2,
        defaultSize: 'large',
      };

      registry.registerWidget(metadata1);
      registry.registerWidget(metadata2);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
      expect(registry.getWidget('duplicate')?.name).toBe('Second');
      expect(registry.count).toBe(1);

      consoleWarnSpy.mockRestore();
    });

    it('should register widget with optional fields', () => {
      const metadata: WidgetMetadata = {
        id: 'rich-widget',
        name: 'Rich Widget',
        description: 'A widget with all fields',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'large',
        icon: 'i-heroicons-star',
        category: 'premium',
      };

      registry.registerWidget(metadata);

      const widget = registry.getWidget('rich-widget');
      expect(widget?.description).toBe('A widget with all fields');
      expect(widget?.icon).toBe('i-heroicons-star');
      expect(widget?.category).toBe('premium');
    });
  });

  describe('getWidget', () => {
    it('should return null if widget does not exist', () => {
      expect(registry.getWidget('non-existent')).toBeNull();
    });

    it('should return widget metadata if exists', () => {
      const metadata: WidgetMetadata = {
        id: 'existing-widget',
        name: 'Existing',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      registry.registerWidget(metadata);

      const widget = registry.getWidget('existing-widget');
      expect(widget).toEqual(metadata);
    });
  });

  describe('getAllWidgets', () => {
    it('should return empty array if no widgets registered', () => {
      expect(registry.getAllWidgets()).toEqual([]);
    });

    it('should return all widgets sorted by defaultOrder', () => {
      const widget1: WidgetMetadata = {
        id: 'widget-3',
        name: 'Third',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 3,
        defaultSize: 'small',
      };

      const widget2: WidgetMetadata = {
        id: 'widget-1',
        name: 'First',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      const widget3: WidgetMetadata = {
        id: 'widget-2',
        name: 'Second',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 2,
        defaultSize: 'large',
      };

      registry.registerWidget(widget1);
      registry.registerWidget(widget2);
      registry.registerWidget(widget3);

      const allWidgets = registry.getAllWidgets();

      expect(allWidgets).toHaveLength(3);
      expect(allWidgets[0].id).toBe('widget-1');
      expect(allWidgets[1].id).toBe('widget-2');
      expect(allWidgets[2].id).toBe('widget-3');
    });
  });

  describe('hasWidget', () => {
    it('should return false if widget does not exist', () => {
      expect(registry.hasWidget('non-existent')).toBe(false);
    });

    it('should return true if widget exists', () => {
      const metadata: WidgetMetadata = {
        id: 'test-widget',
        name: 'Test',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      registry.registerWidget(metadata);

      expect(registry.hasWidget('test-widget')).toBe(true);
    });
  });

  describe('unregisterWidget', () => {
    it('should return false and warn if widget does not exist', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = registry.unregisterWidget('non-existent');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));

      consoleWarnSpy.mockRestore();
    });

    it('should remove widget successfully', () => {
      const metadata: WidgetMetadata = {
        id: 'removable',
        name: 'Removable',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'small',
      };

      registry.registerWidget(metadata);
      expect(registry.count).toBe(1);

      const result = registry.unregisterWidget('removable');

      expect(result).toBe(true);
      expect(registry.count).toBe(0);
      expect(registry.getWidget('removable')).toBeNull();
    });
  });

  describe('getWidgetsByCategory', () => {
    it('should return empty array if no widgets match category', () => {
      const metadata: WidgetMetadata = {
        id: 'test',
        name: 'Test',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
        category: 'stats',
      };

      registry.registerWidget(metadata);

      expect(registry.getWidgetsByCategory('other')).toEqual([]);
    });

    it('should return widgets matching category', () => {
      const widget1: WidgetMetadata = {
        id: 'stats-1',
        name: 'Stats 1',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'small',
        category: 'statistics',
      };

      const widget2: WidgetMetadata = {
        id: 'stats-2',
        name: 'Stats 2',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 2,
        defaultSize: 'medium',
        category: 'statistics',
      };

      const widget3: WidgetMetadata = {
        id: 'productivity-1',
        name: 'Productivity',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 3,
        defaultSize: 'large',
        category: 'productivity',
      };

      registry.registerWidget(widget1);
      registry.registerWidget(widget2);
      registry.registerWidget(widget3);

      const statsWidgets = registry.getWidgetsByCategory('statistics');

      expect(statsWidgets).toHaveLength(2);
      expect(statsWidgets[0].id).toBe('stats-1');
      expect(statsWidgets[1].id).toBe('stats-2');
    });

    it('should handle widgets without category', () => {
      const widget: WidgetMetadata = {
        id: 'no-category',
        name: 'No Category',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      registry.registerWidget(widget);

      expect(registry.getWidgetsByCategory('any')).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all widgets', () => {
      const metadata: WidgetMetadata = {
        id: 'test',
        name: 'Test',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'medium',
      };

      registry.registerWidget(metadata);
      expect(registry.count).toBe(1);

      registry.clear();

      expect(registry.count).toBe(0);
      expect(registry.getAllWidgets()).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return 0 initially', () => {
      expect(registry.count).toBe(0);
    });

    it('should return correct count after registrations', () => {
      const metadata1: WidgetMetadata = {
        id: 'widget-1',
        name: 'Widget 1',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 1,
        defaultSize: 'small',
      };

      const metadata2: WidgetMetadata = {
        id: 'widget-2',
        name: 'Widget 2',
        component: MockWidget,
        defaultVisible: true,
        defaultOrder: 2,
        defaultSize: 'medium',
      };

      registry.registerWidget(metadata1);
      expect(registry.count).toBe(1);

      registry.registerWidget(metadata2);
      expect(registry.count).toBe(2);

      registry.unregisterWidget('widget-1');
      expect(registry.count).toBe(1);
    });
  });
});
