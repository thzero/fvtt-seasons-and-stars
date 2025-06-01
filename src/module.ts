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
 * Early setup during setupGame - for future module initialization needs
 */
Hooks.once('setupGame', () => {
  console.log('Seasons & Stars | Early setup during setupGame');
  
  // Reserved for future setup needs
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
    },

    // Calendar metadata methods (required for compatibility bridge)
    getMonthNames: (calendarId?: string): string[] => {
      const calendar = calendarId ? 
        calendarManager.getCalendar(calendarId) : 
        calendarManager.getActiveCalendar();
      
      if (!calendar?.months) {
        console.warn(`S&S API: No months found for calendar: ${calendarId || 'active'}`);
        return [];
      }
      return calendar.months.map(month => month.name);
    },

    getWeekdayNames: (calendarId?: string): string[] => {
      const calendar = calendarId ? 
        calendarManager.getCalendar(calendarId) : 
        calendarManager.getActiveCalendar();
      
      if (!calendar?.weekdays) {
        console.warn(`S&S API: No weekdays found for calendar: ${calendarId || 'active'}`);
        return [];
      }
      return calendar.weekdays.map(day => day.name);
    },

    // Optional enhanced features (basic implementations)
    getSunriseSunset: (date: ICalendarDate, calendarId?: string): { sunrise: number; sunset: number } => {
      // Basic implementation - can be enhanced with calendar-specific data later
      // For now, return reasonable defaults (6 AM sunrise, 6 PM sunset)
      return { sunrise: 6, sunset: 18 };
    },

    getSeasonInfo: (date: ICalendarDate, calendarId?: string): { name: string; icon: string } => {
      const calendar = calendarId ? 
        calendarManager.getCalendar(calendarId) : 
        calendarManager.getActiveCalendar();
      
      if (!calendar?.seasons || calendar.seasons.length === 0) {
        console.warn(`S&S API: No seasons found for calendar: ${calendarId || 'active'}`);
        return { name: 'Unknown', icon: 'none' };
      }
      
      // Basic season detection - find season containing this date
      // This is a simple implementation that can be enhanced later
      const currentSeason = calendar.seasons.find(season => {
        // Simple logic: match by rough month ranges
        // This could be enhanced with proper calendar-aware season calculation
        if (season.startMonth && season.endMonth) {
          return date.month >= season.startMonth && date.month <= season.endMonth;
        }
        return false;
      });
      
      if (currentSeason) {
        return { 
          name: currentSeason.name, 
          icon: currentSeason.icon || currentSeason.name.toLowerCase() 
        };
      }
      
      // Fallback: use first season or default
      const fallbackSeason = calendar.seasons[0];
      return { 
        name: fallbackSeason?.name || 'Unknown', 
        icon: fallbackSeason?.icon || fallbackSeason?.name?.toLowerCase() || 'none' 
      };
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
  
  console.log('Seasons & Stars | Module initialization complete');
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