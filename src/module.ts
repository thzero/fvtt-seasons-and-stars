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
 * Early setup during setupGame - before other modules check for Simple Calendar
 */
Hooks.once('setupGame', () => {
  console.log('Seasons & Stars | Early setup during setupGame');
  
  // Set up Simple Calendar compatibility early if enabled
  // This needs to happen before Simple Weather checks for it
  // Note: We default to enabled since settings might not be ready yet
  const compatEnabled = game.settings?.get('seasons-and-stars', 'simpleCalendarCompat') ?? true;
  if (compatEnabled) {
    setupEarlySimpleCalendarCompatibility();
  }
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
 * Early Simple Calendar compatibility setup for modules that check during init
 */
function setupEarlySimpleCalendarCompatibility(): void {
  if ((window as any).SimpleCalendar) {
    console.log('Seasons & Stars | Simple Calendar already exists, skipping early compatibility setup');
    return;
  }

  // Create a minimal SimpleCalendar object to satisfy early checks
  const earlyCompatAPI = {
    // Minimal APIs that might be checked during init
    timestamp: () => game.time?.worldTime || 0,
    timestampToDate: (timestamp: number) => ({ year: 2023, month: 0, day: 0 }), // Placeholder
    getCurrentDate: () => ({ year: 2023, month: 0, day: 0 }), // Placeholder
  };

  // Expose early compatibility - ONLY the API, no fake module registration
  (window as any).SimpleCalendar = {
    api: earlyCompatAPI,
    Hooks: {
      Init: 'simple-calendar-init',
      DateTimeChange: 'simple-calendar-date-time-change',
      ClockStartStop: 'simple-calendar-clock-start-stop'
    }
  };

  console.log('Seasons & Stars | Early Simple Calendar compatibility layer active');
}

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
  // Check if we already have the early compatibility layer
  const hasEarlyCompat = (window as any).SimpleCalendar && 
                        (window as any).SimpleCalendar.api && 
                        typeof (window as any).SimpleCalendar.api.getCurrentDate === 'function';

  if ((window as any).SimpleCalendar && !hasEarlyCompat) {
    console.log('Seasons & Stars | Real Simple Calendar already exists, skipping compatibility layer');
    return;
  }

  // Store sidebar buttons for Simple Weather integration
  const sidebarButtons: Array<{name: string, icon: string, callback: Function}> = [];

  const compatAPI: SimpleCalendarCompatAPI = {
    // Core time functions required by Simple Weather
    timestamp: (): number => {
      return game.time?.worldTime || 0;
    },

    timestampToDate: (timestamp: number): any => {
      const ssDate = game.seasonsStars?.api.worldTimeToDate(timestamp);
      
      if (!ssDate) return null;
      
      const activeCalendar = calendarManager.getActiveCalendar();
      const engine = calendarManager.getActiveEngine();
      
      if (!activeCalendar || !engine) return null;

      // Calculate sunrise/sunset (6 AM and 6 PM for now)
      const sunriseHour = 6;
      const sunsetHour = 18;
      const dayStart = engine.dateToWorldTime({
        ...ssDate,
        time: { hour: 0, minute: 0, second: 0 }
      });
      const sunrise = dayStart + (sunriseHour * 3600);
      const sunset = dayStart + (sunsetHour * 3600);

      // Create weekday names array
      const weekdays = activeCalendar.weekdays?.map(wd => wd.name) || [];
      
      // Convert to Simple Calendar DateData format
      return {
        year: ssDate.year,
        month: ssDate.month - 1, // Simple Calendar uses 0-based months
        day: ssDate.day - 1,     // Simple Calendar uses 0-based days
        dayOfTheWeek: ssDate.weekday,
        hour: ssDate.time?.hour || 0,
        minute: ssDate.time?.minute || 0,
        second: ssDate.time?.second || 0,
        dayOffset: 0, // Not used in S&S
        sunrise: sunrise,
        sunset: sunset,
        display: {
          date: game.seasonsStars?.api.formatDate(ssDate, { includeTime: false }) || '',
          time: game.seasonsStars?.api.formatDate(ssDate, { timeOnly: true }) || '',
          weekday: weekdays[ssDate.weekday] || '',
          day: ssDate.day.toString(),
          monthName: activeCalendar.months[ssDate.month - 1]?.name || '',
          year: ssDate.year.toString()
        },
        weekdays: weekdays,
        showWeekdayHeadings: true, // SmallTime checks this property
        currentSeason: {
          icon: getCurrentSeasonIcon(ssDate.month)
        }
      };
    },

    timestampPlusInterval: (timestamp: number, interval: any): number => {
      if (!interval) return timestamp;
      
      const engine = calendarManager.getActiveEngine();
      if (!engine) return timestamp;
      
      const currentDate = game.seasonsStars?.api.worldTimeToDate(timestamp);
      if (!currentDate) return timestamp;
      
      let newDate = { ...currentDate };
      
      // Add intervals based on provided object
      if (interval.day) {
        newDate = engine.addDays(newDate, interval.day);
      }
      if (interval.hour) {
        newDate = engine.addHours(newDate, interval.hour);
      }
      if (interval.minute) {
        newDate = engine.addMinutes(newDate, interval.minute);
      }
      if (interval.month) {
        newDate = engine.addMonths(newDate, interval.month);
      }
      if (interval.year) {
        newDate = engine.addYears(newDate, interval.year);
      }
      
      return game.seasonsStars?.api.dateToWorldTime(newDate) || timestamp;
    },

    getCurrentDate: (): any => {
      const currentTimestamp = game.time?.worldTime || 0;
      return compatAPI.timestampToDate(currentTimestamp);
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
        weekday: date.dayOfTheWeek || date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.second || date.seconds || 0
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
        weekday: date.dayOfTheWeek || date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.second || date.seconds || 0
        }
      };
      
      return game.seasonsStars?.api.dateToWorldTime(ssDate) || 0;
    },

    // Simple Weather specific APIs
    addSidebarButton: (name: string, icon: string, tooltip: string, isToggle: boolean, callback: Function): void => {
      sidebarButtons.push({ name, icon, callback });
      
      // Add button to calendar widget if it exists
      const widget = CalendarWidget.getInstance();
      if (widget && widget.rendered) {
        widget.addSidebarButton(name, icon, tooltip, callback);
      }
    },

    // Note management APIs (basic implementation)
    getNotesForDay: (year: number, month: number, day: number): any[] => {
      // Basic implementation - return empty for now
      // Could be enhanced to integrate with Foundry journal entries
      return [];
    },

    addNote: async (title: string, content: string, startDate: any, endDate: any, allDay: boolean): Promise<any> => {
      // Basic implementation - create a journal entry
      if (!game.user?.isGM) return null;
      
      const journal = await JournalEntry.create({
        name: title,
        content: content,
        flags: {
          'seasons-and-stars': {
            simpleCalendarNote: true,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay
          }
        }
      });
      
      return journal;
    },

    removeNote: async (noteId: string): Promise<void> => {
      if (!game.user?.isGM) return;
      
      const journal = game.journal?.get(noteId);
      if (journal) {
        await journal.delete();
      }
    },

    // Legacy support methods
    addMonths: (date: any, months: number): any => {
      const timestamp = compatAPI.dateToTimestamp(date);
      const newTimestamp = compatAPI.timestampPlusInterval(timestamp, { month: months });
      return compatAPI.timestampToDate(newTimestamp);
    },

    addYears: (date: any, years: number): any => {
      const timestamp = compatAPI.dateToTimestamp(date);
      const newTimestamp = compatAPI.timestampPlusInterval(timestamp, { year: years });
      return compatAPI.timestampToDate(newTimestamp);
    },

    setTime: async (time: number): Promise<void> => {
      if (game.user?.isGM) {
        await game.time?.advance(time - (game.time?.worldTime || 0));
      }
    }
  };

  // Hook system for Simple Weather and SmallTime integration
  const SimpleCalendarHooks = {
    Init: 'simple-calendar-init',
    DateTimeChange: 'simple-calendar-date-time-change',
    ClockStartStop: 'simple-calendar-clock-start-stop'
  };

  // Clock state management for SmallTime integration
  let clockRunning = false;

  // Additional APIs for SmallTime integration
  const additionalAPIs = {
    // Clock control APIs that SmallTime expects
    clockStatus: () => {
      return { started: clockRunning };
    },

    startClock: () => {
      clockRunning = true;
      Hooks.callAll(SimpleCalendarHooks.ClockStartStop, { started: true });
    },

    stopClock: () => {
      clockRunning = false;
      Hooks.callAll(SimpleCalendarHooks.ClockStartStop, { started: false });
    },

    // Calendar display API
    showCalendar: () => {
      CalendarSelectionDialog.show();
    },

    // Additional date APIs that SmallTime might use
    getAllMoons: () => {
      // Basic implementation - can be enhanced later
      return [{ 
        color: '#ffffff',
        currentPhase: { icon: 'new' }
      }];
    },

    getAllSeasons: () => {
      // Basic implementation - can be enhanced later  
      return [
        { name: 'Spring', icon: 'spring' },
        { name: 'Summer', icon: 'summer' },
        { name: 'Fall', icon: 'fall' },
        { name: 'Winter', icon: 'winter' }
      ];
    }
  };

  // Merge additional APIs with existing compatibility API
  Object.assign(compatAPI, additionalAPIs);

  // Replace the early compatibility layer with the full one
  (window as any).SimpleCalendar = {
    api: compatAPI,
    Hooks: SimpleCalendarHooks
  };

  // Set up hook listeners to emit Simple Calendar hooks when our time changes
  Hooks.on('seasons-stars:dateChanged', () => {
    const currentDate = compatAPI.getCurrentDate();
    Hooks.callAll(SimpleCalendarHooks.DateTimeChange, {
      date: currentDate,
      moons: compatAPI.getAllMoons(),
      seasons: compatAPI.getAllSeasons()
    });
  });

  // Hook into Foundry's updateWorldTime to emit clock events
  Hooks.on('updateWorldTime', () => {
    const currentDate = compatAPI.getCurrentDate();
    Hooks.callAll(SimpleCalendarHooks.DateTimeChange, {
      date: currentDate,
      moons: compatAPI.getAllMoons(),
      seasons: compatAPI.getAllSeasons()
    });
  });

  // Emit the initialization hook that Simple Weather and SmallTime listen for
  Hooks.callAll(SimpleCalendarHooks.Init);

  console.log('Seasons & Stars | Simple Calendar compatibility layer active');
}

/**
 * Get season icon based on month (Simple Calendar style)
 */
function getCurrentSeasonIcon(month: number): string {
  // Approximate seasons based on month (Northern Hemisphere)
  // Spring: March-May (months 3-5)
  // Summer: June-August (months 6-8)  
  // Fall: September-November (months 9-11)
  // Winter: December-February (months 12, 1-2)
  
  if (month >= 3 && month <= 5) {
    return 'spring';
  } else if (month >= 6 && month <= 8) {
    return 'summer';
  } else if (month >= 9 && month <= 11) {
    return 'fall';
  } else {
    return 'winter';
  }
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