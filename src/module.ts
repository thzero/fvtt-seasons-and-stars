/**
 * Seasons & Stars - Main Module Entry Point
 * A clean calendar and timekeeping module for Foundry VTT v13+
 */

// Import styles
import './styles/seasons-and-stars.scss';

import { Logger } from './core/logger';
import { CalendarManager } from './core/calendar-manager';
import { NotesManager } from './core/notes-manager';
import { noteCategories, initializeNoteCategories } from './core/note-categories';
import { CalendarDate } from './core/calendar-date';
import { CalendarLocalization } from './core/calendar-localization';
import { CalendarWidget } from './ui/calendar-widget';
import { CalendarMiniWidget } from './ui/calendar-mini-widget';
import { CalendarGridWidget } from './ui/calendar-grid-widget';
import { CalendarSelectionDialog } from './ui/calendar-selection-dialog';
import { NoteEditingDialog } from './ui/note-editing-dialog';
import { SeasonsStarsSceneControls } from './ui/scene-controls';
import { SeasonsStarsKeybindings } from './core/keybindings';
import { SeasonsStarsIntegration } from './core/bridge-integration';
import { ValidationUtils } from './core/validation-utils';
import { TIME_CONSTANTS } from './core/constants';
import type { SeasonsStarsAPI } from './types/foundry-extensions';
import type {
  CalendarDate as ICalendarDate,
  DateFormatOptions,
  SeasonsStarsCalendar,
} from './types/calendar';

// Module instances
let calendarManager: CalendarManager;
let notesManager: NotesManager;

// Register scene controls at top level (critical timing requirement)
SeasonsStarsSceneControls.registerControls();

/**
 * Module initialization
 */
Hooks.once('init', async () => {
  Logger.debug('Initializing module');

  // Register module settings
  registerSettings();

  // Register keyboard shortcuts (must be in init hook)
  Logger.debug('Registering keyboard shortcuts');
  SeasonsStarsKeybindings.registerKeybindings();

  // Note: Note editing hooks temporarily disabled - see KNOWN-ISSUES.md
  // registerNoteEditingHooks();

  // Initialize note categories after settings are available
  initializeNoteCategories();

  // Initialize managers first
  calendarManager = new CalendarManager();
  notesManager = new NotesManager();

  Logger.debug('Module initialized');
});

/**
 * Early setup during setupGame - for future module initialization needs
 */
Hooks.once('setupGame', () => {
  Logger.debug('Early setup during setupGame');

  // Reserved for future setup needs
});

/**
 * Setup after Foundry is ready
 */
Hooks.once('ready', async () => {
  Logger.debug('Setting up module');

  // Load calendars first (without reading settings)
  await calendarManager.loadBuiltInCalendars();

  // Register calendar-specific settings now that calendars are loaded
  registerCalendarSettings();

  // Complete calendar manager initialization (read settings and set active calendar)
  await calendarManager.completeInitialization();

  // Initialize notes manager
  await notesManager.initialize();

  // Register with Memory Mage if available
  registerMemoryMageIntegration();

  // Expose API
  setupAPI();

  // Register with Errors and Echoes if available
  registerErrorsAndEchoes();

  // Register UI component hooks
  CalendarWidget.registerHooks();
  CalendarMiniWidget.registerHooks();
  CalendarGridWidget.registerHooks();
  CalendarMiniWidget.registerSmallTimeIntegration();

  // Scene controls registered at top level for timing requirements
  Logger.debug('Registering macros');
  SeasonsStarsSceneControls.registerMacros();

  // Show default widget if enabled in settings
  if (game.settings?.get('seasons-and-stars', 'showTimeWidget')) {
    const defaultWidget = game.settings?.get('seasons-and-stars', 'defaultWidget') || 'main';

    switch (defaultWidget) {
      case 'mini':
        CalendarMiniWidget.show();
        break;
      case 'grid':
        CalendarGridWidget.show();
        break;
      case 'main':
      default:
        CalendarWidget.show();
        break;
    }
  }

  // Fire ready hook for compatibility modules
  Hooks.callAll('seasons-stars:ready', {
    manager: calendarManager,
    api: game.seasonsStars?.api,
  });

  Logger.info('Module ready');
});

/**
 * Register module settings
 */
function registerSettings(): void {
  if (!game.settings) return;

  // Core user settings (most important first)
  // Calendar setting registered early with basic choices, updated later when calendars load
  game.settings.register('seasons-and-stars', 'activeCalendar', {
    name: 'SEASONS_STARS.settings.active_calendar',
    hint: 'SEASONS_STARS.settings.active_calendar_hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'gregorian',
    choices: { gregorian: 'Gregorian Calendar' }, // Basic default, updated later
    onChange: async (value: string) => {
      if (calendarManager) {
        await calendarManager.setActiveCalendar(value);
      }
    },
  });

  game.settings.register('seasons-and-stars', 'showTimeWidget', {
    name: 'Show Time Widget',
    hint: 'Display a small time widget on the UI',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('seasons-and-stars', 'defaultWidget', {
    name: 'SEASONS_STARS.settings.default_widget',
    hint: 'SEASONS_STARS.settings.default_widget_hint',
    scope: 'client',
    config: true,
    type: String,
    default: 'main',
    choices: {
      main: 'SEASONS_STARS.settings.default_widget_main',
      mini: 'SEASONS_STARS.settings.default_widget_mini',
      grid: 'SEASONS_STARS.settings.default_widget_grid',
    },
  });

  game.settings.register('seasons-and-stars', 'showNotifications', {
    name: 'Show Notifications',
    hint: 'Display warning and error notifications in the UI',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
  });

  // Notes system settings
  game.settings.register('seasons-and-stars', 'allowPlayerNotes', {
    name: 'Allow Player Notes',
    hint: 'Allow players to create calendar notes',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('seasons-and-stars', 'defaultPlayerVisible', {
    name: 'Default Player Visibility',
    hint: 'Make new notes visible to players by default',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('seasons-and-stars', 'defaultPlayerEditable', {
    name: 'Default Player Editable',
    hint: 'Make new notes editable by players by default',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  // Note categories configuration - stored as Object for complex data
  game.settings.register('seasons-and-stars', 'noteCategories', {
    name: 'Note Categories Configuration',
    hint: 'Configuration for note categories and tags',
    scope: 'world',
    config: false, // Not shown in config UI, managed by category system
    type: Object,
    default: null,
  });

  // Development and debugging settings (last for developers)
  game.settings.register('seasons-and-stars', 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable debug logging for troubleshooting (developers only)',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  });
}

/**
 * Update calendar setting choices after calendars are loaded
 */
function registerCalendarSettings(): void {
  if (!game.settings) return;

  // Get available calendars and create choices
  const calendars = calendarManager.getAllCalendars();
  const choices = CalendarLocalization.createCalendarChoices(calendars);

  // Re-register the setting with updated choices to overwrite the basic one
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
    },
  });

  Logger.debug('Updated calendar setting with full choices', { choices });
}

/**
 * Setup the main Seasons & Stars API
 */
function setupAPI(): void {
  const api: SeasonsStarsAPI = {
    getCurrentDate: (calendarId?: string): ICalendarDate | null => {
      try {
        Logger.api('getCurrentDate', { calendarId });

        // Input validation using utility
        ValidationUtils.validateCalendarId(calendarId);

        if (calendarId) {
          // Get date from specific calendar
          const calendar = calendarManager.getCalendar(calendarId);
          const engine = calendarManager.getActiveEngine();

          if (!calendar || !engine) {
            const error = new Error(`Calendar not found: ${calendarId}`);
            Logger.error('Calendar not found in getCurrentDate', error);
            throw error;
          }

          const worldTime = game.time?.worldTime || 0;
          const result = engine.worldTimeToDate(worldTime);
          Logger.api('getCurrentDate', { calendarId }, result);
          return result;
        }

        // Get date from active calendar
        const currentDate = calendarManager.getCurrentDate();
        if (!currentDate) {
          Logger.warn('No current date available from calendar manager');
          return null;
        }

        const result = currentDate.toObject();
        Logger.api('getCurrentDate', undefined, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get current date',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    setCurrentDate: async (date: ICalendarDate): Promise<boolean> => {
      try {
        Logger.api('setCurrentDate', { date });

        // Input validation
        if (!date || typeof date !== 'object') {
          const error = new Error('Date must be a valid CalendarDate object');
          Logger.error('Invalid date parameter', error);
          throw error;
        }

        if (
          typeof date.year !== 'number' ||
          typeof date.month !== 'number' ||
          typeof date.day !== 'number'
        ) {
          const error = new Error('Date must have numeric year, month, and day properties');
          Logger.error('Invalid date structure', error);
          throw error;
        }

        await calendarManager.setCurrentDate(date);
        Logger.api('setCurrentDate', { date }, 'success');
        return true;
      } catch (error) {
        Logger.error(
          'Failed to set current date',
          error instanceof Error ? error : new Error(String(error))
        );
        return false;
      }
    },

    advanceTime: async (amount: number, unit: string): Promise<void> => {
      try {
        Logger.api('advanceTime', { amount, unit });

        // Input validation using utilities
        ValidationUtils.validateFiniteNumber(amount, 'amount');
        ValidationUtils.validateString(unit, 'unit', false); // Don't allow empty strings

        // Route to appropriate method based on unit
        switch (unit.toLowerCase()) {
          case 'day':
          case 'days':
            await calendarManager.advanceDays(amount);
            break;
          case 'hour':
          case 'hours':
            await calendarManager.advanceHours(amount);
            break;
          case 'minute':
          case 'minutes':
            await calendarManager.advanceMinutes(amount);
            break;
          case 'week':
          case 'weeks':
            await calendarManager.advanceWeeks(amount);
            break;
          case 'month':
          case 'months':
            await calendarManager.advanceMonths(amount);
            break;
          case 'year':
          case 'years':
            await calendarManager.advanceYears(amount);
            break;
          default:
            const error = new Error(`Unsupported time unit: ${unit}`);
            Logger.error('Unsupported time unit', error);
            throw error;
        }

        Logger.api('advanceTime', { amount, unit }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance time',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceDays: async (days: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceDays', { days, calendarId });

        // Input validation
        if (typeof days !== 'number' || !isFinite(days)) {
          const error = new Error('Days must be a finite number');
          Logger.error('Invalid days parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceDays(days);
        Logger.api('advanceDays', { days, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance days',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceHours: async (hours: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceHours', { hours, calendarId });

        // Input validation
        if (typeof hours !== 'number' || !isFinite(hours)) {
          const error = new Error('Hours must be a finite number');
          Logger.error('Invalid hours parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceHours(hours);
        Logger.api('advanceHours', { hours, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance hours',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceMinutes: async (minutes: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceMinutes', { minutes, calendarId });

        // Input validation
        if (typeof minutes !== 'number' || !isFinite(minutes)) {
          const error = new Error('Minutes must be a finite number');
          Logger.error('Invalid minutes parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceMinutes(minutes);
        Logger.api('advanceMinutes', { minutes, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance minutes',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceWeeks: async (weeks: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceWeeks', { weeks, calendarId });

        // Input validation
        if (typeof weeks !== 'number' || !isFinite(weeks)) {
          const error = new Error('Weeks must be a finite number');
          Logger.error('Invalid weeks parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceWeeks(weeks);
        Logger.api('advanceWeeks', { weeks, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance weeks',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceMonths: async (months: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceMonths', { months, calendarId });

        // Input validation
        if (typeof months !== 'number' || !isFinite(months)) {
          const error = new Error('Months must be a finite number');
          Logger.error('Invalid months parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceMonths(months);
        Logger.api('advanceMonths', { months, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance months',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    advanceYears: async (years: number, calendarId?: string): Promise<void> => {
      try {
        Logger.api('advanceYears', { years, calendarId });

        // Input validation
        if (typeof years !== 'number' || !isFinite(years)) {
          const error = new Error('Years must be a finite number');
          Logger.error('Invalid years parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        if (calendarId) {
          const error = new Error('Advancing specific calendar time not yet implemented');
          Logger.error('Feature not implemented', error);
          throw error;
        }

        await calendarManager.advanceYears(years);
        Logger.api('advanceYears', { years, calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to advance years',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    formatDate: (date: ICalendarDate, options?: DateFormatOptions): string => {
      try {
        Logger.api('formatDate', { date, options });

        // Input validation
        if (!date || typeof date !== 'object') {
          const error = new Error('Date must be a valid ICalendarDate object');
          Logger.error('Invalid date parameter', error);
          throw error;
        }

        if (
          typeof date.year !== 'number' ||
          typeof date.month !== 'number' ||
          typeof date.day !== 'number'
        ) {
          const error = new Error('Date must have valid year, month, and day numbers');
          Logger.error('Invalid date structure', error);
          throw error;
        }

        const activeCalendar = calendarManager.getActiveCalendar();

        if (!activeCalendar) {
          const error = new Error('No active calendar set');
          Logger.error('No active calendar for date formatting', error);
          throw error;
        }

        const calendarDate = new CalendarDate(date, activeCalendar);
        const result = calendarDate.format(options);
        Logger.api('formatDate', { date, options }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to format date',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    dateToWorldTime: (date: ICalendarDate, calendarId?: string): number => {
      try {
        Logger.api('dateToWorldTime', { date, calendarId });

        // Input validation
        if (!date || typeof date !== 'object') {
          const error = new Error('Date must be a valid ICalendarDate object');
          Logger.error('Invalid date parameter', error);
          throw error;
        }

        if (
          typeof date.year !== 'number' ||
          typeof date.month !== 'number' ||
          typeof date.day !== 'number'
        ) {
          const error = new Error('Date must have valid year, month, and day numbers');
          Logger.error('Invalid date structure', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        const engine = calendarId
          ? calendarManager.engines?.get(calendarId)
          : calendarManager.getActiveEngine();

        if (!engine) {
          const error = new Error(`No engine available for calendar: ${calendarId || 'active'}`);
          Logger.error('No engine available for date to world time conversion', error);
          throw error;
        }

        const result = engine.dateToWorldTime(date);
        Logger.api('dateToWorldTime', { date, calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to convert date to world time',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    worldTimeToDate: (timestamp: number, calendarId?: string): ICalendarDate => {
      try {
        Logger.api('worldTimeToDate', { timestamp, calendarId });

        // Input validation
        if (typeof timestamp !== 'number' || !isFinite(timestamp)) {
          const error = new Error('Timestamp must be a finite number');
          Logger.error('Invalid timestamp parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        const engine = calendarId
          ? calendarManager.engines?.get(calendarId)
          : calendarManager.getActiveEngine();

        if (!engine) {
          const error = new Error(`No engine available for calendar: ${calendarId || 'active'}`);
          Logger.error('No engine available for world time to date conversion', error);
          throw error;
        }

        const result = engine.worldTimeToDate(timestamp);
        Logger.api('worldTimeToDate', { timestamp, calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to convert world time to date',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    getActiveCalendar: () => {
      try {
        Logger.api('getActiveCalendar');
        const result = calendarManager.getActiveCalendar();
        Logger.api('getActiveCalendar', undefined, result?.id || 'none');
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get active calendar',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    setActiveCalendar: async (calendarId: string): Promise<void> => {
      try {
        Logger.api('setActiveCalendar', { calendarId });

        // Input validation
        if (typeof calendarId !== 'string' || calendarId.trim() === '') {
          const error = new Error('Calendar ID must be a non-empty string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        await calendarManager.setActiveCalendar(calendarId);
        Logger.api('setActiveCalendar', { calendarId }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to set active calendar',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    getAvailableCalendars: (): string[] => {
      try {
        Logger.api('getAvailableCalendars');
        const result = calendarManager.getAvailableCalendars();
        Logger.api('getAvailableCalendars', undefined, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get available calendars',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    loadCalendar: (data: any): void => {
      try {
        Logger.api('loadCalendar', { calendarId: data?.id || 'unknown' });

        // Input validation
        if (!data || typeof data !== 'object') {
          const error = new Error('Calendar data must be a valid object');
          Logger.error('Invalid calendar data parameter', error);
          throw error;
        }

        if (!data.id || typeof data.id !== 'string') {
          const error = new Error('Calendar data must have a valid id string');
          Logger.error('Invalid calendar data structure', error);
          throw error;
        }

        calendarManager.loadCalendar(data);
        Logger.api('loadCalendar', { calendarId: data.id }, 'success');
      } catch (error) {
        Logger.error(
          'Failed to load calendar',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    // Calendar metadata methods (required for compatibility bridge)
    getMonthNames: (calendarId?: string): string[] => {
      try {
        Logger.api('getMonthNames', { calendarId });

        // Input validation
        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        const calendar = calendarId
          ? calendarManager.getCalendar(calendarId)
          : calendarManager.getActiveCalendar();

        if (!calendar?.months) {
          Logger.warn(`No months found for calendar: ${calendarId || 'active'}`);
          return [];
        }

        const result = calendar.months.map(month => month.name);
        Logger.api('getMonthNames', { calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get month names',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    getWeekdayNames: (calendarId?: string): string[] => {
      try {
        Logger.api('getWeekdayNames', { calendarId });

        // Input validation
        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        const calendar = calendarId
          ? calendarManager.getCalendar(calendarId)
          : calendarManager.getActiveCalendar();

        if (!calendar?.weekdays) {
          Logger.warn(`No weekdays found for calendar: ${calendarId || 'active'}`);
          return [];
        }

        const result = calendar.weekdays.map(day => day.name);
        Logger.api('getWeekdayNames', { calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get weekday names',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    // Optional enhanced features (basic implementations)
    getSunriseSunset: (
      date: ICalendarDate,
      calendarId?: string
    ): { sunrise: number; sunset: number } => {
      try {
        Logger.api('getSunriseSunset', { date, calendarId });

        // Input validation
        if (!date || typeof date !== 'object') {
          const error = new Error('Date must be a valid ICalendarDate object');
          Logger.error('Invalid date parameter', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        // Basic implementation - can be enhanced with calendar-specific data later
        // For now, return reasonable defaults (6 AM sunrise, 6 PM sunset)
        const result = { sunrise: 6, sunset: 18 };
        Logger.api('getSunriseSunset', { date, calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get sunrise/sunset',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    getSeasonInfo: (date: ICalendarDate, calendarId?: string): { name: string; icon: string } => {
      try {
        Logger.api('getSeasonInfo', { date, calendarId });

        // Input validation
        if (!date || typeof date !== 'object') {
          const error = new Error('Date must be a valid ICalendarDate object');
          Logger.error('Invalid date parameter', error);
          throw error;
        }

        if (
          typeof date.year !== 'number' ||
          typeof date.month !== 'number' ||
          typeof date.day !== 'number'
        ) {
          const error = new Error('Date must have valid year, month, and day numbers');
          Logger.error('Invalid date structure', error);
          throw error;
        }

        if (calendarId !== undefined && typeof calendarId !== 'string') {
          const error = new Error('Calendar ID must be a string');
          Logger.error('Invalid calendar ID parameter', error);
          throw error;
        }

        const calendar = calendarId
          ? calendarManager.getCalendar(calendarId)
          : calendarManager.getActiveCalendar();

        if (
          !calendar ||
          !(calendar as SeasonsStarsCalendar).seasons ||
          (calendar as SeasonsStarsCalendar).seasons!.length === 0
        ) {
          Logger.warn(`No seasons found for calendar: ${calendarId || 'active'}`);
          const result = { name: 'Unknown', icon: 'none' };
          Logger.api('getSeasonInfo', { date, calendarId }, result);
          return result;
        }

        // Basic season detection - find season containing this date
        // This is a simple implementation that can be enhanced later
        const currentSeason = (calendar as SeasonsStarsCalendar).seasons!.find(season => {
          // Simple logic: match by rough month ranges
          // This could be enhanced with proper calendar-aware season calculation
          if (season.startMonth && season.endMonth) {
            return date.month >= season.startMonth && date.month <= season.endMonth;
          }
          return false;
        });

        if (currentSeason) {
          const result = {
            name: currentSeason.name,
            icon: currentSeason.icon || currentSeason.name.toLowerCase(),
          };
          Logger.api('getSeasonInfo', { date, calendarId }, result);
          return result;
        }

        // Fallback: use first season or default
        const fallbackSeason = (calendar as SeasonsStarsCalendar).seasons![0];
        const result = {
          name: fallbackSeason?.name || 'Unknown',
          icon: fallbackSeason?.icon || fallbackSeason?.name?.toLowerCase() || 'none',
        };
        Logger.api('getSeasonInfo', { date, calendarId }, result);
        return result;
      } catch (error) {
        Logger.error(
          'Failed to get season info',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },
  };

  // Expose API to global game object
  if (game) {
    game.seasonsStars = {
      api,
      manager: calendarManager,
      notes: notesManager,
      categories: noteCategories, // Will be available by this point since ready runs after init
      integration: SeasonsStarsIntegration.detect(),
    };
  }

  // Expose API to window for debugging
  (window as any).SeasonsStars = {
    api,
    manager: calendarManager,
    notes: notesManager,
    integration: SeasonsStarsIntegration,
    CalendarWidget,
    CalendarMiniWidget,
    CalendarGridWidget,
    CalendarSelectionDialog,
  };

  Logger.debug('API and bridge integration exposed');

  Logger.debug('Module initialization complete');
}

/**
 * Register hooks for custom note editing dialog
 */
function registerNoteEditingHooks(): void {
  // Hook into journal sheet rendering to intercept calendar notes
  Hooks.on('renderJournalSheet', (sheet: any, html: JQuery, data: any) => {
    Logger.debug('renderJournalSheet hook fired', {
      journalName: sheet.document?.name,
      isCalendarNote: !!sheet.document?.flags?.['seasons-and-stars']?.calendarNote,
    });

    try {
      const journal = sheet.document;

      // Check if this is a calendar note
      const flags = journal.flags?.['seasons-and-stars'];
      if (!flags?.calendarNote) {
        Logger.debug('Not a calendar note, allowing default sheet');
        return; // Not a calendar note, let default sheet handle it
      }

      Logger.debug('Calendar note detected, intercepting sheet');

      // Close the default sheet immediately
      sheet.close();

      // Show our custom editing dialog instead
      NoteEditingDialog.showEditDialog(journal);
    } catch (error) {
      Logger.error(
        'Failed to intercept journal sheet for calendar note',
        error instanceof Error ? error : new Error(String(error))
      );
      // Let the default sheet continue if our custom dialog fails
    }
  });

  // Also try intercepting at the preRender stage (before sheet opens)
  Hooks.on('preRenderJournalSheet', (sheet: any) => {
    Logger.debug('preRenderJournalSheet hook fired', {
      journalName: sheet.document?.name,
      isCalendarNote: !!sheet.document?.flags?.['seasons-and-stars']?.calendarNote,
    });

    try {
      const journal = sheet.document;

      // Check if this is a calendar note
      const flags = journal.flags?.['seasons-and-stars'];
      if (!flags?.calendarNote) {
        return; // Not a calendar note, let default sheet handle it
      }

      Logger.debug('Calendar note detected in preRender, preventing default sheet');

      // Prevent the default sheet from opening at all
      setTimeout(() => {
        // Show our custom editing dialog instead
        NoteEditingDialog.showEditDialog(journal);
      }, 10);

      // Return false to prevent the default sheet from rendering
      return false;
    } catch (error) {
      Logger.error(
        'Failed to intercept journal sheet in preRender',
        error instanceof Error ? error : new Error(String(error))
      );
      // Let the default sheet continue if our custom dialog fails
      return true;
    }
  });

  Logger.debug('Note editing hooks registered');
}

/**
 * Register with Errors and Echoes if available
 */
function registerErrorsAndEchoes(): void {
  // Check if Errors and Echoes is available
  if (!(window as any).ErrorsAndEchoesAPI) {
    Logger.debug('Errors and Echoes API not available - skipping registration');
    return;
  }

  try {
    Logger.debug('Registering with Errors and Echoes');

    (window as any).ErrorsAndEchoesAPI.register({
      moduleId: 'seasons-and-stars',

      // Context provider - adds useful debugging information
      contextProvider: () => {
        const context: Record<string, any> = {};

        // Add calendar information
        if (calendarManager) {
          try {
            const currentDate = calendarManager.getCurrentDate();
            const activeCalendar = calendarManager.getActiveCalendar();

            context.currentDate = currentDate
              ? `${currentDate.year}-${currentDate.month}-${currentDate.day}`
              : 'unknown';
            context.activeCalendarId = activeCalendar?.id || 'unknown';
            context.activeCalendarLabel = activeCalendar?.translations?.en?.label || 'unknown';
            context.calendarEngineAvailable = !!calendarManager.getActiveEngine();
          } catch (e) {
            context.calendarError = 'Could not read calendar state';
          }
        }

        // Add notes information
        if (notesManager) {
          try {
            context.notesSystemInitialized = notesManager.isInitialized();
            // Don't expose note count as it might be sensitive
          } catch (e) {
            context.notesError = 'Could not read notes state';
          }
        }

        // Add current scene information
        if ((game as any).scenes?.active) {
          const scene = (game as any).scenes.active;
          context.sceneId = scene.id;
          context.sceneName = scene.name;
        }

        // Add system information
        context.gameSystem = (game as any).system?.id || 'unknown';
        context.systemVersion = (game as any).system?.version || 'unknown';
        context.foundryVersion = (game as any).version || 'unknown';

        // Add key module settings that might affect behavior
        try {
          context.showTimeWidget =
            game.settings?.get('seasons-and-stars', 'showTimeWidget') || false;
          context.debugMode = game.settings?.get('seasons-and-stars', 'debugMode') || false;
          context.showNotifications =
            game.settings?.get('seasons-and-stars', 'showNotifications') || false;
        } catch (e) {
          context.settingsError = 'Could not read module settings';
        }

        return context;
      },

      // Error filter - only report errors that are likely S&S related
      errorFilter: (error: Error) => {
        const stack = error.stack || '';
        const message = error.message || '';

        // Report errors that mention our module
        if (
          stack.includes('seasons-and-stars') ||
          message.includes('seasons-and-stars') ||
          message.includes('S&S') ||
          stack.includes('CalendarManager') ||
          stack.includes('CalendarWidget') ||
          stack.includes('CalendarEngine') ||
          stack.includes('NotesManager')
        ) {
          return false; // Don't filter (report this error)
        }

        // Report calendar or time-related errors that might affect us
        if (
          message.includes('calendar') ||
          message.includes('worldTime') ||
          (message.includes('time') &&
            (stack.includes('updateWorldTime') || stack.includes('game.time')))
        ) {
          return false; // Don't filter (might be relevant)
        }

        // Filter out errors that are clearly from other modules
        const otherModules = [
          'simple-calendar',
          'foundryvtt-simple-calendar',
          'smalltime',
          'dice-so-nice',
          'lib-wrapper',
          'socketlib',
          'journeys-and-jamborees',
        ];

        for (const module of otherModules) {
          if (stack.includes(module) && !stack.includes('seasons-and-stars')) {
            return true; // Filter out (don't report)
          }
        }

        // Report core Foundry errors that might affect our module
        if (
          stack.includes('foundry.js') ||
          stack.includes('ClientDatabaseBackend') ||
          (stack.includes('Application') && message.includes('render'))
        ) {
          return false; // Don't filter (these might affect us)
        }

        // Filter out most other errors unless they seem related
        return true;
      },
    });

    Logger.debug('Successfully registered with Errors and Echoes');
  } catch (error) {
    Logger.error(
      'Failed to register with Errors and Echoes',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Module cleanup
 */
Hooks.once('destroy', () => {
  Logger.debug('Module shutting down');

  // Clean up global references
  if (game.seasonsStars) {
    delete game.seasonsStars;
  }

  if ((window as any).SeasonsStars) {
    delete (window as any).SeasonsStars;
  }
});

/**
 * Register with Memory Mage module if available
 */
function registerMemoryMageIntegration(): void {
  try {
    // Check if Memory Mage is available (standard Foundry module pattern)
    const memoryMage = (game as any).memoryMage || (game.modules?.get('memory-mage') as any)?.api;
    if (!memoryMage) {
      Logger.debug('Memory Mage not available - skipping memory monitoring integration');
      return;
    }

    Logger.debug('Registering with Memory Mage for memory monitoring');
    // Register self-reporting memory usage
    memoryMage.registerModule('seasons-and-stars', () => {
      const optimizer = (notesManager as any)?.getPerformanceOptimizer?.();
      const widgetMemory = calculateWidgetMemory();
      const calendarMemory = calculateCalendarMemory();

      return {
        estimatedMB: (optimizer?.getMemoryUsage() || 0) + widgetMemory + calendarMemory,
        details: {
          notesCache: optimizer?.getMetrics()?.totalNotes || 0,
          activeWidgets: getActiveWidgetCount(),
          loadedCalendars: (calendarManager as any)?.getLoadedCalendars?.()?.length || 0,
          cacheSize: optimizer?.getMetrics()?.cacheHitRate || 0,
        },
      };
    });

    // Register cleanup handler for memory pressure
    memoryMage.registerCleanupHandler('seasons-and-stars', (level: 'warning' | 'critical') => {
      Logger.info(`Memory Mage triggered cleanup: ${level} pressure detected`);

      if (level === 'warning') {
        // Light cleanup
        const optimizer = (notesManager as any)?.getPerformanceOptimizer?.();
        if (optimizer) {
          optimizer.relieveMemoryPressure();
        }
      } else if (level === 'critical') {
        // Aggressive cleanup
        const optimizer = (notesManager as any)?.getPerformanceOptimizer?.();
        if (optimizer) {
          optimizer.relieveMemoryPressure();
        }

        // Clear other caches if available
        if ((calendarManager as any)?.clearCaches) {
          (calendarManager as any).clearCaches();
        }

        // Force close widgets if memory is critically low
        if (level === 'critical') {
          (CalendarWidget as any).closeAll?.();
          (CalendarGridWidget as any).closeAll?.();
        }
      }
    });

    Logger.debug('Memory Mage integration registered successfully');
  } catch (error) {
    Logger.warn(
      'Failed to register with Memory Mage - module will continue without memory monitoring:',
      error
    );
  }
}

/**
 * Calculate estimated memory usage of active widgets
 */
function calculateWidgetMemory(): number {
  let memory = 0;

  // Base widget overhead (small)
  const activeWidgets = getActiveWidgetCount();
  memory += activeWidgets * 0.05; // 50KB per widget

  return memory;
}

/**
 * Calculate estimated memory usage of loaded calendars
 */
function calculateCalendarMemory(): number {
  const loadedCalendars = (calendarManager as any)?.getLoadedCalendars?.()?.length || 0;
  return loadedCalendars * 0.02; // 20KB per calendar
}

/**
 * Get count of active widgets
 */
function getActiveWidgetCount(): number {
  let count = 0;

  if (CalendarWidget.getInstance?.()?.rendered) count++;
  if (CalendarMiniWidget.getInstance?.()?.rendered) count++;
  if (CalendarGridWidget.getInstance?.()?.rendered) count++;

  return count;
}
