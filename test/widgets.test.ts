/**
 * Tests for Widget API methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalendarWidget } from '../src/ui/calendar-widget';
import { CalendarMiniWidget } from '../src/ui/calendar-mini-widget';
import { CalendarGridWidget } from '../src/ui/calendar-grid-widget';

// Mock Foundry globals
globalThis.game = {
  user: { isGM: true },
  settings: {
    get: vi.fn().mockReturnValue({}),
    set: vi.fn(),
  },
} as any;

globalThis.ui = {
  notifications: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
} as any;

globalThis.Hooks = {
  on: vi.fn(),
  call: vi.fn(),
  callAll: vi.fn(),
} as any;

// Mock calendar data
const mockCalendar = {
  id: 'test-calendar',
  translations: { en: { label: 'Test Calendar' } },
  year: { epoch: 2024, currentYear: 2024, prefix: '', suffix: '', startDay: 0 },
  months: [{ name: 'January', days: 31 }],
  weekdays: [{ name: 'Monday' }],
  time: { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
} as any;

const mockDate = {
  year: 2024,
  month: 1,
  day: 1,
  weekday: 0,
} as any;

describe('CalendarWidget API', () => {
  let widget: CalendarWidget;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create widget instance
    widget = new CalendarWidget(mockCalendar, mockDate);
  });

  describe('addSidebarButton', () => {
    it('should add a sidebar button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);

      expect(widget.hasSidebarButton('test-button')).toBe(true);
    });

    it('should store button with correct properties', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);

      const buttons = (widget as any).sidebarButtons;
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toEqual({
        name: 'test-button',
        icon: 'fas fa-star',
        tooltip: 'Test Button',
        callback,
      });
    });

    it('should not add duplicate buttons', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      widget.addSidebarButton('test-button', 'fas fa-heart', 'Another Button', callback);

      const buttons = (widget as any).sidebarButtons;
      expect(buttons).toHaveLength(1);
      expect(buttons[0].icon).toBe('fas fa-star'); // Should keep original
    });
  });

  describe('removeSidebarButton', () => {
    it('should remove existing button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      expect(widget.hasSidebarButton('test-button')).toBe(true);

      widget.removeSidebarButton('test-button');
      expect(widget.hasSidebarButton('test-button')).toBe(false);
    });

    it('should handle removing non-existent button', () => {
      widget.removeSidebarButton('non-existent');
      // Should not throw error
      expect(widget.hasSidebarButton('non-existent')).toBe(false);
    });

    it('should only remove specified button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('button1', 'fas fa-star', 'Button 1', callback);
      widget.addSidebarButton('button2', 'fas fa-heart', 'Button 2', callback);

      widget.removeSidebarButton('button1');

      expect(widget.hasSidebarButton('button1')).toBe(false);
      expect(widget.hasSidebarButton('button2')).toBe(true);
    });
  });

  describe('hasSidebarButton', () => {
    it('should return false for non-existent button', () => {
      expect(widget.hasSidebarButton('non-existent')).toBe(false);
    });

    it('should return true for existing button', () => {
      const callback = vi.fn();
      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);

      expect(widget.hasSidebarButton('test-button')).toBe(true);
    });

    it('should return false after button is removed', () => {
      const callback = vi.fn();
      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      widget.removeSidebarButton('test-button');

      expect(widget.hasSidebarButton('test-button')).toBe(false);
    });
  });
});

describe('CalendarMiniWidget API', () => {
  let widget: CalendarMiniWidget;

  beforeEach(() => {
    vi.clearAllMocks();
    widget = new CalendarMiniWidget(mockCalendar, mockDate);
  });

  describe('addSidebarButton', () => {
    it('should add a sidebar button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);

      expect(widget.hasSidebarButton('test-button')).toBe(true);
    });

    it('should not add duplicate buttons', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      widget.addSidebarButton('test-button', 'fas fa-heart', 'Another Button', callback);

      const buttons = (widget as any).sidebarButtons;
      expect(buttons).toHaveLength(1);
    });
  });

  describe('removeSidebarButton', () => {
    it('should remove existing button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      widget.removeSidebarButton('test-button');

      expect(widget.hasSidebarButton('test-button')).toBe(false);
    });

    it('should handle removing non-existent button gracefully', () => {
      // Should not throw
      widget.removeSidebarButton('non-existent');
      expect(widget.hasSidebarButton('non-existent')).toBe(false);
    });
  });

  describe('hasSidebarButton', () => {
    it('should correctly identify existing buttons', () => {
      const callback = vi.fn();

      expect(widget.hasSidebarButton('test-button')).toBe(false);

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      expect(widget.hasSidebarButton('test-button')).toBe(true);

      widget.removeSidebarButton('test-button');
      expect(widget.hasSidebarButton('test-button')).toBe(false);
    });
  });
});

describe('CalendarGridWidget API', () => {
  let widget: CalendarGridWidget;

  beforeEach(() => {
    vi.clearAllMocks();
    widget = new CalendarGridWidget(mockCalendar, mockDate);
  });

  describe('addSidebarButton', () => {
    it('should add a sidebar button', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);

      // Check internal storage
      const buttons = (widget as any).sidebarButtons;
      expect(buttons).toHaveLength(1);
      expect(buttons[0].name).toBe('test-button');
    });

    it('should prevent duplicate buttons', () => {
      const callback = vi.fn();

      widget.addSidebarButton('test-button', 'fas fa-star', 'Test Button', callback);
      widget.addSidebarButton('test-button', 'fas fa-heart', 'Another Button', callback);

      const buttons = (widget as any).sidebarButtons;
      expect(buttons).toHaveLength(1);
    });
  });
});
