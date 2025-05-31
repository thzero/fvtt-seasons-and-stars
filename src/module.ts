/**
 * Seasons & Stars - Main Module Entry Point
 * A clean calendar and timekeeping module for Foundry VTT v13+
 */

// Import styles
import './styles/seasons-and-stars.scss';

import { CalendarManager } from './core/calendar-manager';
import { CalendarDate } from './core/calendar-date';
import { CalendarLocalization } from './core/calendar-localization';
import { CalendarWidget } from './ui/calendar-widget';
import { CalendarMiniWidget } from './ui/calendar-mini-widget';
import { CalendarSelectionDialog } from './ui/calendar-selection-dialog';
import { SeasonsStarsSceneControls } from './ui/scene-controls';
import type { SeasonsStarsAPI, SimpleCalendarCompatAPI } from './types/foundry-extensions';
import type { CalendarDate as ICalendarDate, DateFormatOptions } from './types/calendar';

// Module instance
let calendarManager: CalendarManager;

/**
 * Module initialization
 */
Hooks.once('init', async () => {
  console.log('Seasons & Stars | Initializing module');
  
  // Register module settings
  registerSettings();
  
  // Initialize calendar manager
  calendarManager = new CalendarManager();
  
  console.log('Seasons & Stars | Module initialized');
});

/**
 * Setup after Foundry is ready
 */
Hooks.once('ready', async () => {
  console.log('Seasons & Stars | Setting up module');
  
  // Load calendars first (without reading settings)
  await calendarManager.loadBuiltInCalendars();
  
  // Register calendar-specific settings now that calendars are loaded
  registerCalendarSettings();
  
  // Complete calendar manager initialization (read settings and set active calendar)
  await calendarManager.completeInitialization();
  
  // Expose API
  setupAPI();
  
  // Setup Simple Calendar compatibility if enabled
  if (game.settings?.get('seasons-and-stars', 'simpleCalendarCompat')) {
    setupSimpleCalendarCompatibility();
  }

  // Register UI component hooks
  CalendarWidget.registerHooks();
  CalendarMiniWidget.registerHooks();
  CalendarMiniWidget.registerSmallTimeIntegration();
  SeasonsStarsSceneControls.registerControls();
  SeasonsStarsSceneControls.registerMacros();

  // Show widget if enabled in settings
  if (game.settings?.get('seasons-and-stars', 'showTimeWidget')) {
    CalendarWidget.show();
  }
  
  console.log('Seasons & Stars | Module ready');
});

/**
 * Register module settings
 */
function registerSettings(): void {
  if (!game.settings) return;

  game.settings.register('seasons-and-stars', 'simpleCalendarCompat', {
    name: 'Simple Calendar Compatibility',
    hint: 'Enable Simple Calendar API compatibility for other modules',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value: boolean) => {
      if (value) {
        setupSimpleCalendarCompatibility();
      } else {
        removeSimpleCalendarCompatibility();
      }
    }
  });

  game.settings.register('seasons-and-stars', 'showTimeWidget', {
    name: 'Show Time Widget',
    hint: 'Display a small time widget on the UI',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  });
}

/**
 * Register calendar-specific settings after calendars are loaded
 */
function registerCalendarSettings(): void {
  if (!game.settings) return;

  // Get available calendars and create choices
  const calendars = calendarManager.getAllCalendars();
  const choices = CalendarLocalization.createCalendarChoices(calendars);
  
  game.settings.register('seasons-and-stars', 'activeCalendar', {
    name: 'SEASONS_STARS.settings.active_calendar',
    hint: 'SEASONS_STARS.settings.active_calendar_hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'gregorian',
    choices: choices,
    onChange: async (value: string) => {
      if (calendarManager) {
        await calendarManager.setActiveCalendar(value);
      }
    }
  });
}

/**
 * Setup the main Seasons & Stars API
 */
function setupAPI(): void {
  const api: SeasonsStarsAPI = {
    getCurrentDate: (calendarId?: string): ICalendarDate | null => {
      if (calendarId) {
        // Get date from specific calendar
        const calendar = calendarManager.getCalendar(calendarId);
        const engine = calendarManager.getActiveEngine();
        
        if (!calendar || !engine) {
          throw new Error(`Calendar not found: ${calendarId}`);
        }
        
        const worldTime = game.time?.worldTime || 0;
        return engine.worldTimeToDate(worldTime);
      }
      
      // Get date from active calendar
      const currentDate = calendarManager.getCurrentDate();
      if (!currentDate) return null;
      return currentDate.toObject();
    },

    advanceDays: async (days: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceDays(days);
    },

    advanceHours: async (hours: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceHours(hours);
    },

    advanceMinutes: async (minutes: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceMinutes(minutes);
    },

    advanceWeeks: async (weeks: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceWeeks(weeks);
    },

    advanceMonths: async (months: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceMonths(months);
    },

    advanceYears: async (years: number, calendarId?: string): Promise<void> => {
      if (calendarId) {
        throw new Error('Advancing specific calendar time not yet implemented');
      }
      
      await calendarManager.advanceYears(years);
    },

    formatDate: (date: ICalendarDate, options?: DateFormatOptions): string => {
      const activeCalendar = calendarManager.getActiveCalendar();
      
      if (!activeCalendar) {
        throw new Error('No active calendar set');
      }
      
      const calendarDate = new CalendarDate(date, activeCalendar);
      return calendarDate.format(options);
    },

    dateToWorldTime: (date: ICalendarDate, calendarId?: string): number => {
      const engine = calendarId ? 
        calendarManager.engines?.get(calendarId) : 
        calendarManager.getActiveEngine();
      
      if (!engine) {
        throw new Error(`No engine available for calendar: ${calendarId || 'active'}`);
      }
      
      return engine.dateToWorldTime(date);
    },

    worldTimeToDate: (timestamp: number, calendarId?: string): ICalendarDate => {
      const engine = calendarId ? 
        calendarManager.engines?.get(calendarId) : 
        calendarManager.getActiveEngine();
      
      if (!engine) {
        throw new Error(`No engine available for calendar: ${calendarId || 'active'}`);
      }
      
      return engine.worldTimeToDate(timestamp);
    },

    getActiveCalendar: () => {
      return calendarManager.getActiveCalendar();
    },

    setActiveCalendar: async (calendarId: string): Promise<void> => {
      await calendarManager.setActiveCalendar(calendarId);
    },

    getAvailableCalendars: (): string[] => {
      return calendarManager.getAvailableCalendars();
    },

    loadCalendar: (data: any): void => {
      calendarManager.loadCalendar(data);
    }
  };

  // Expose API to global game object
  if (game) {
    game.seasonsStars = {
      api,
      manager: calendarManager
    };
  }

  // Expose API to window for debugging
  (window as any).SeasonsStars = {
    api,
    manager: calendarManager,
    CalendarWidget,
    CalendarMiniWidget,
    CalendarSelectionDialog
  };

  console.log('Seasons & Stars | API exposed');
}

/**
 * Setup Simple Calendar compatibility layer
 */
function setupSimpleCalendarCompatibility(): void {
  if ((window as any).SimpleCalendar) {
    console.log('Seasons & Stars | Simple Calendar already exists, skipping compatibility layer');
    return;
  }

  const compatAPI: SimpleCalendarCompatAPI = {
    getCurrentDate: () => {
      const currentDate = calendarManager.getCurrentDate();
      
      if (!currentDate) return null;
      
      // Convert to Simple Calendar format
      return {
        year: currentDate.year,
        month: currentDate.month - 1, // Simple Calendar uses 0-based months
        day: currentDate.day - 1,     // Simple Calendar uses 0-based days
        hour: currentDate.time?.hour || 0,
        minute: currentDate.time?.minute || 0,
        seconds: currentDate.time?.second || 0,
        weekday: currentDate.weekday
      };
    },

    advanceDays: async (days: number): Promise<void> => {
      await calendarManager.advanceDays(days);
    },

    formatDateTime: (date: any, format?: string): string => {
      if (!date) return '';
      
      // Convert from Simple Calendar format to S&S format
      const ssDate: ICalendarDate = {
        year: date.year,
        month: (date.month || 0) + 1, // Convert from 0-based
        day: (date.day || 0) + 1,     // Convert from 0-based
        weekday: date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.seconds || 0
        }
      };
      
      return game.seasonsStars?.api.formatDate(ssDate) || '';
    },

    dateToTimestamp: (date: any): number => {
      if (!date) return 0;
      
      // Convert from Simple Calendar format
      const ssDate: ICalendarDate = {
        year: date.year,
        month: (date.month || 0) + 1,
        day: (date.day || 0) + 1,
        weekday: date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.seconds || 0
        }
      };
      
      return game.seasonsStars?.api.dateToWorldTime(ssDate) || 0;
    },

    timestampToDate: (timestamp: number): any => {
      const ssDate = game.seasonsStars?.api.worldTimeToDate(timestamp);
      
      if (!ssDate) return null;
      
      // Convert to Simple Calendar format
      return {
        year: ssDate.year,
        month: ssDate.month - 1,
        day: ssDate.day - 1,
        hour: ssDate.time?.hour || 0,
        minute: ssDate.time?.minute || 0,
        seconds: ssDate.time?.second || 0,
        weekday: ssDate.weekday
      };
    },

    addMonths: (date: any, months: number): any => {
      const engine = calendarManager.getActiveEngine();
      
      if (!engine || !date) return date;
      
      // Convert to S&S format, add months, convert back
      const ssDate: ICalendarDate = {
        year: date.year,
        month: (date.month || 0) + 1,
        day: (date.day || 0) + 1,
        weekday: date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.seconds || 0
        }
      };
      
      const newDate = engine.addMonths(ssDate, months);
      
      return {
        year: newDate.year,
        month: newDate.month - 1,
        day: newDate.day - 1,
        hour: newDate.time?.hour || 0,
        minute: newDate.time?.minute || 0,
        seconds: newDate.time?.second || 0,
        weekday: newDate.weekday
      };
    },

    addYears: (date: any, years: number): any => {
      const engine = calendarManager.getActiveEngine();
      
      if (!engine || !date) return date;
      
      // Convert to S&S format, add years, convert back
      const ssDate: ICalendarDate = {
        year: date.year,
        month: (date.month || 0) + 1,
        day: (date.day || 0) + 1,
        weekday: date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.seconds || 0
        }
      };
      
      const newDate = engine.addYears(ssDate, years);
      
      return {
        year: newDate.year,
        month: newDate.month - 1,
        day: newDate.day - 1,
        hour: newDate.time?.hour || 0,
        minute: newDate.time?.minute || 0,
        seconds: newDate.time?.second || 0,
        weekday: newDate.weekday
      };
    },

    setTime: async (time: number): Promise<void> => {
      if (game.user?.isGM) {
        await game.time?.advance(time - (game.time?.worldTime || 0));
      }
    }
  };

  // Expose Simple Calendar compatibility API
  (window as any).SimpleCalendar = {
    api: compatAPI,
    Hooks: {} // Empty hooks object for compatibility
  };

  console.log('Seasons & Stars | Simple Calendar compatibility layer active');
}

/**
 * Remove Simple Calendar compatibility layer
 */
function removeSimpleCalendarCompatibility(): void {
  if ((window as any).SimpleCalendar) {
    delete (window as any).SimpleCalendar;
    console.log('Seasons & Stars | Simple Calendar compatibility layer removed');
  }
}

/**
 * Module cleanup
 */
Hooks.once('destroy', () => {
  console.log('Seasons & Stars | Module shutting down');
  
  // Clean up compatibility layer
  removeSimpleCalendarCompatibility();
  
  // Clean up global references
  if (game.seasonsStars) {
    delete game.seasonsStars;
  }
  
  if ((window as any).SeasonsStars) {
    delete (window as any).SeasonsStars;
  }
});