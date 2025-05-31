/**
 * Calendar management system for Seasons & Stars
 */

import type { SeasonsStarsCalendar } from '../types/calendar';
import { CalendarEngine } from './calendar-engine';
import { TimeConverter } from './time-converter';
import { CalendarValidator } from './calendar-validator';
import { CalendarDate } from './calendar-date';
import { CalendarLocalization } from './calendar-localization';

export class CalendarManager {
  private calendars: Map<string, SeasonsStarsCalendar> = new Map();
  public engines: Map<string, CalendarEngine> = new Map();
  private timeConverter: TimeConverter | null = null;
  private activeCalendarId: string | null = null;

  /**
   * Initialize the calendar manager
   */
  async initialize(): Promise<void> {
    console.log('Seasons & Stars | Initializing Calendar Manager');
    
    // Load built-in calendars
    await this.loadBuiltInCalendars();
    
    // Complete initialization after settings are registered
    await this.completeInitialization();
  }

  /**
   * Complete initialization after settings are registered
   */
  async completeInitialization(): Promise<void> {
    console.log('Seasons & Stars | Completing Calendar Manager initialization');
    
    // Load active calendar from settings
    const savedCalendarId = game.settings?.get('seasons-and-stars', 'activeCalendar') as string;
    
    if (savedCalendarId && this.calendars.has(savedCalendarId)) {
      await this.setActiveCalendar(savedCalendarId);
    } else {
      // Default to first available calendar
      const firstCalendarId = this.calendars.keys().next().value;
      if (firstCalendarId) {
        await this.setActiveCalendar(firstCalendarId);
      }
    }
    
    console.log(`Seasons & Stars | Loaded ${this.calendars.size} calendars`);
  }

  /**
   * Load built-in calendar definitions
   */
  async loadBuiltInCalendars(): Promise<void> {
    const builtInCalendars = ['gregorian', 'vale-reckoning'];
    
    for (const calendarId of builtInCalendars) {
      try {
        // Try to load from module's calendars directory
        const response = await fetch(`modules/seasons-and-stars/calendars/${calendarId}.json`);
        
        if (response.ok) {
          const calendarData = await response.json();
          this.loadCalendar(calendarData);
        } else {
          console.warn(`Seasons & Stars | Could not load built-in calendar: ${calendarId}`);
        }
      } catch (error) {
        console.error(`Seasons & Stars | Error loading calendar ${calendarId}:`, error);
      }
    }
  }

  /**
   * Load a calendar from data
   */
  loadCalendar(calendarData: SeasonsStarsCalendar): boolean {
    // Validate the calendar data
    const validation = CalendarValidator.validate(calendarData);
    
    if (!validation.isValid) {
      console.error(`Seasons & Stars | Invalid calendar data for ${calendarData.id}:`, validation.errors);
      return false;
    }

    // Warn about potential issues
    if (validation.warnings.length > 0) {
      console.warn(`Seasons & Stars | Calendar warnings for ${calendarData.id}:`, validation.warnings);
    }

    // Store the calendar
    this.calendars.set(calendarData.id, calendarData);
    
    // Create engine for this calendar
    const engine = new CalendarEngine(calendarData);
    this.engines.set(calendarData.id, engine);
    
    const label = CalendarLocalization.getCalendarLabel(calendarData);
    console.log(`Seasons & Stars | Loaded calendar: ${label} (${calendarData.id})`);
    return true;
  }

  /**
   * Set the active calendar
   */
  async setActiveCalendar(calendarId: string): Promise<boolean> {
    if (!this.calendars.has(calendarId)) {
      console.error(`Seasons & Stars | Calendar not found: ${calendarId}`);
      return false;
    }

    this.activeCalendarId = calendarId;
    
    // Update time converter with new engine
    const engine = this.engines.get(calendarId)!;
    
    if (this.timeConverter) {
      this.timeConverter.updateEngine(engine);
    } else {
      this.timeConverter = new TimeConverter(engine);
    }

    // Save to settings
    if (game.settings) {
      await game.settings.set('seasons-and-stars', 'activeCalendar', calendarId);
    }

    // Emit hook for calendar change
    Hooks.callAll('seasons-stars:calendarChanged', {
      newCalendarId: calendarId,
      calendar: this.calendars.get(calendarId)
    });

    console.log(`Seasons & Stars | Active calendar set to: ${calendarId}`);
    return true;
  }

  /**
   * Get the active calendar
   */
  getActiveCalendar(): SeasonsStarsCalendar | null {
    if (!this.activeCalendarId) return null;
    return this.calendars.get(this.activeCalendarId) || null;
  }

  /**
   * Get the active calendar engine
   */
  getActiveEngine(): CalendarEngine | null {
    if (!this.activeCalendarId) return null;
    return this.engines.get(this.activeCalendarId) || null;
  }

  /**
   * Get the time converter
   */
  getTimeConverter(): TimeConverter | null {
    return this.timeConverter;
  }

  /**
   * Get all available calendar IDs
   */
  getAvailableCalendars(): string[] {
    return Array.from(this.calendars.keys());
  }

  /**
   * Get all calendar objects
   */
  getAllCalendars(): SeasonsStarsCalendar[] {
    return Array.from(this.calendars.values());
  }

  /**
   * Get calendar data by ID
   */
  getCalendar(calendarId: string): SeasonsStarsCalendar | null {
    return this.calendars.get(calendarId) || null;
  }

  /**
   * Import a calendar from JSON file
   */
  async importCalendarFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const calendarData = JSON.parse(text);
      
      return this.loadCalendar(calendarData);
    } catch (error) {
      console.error('Seasons & Stars | Error importing calendar:', error);
      ui.notifications?.error(`Failed to import calendar: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Export a calendar to JSON
   */
  exportCalendar(calendarId: string): string | null {
    const calendar = this.calendars.get(calendarId);
    
    if (!calendar) {
      console.error(`Seasons & Stars | Calendar not found for export: ${calendarId}`);
      return null;
    }

    try {
      return JSON.stringify(calendar, null, 2);
    } catch (error) {
      console.error('Seasons & Stars | Error exporting calendar:', error);
      return null;
    }
  }

  /**
   * Remove a calendar (built-in calendars cannot be removed)
   */
  removeCalendar(calendarId: string): boolean {
    const builtInCalendars = ['gregorian', 'vale-reckoning'];
    
    if (builtInCalendars.includes(calendarId)) {
      console.warn(`Seasons & Stars | Cannot remove built-in calendar: ${calendarId}`);
      return false;
    }

    if (!this.calendars.has(calendarId)) {
      console.warn(`Seasons & Stars | Calendar not found: ${calendarId}`);
      return false;
    }

    // Don't remove if it's the active calendar
    if (this.activeCalendarId === calendarId) {
      console.warn(`Seasons & Stars | Cannot remove active calendar: ${calendarId}`);
      return false;
    }

    this.calendars.delete(calendarId);
    this.engines.delete(calendarId);
    
    console.log(`Seasons & Stars | Removed calendar: ${calendarId}`);
    return true;
  }

  /**
   * Get current date from active calendar
   */
  getCurrentDate(): CalendarDate | null {
    if (!this.timeConverter) return null;
    return this.timeConverter.getCurrentDate();
  }

  /**
   * Advance time by days using active calendar
   */
  async advanceDays(days: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceDays(days);
  }

  /**
   * Advance time by hours using active calendar
   */
  async advanceHours(hours: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceHours(hours);
  }

  /**
   * Advance time by weeks using active calendar
   */
  async advanceWeeks(weeks: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceWeeks(weeks);
  }

  /**
   * Advance time by months using active calendar
   */
  async advanceMonths(months: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceMonths(months);
  }

  /**
   * Advance time by years using active calendar
   */
  async advanceYears(years: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceYears(years);
  }

  /**
   * Advance time by minutes using active calendar
   */
  async advanceMinutes(minutes: number): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.advanceMinutes(minutes);
  }

  /**
   * Set current date using active calendar
   */
  async setCurrentDate(date: any): Promise<void> {
    if (!this.timeConverter) {
      throw new Error('No active calendar set');
    }
    
    await this.timeConverter.setCurrentDate(date);
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    return {
      activeCalendarId: this.activeCalendarId,
      availableCalendars: this.getAvailableCalendars(),
      currentDate: this.getCurrentDate()?.toLongString(),
      timeConverter: this.timeConverter?.getDebugInfo()
    };
  }

  /**
   * Validate all loaded calendars
   */
  validateAllCalendars(): { [calendarId: string]: any } {
    const results: { [calendarId: string]: any } = {};
    
    for (const [calendarId, calendar] of this.calendars.entries()) {
      results[calendarId] = CalendarValidator.validateWithHelp(calendar);
    }
    
    return results;
  }
}