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
import { CalendarGridWidget } from './ui/calendar-grid-widget';
import { CalendarSelectionDialog } from './ui/calendar-selection-dialog';
import { SeasonsStarsSceneControls } from './ui/scene-controls';
import { SeasonsStarsIntegration } from './core/bridge-integration';
import type { SeasonsStarsAPI } from './types/foundry-extensions';
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
 * Early setup during setupGame - before other modules check for Simple Calendar
 */
Hooks.once('setupGame', () => {
  console.log('Seasons & Stars | Early setup during setupGame');
  
  // Simple Calendar compatibility is now set up during init
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
  

  // Register UI component hooks
  CalendarWidget.registerHooks();
  CalendarMiniWidget.registerHooks();
  CalendarGridWidget.registerHooks();
  CalendarMiniWidget.registerSmallTimeIntegration();
  SeasonsStarsSceneControls.registerControls();
  SeasonsStarsSceneControls.registerMacros();

  // Show widget if enabled in settings
  if (game.settings?.get('seasons-and-stars', 'showTimeWidget')) {
    CalendarWidget.show();
  }
  
  // Fire ready hook for compatibility modules
  Hooks.callAll('seasons-stars:ready', {
    manager: calendarManager,
    api: game.seasonsStars?.api
  });

  console.log('Seasons & Stars | Module ready');
});


/**
 * Register module settings
 */
function registerSettings(): void {
  if (!game.settings) return;


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
      manager: calendarManager,
      integration: SeasonsStarsIntegration.detect()
    };
  }

  // Expose API to window for debugging
  (window as any).SeasonsStars = {
    api,
    manager: calendarManager,
    integration: SeasonsStarsIntegration,
    CalendarWidget,
    CalendarMiniWidget,
    CalendarGridWidget,
    CalendarSelectionDialog
  };

  console.log('Seasons & Stars | API and bridge integration exposed');
  
  // Setup Simple Calendar compatibility layer
  setupSimpleCalendarCompatibility();
}

/**
 * Setup Simple Calendar API compatibility layer
 * Provides core API functions that weather modules and other integrations depend on
 */
function setupSimpleCalendarCompatibility(): void {
  // Only create compatibility if Simple Calendar isn't already present
  if ((window as any).SimpleCalendar) {
    console.log('Seasons & Stars | Simple Calendar already detected, skipping compatibility layer');
    return;
  }

  console.log('Seasons & Stars | Setting up Simple Calendar compatibility layer');

  const compatAPI = {
    // Core date/time functions that weather modules typically use
    currentDateTime: () => {
      const currentDate = calendarManager.getCurrentDate();
      if (!currentDate) return null;
      
      const dateObj = currentDate.toObject();
      return {
        year: dateObj.year,
        month: dateObj.month - 1, // SC uses 0-based months
        day: dateObj.day - 1,     // SC uses 0-based days
        hour: dateObj.time?.hour || 0,
        minute: dateObj.time?.minute || 0,
        second: dateObj.time?.second || 0,
        weekday: dateObj.weekday
      };
    },

    currentDateTimeDisplay: () => {
      const currentDate = calendarManager.getCurrentDate();
      if (!currentDate) return null;
      
      const calendar = calendarManager.getActiveCalendar();
      if (!calendar) return null;
      
      const dateObj = currentDate.toObject();
      const monthName = calendar.months[dateObj.month - 1]?.name || '';
      const weekdayName = calendar.weekdays[dateObj.weekday]?.name || '';
      
      return {
        date: `${dateObj.year}-${dateObj.month.toString().padStart(2, '0')}-${dateObj.day.toString().padStart(2, '0')}`,
        time: dateObj.time ? `${dateObj.time.hour.toString().padStart(2, '0')}:${dateObj.time.minute.toString().padStart(2, '0')}:${dateObj.time.second.toString().padStart(2, '0')}` : '00:00:00',
        monthName,
        day: dateObj.day.toString(),
        dayName: weekdayName,
        year: dateObj.year.toString(),
        yearName: `${calendar.year?.prefix || ''}${dateObj.year}${calendar.year?.suffix || ''}`,
        yearPostfix: calendar.year?.suffix || '',
        yearPrefix: calendar.year?.prefix || '',
        weekdayName
      };
    },

    timestampToDate: (timestamp: number) => {
      const engine = calendarManager.getActiveEngine();
      if (!engine) return null;
      
      const dateObj = engine.worldTimeToDate(timestamp);
      const calendar = calendarManager.getActiveCalendar();
      if (!calendar) return null;
      
      const monthName = calendar.months[dateObj.month - 1]?.name || '';
      const weekdayName = calendar.weekdays[dateObj.weekday]?.name || '';
      
      // Return format compatible with Simple Calendar
      return {
        year: dateObj.year,
        month: dateObj.month - 1, // 0-based for SC compatibility
        day: dateObj.day - 1,     // 0-based for SC compatibility
        hour: dateObj.time?.hour || 0,
        minute: dateObj.time?.minute || 0,
        second: dateObj.time?.second || 0,
        weekday: dateObj.weekday,
        
        // Display formatting - critical for weather modules
        display: {
          monthName,
          month: dateObj.month.toString(),
          day: dateObj.day.toString(),
          year: dateObj.year.toString(),
          daySuffix: getOrdinalSuffix(dateObj.day),
          yearPrefix: calendar.year?.prefix || '',
          yearPostfix: calendar.year?.suffix || '',
          date: `${dateObj.year}-${dateObj.month.toString().padStart(2, '0')}-${dateObj.day.toString().padStart(2, '0')}`,
          time: dateObj.time ? `${dateObj.time.hour.toString().padStart(2, '0')}:${dateObj.time.minute.toString().padStart(2, '0')}:${dateObj.time.second.toString().padStart(2, '0')}` : '00:00:00',
          weekday: weekdayName
        }
      };
    },

    dateToTimestamp: (date: any) => {
      const engine = calendarManager.getActiveEngine();
      if (!engine) return 0;
      
      // Convert from SC's 0-based format to S&S 1-based format
      const ssDate: ICalendarDate = {
        year: date.year,
        month: (date.month || 0) + 1, // Convert from 0-based to 1-based
        day: (date.day || 0) + 1,     // Convert from 0-based to 1-based
        weekday: date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.second || 0
        }
      };
      
      return engine.dateToWorldTime(ssDate);
    },

    changeDate: async (date: any) => {
      try {
        // Convert SC format to S&S format and set
        const ssDate: ICalendarDate = {
          year: date.year,
          month: (date.month || 0) + 1,
          day: (date.day || 0) + 1,
          weekday: date.weekday || 0,
          time: {
            hour: date.hour || 0,
            minute: date.minute || 0,
            second: date.second || 0
          }
        };
        
        await calendarManager.setCurrentDate(ssDate);
        return true;
      } catch (error) {
        console.warn('Seasons & Stars | SC Compatibility - changeDate failed:', error);
        return false;
      }
    },

    setDate: async (date: any) => {
      // Alias for changeDate
      return compatAPI.changeDate(date);
    },

    formatDateTime: (date: any, format?: string) => {
      try {
        const ssDate: ICalendarDate = {
          year: date.year,
          month: (date.month || 0) + 1,
          day: (date.day || 0) + 1,
          weekday: date.weekday || 0,
          time: date.time || { hour: 0, minute: 0, second: 0 }
        };
        
        return game.seasonsStars?.api.formatDate(ssDate) || '';
      } catch (error) {
        console.warn('Seasons & Stars | SC Compatibility - formatDateTime failed:', error);
        return '';
      }
    },

    // Calendar data access functions
    getCurrentCalendar: () => {
      return calendarManager.getActiveCalendar();
    },

    getAllCalendars: () => {
      return Array.from(calendarManager.getAllCalendars().values());
    },

    // Basic calendar data access
    getAllMonths: () => {
      const calendar = calendarManager.getActiveCalendar();
      return calendar?.months || [];
    },

    getAllWeekdays: () => {
      const calendar = calendarManager.getActiveCalendar();
      return calendar?.weekdays || [];
    },

    getCurrentMonth: () => {
      const currentDate = calendarManager.getCurrentDate();
      const calendar = calendarManager.getActiveCalendar();
      if (!currentDate || !calendar) return null;
      
      const dateObj = currentDate.toObject();
      return calendar.months[dateObj.month - 1] || null;
    },

    getCurrentDay: () => {
      const currentDate = calendarManager.getCurrentDate();
      if (!currentDate) return null;
      
      return currentDate.toObject().day;
    },

    // Placeholder functions for future notes system
    addNote: async (note: any) => {
      console.warn('Seasons & Stars | Notes system not yet implemented');
      return false;
    },

    getNotes: (date?: any) => {
      console.warn('Seasons & Stars | Notes system not yet implemented');
      return [];
    },

    getNotesForDay: (date: any) => {
      console.warn('Seasons & Stars | Notes system not yet implemented');
      return [];
    }
  };

  // Helper function for ordinal suffixes
  function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    const lastDigit = day % 10;
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  // Expose Simple Calendar compatible API
  (window as any).SimpleCalendar = {
    api: compatAPI,
    
    // Hook mappings - modules can register to these
    Hooks: {
      DateTimeChange: 'seasons-stars:dateChanged',
      Ready: 'seasons-stars:ready'
    },
    
    // Module info for compatibility checking
    VERSION: '2.0.0-seasons-stars-compat',
    TITLE: 'Seasons & Stars (SC Compatibility)',
    
    // Mark as compatibility layer
    _isSeasonsStarsCompatibility: true
  };

  console.log('Seasons & Stars | Simple Calendar compatibility layer active');
}







/**
 * Module cleanup
 */
Hooks.once('destroy', () => {
  console.log('Seasons & Stars | Module shutting down');
  
  
  // Clean up global references
  if (game.seasonsStars) {
    delete game.seasonsStars;
  }
  
  if ((window as any).SeasonsStars) {
    delete (window as any).SeasonsStars;
  }
});