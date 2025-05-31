/**
 * Foundry VTT Type Extensions for Seasons & Stars
 */

import type { 
  SeasonsStarsCalendar, 
  CalendarDate, 
  DateFormatOptions 
} from './calendar';

declare global {
  interface Game {
    seasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any; // CalendarManager - avoiding circular import
    };
    settings?: GameSettings;
    time?: GameTime;
    user?: User;
    i18n?: {
      lang: string;
    };
  }

  interface GameSettings {
    get(namespace: string, key: string): any;
    set(namespace: string, key: string, value: any): Promise<any>;
    register(namespace: string, key: string, data: any): void;
  }

  interface GameTime {
    worldTime: number;
    advance(seconds: number): Promise<void>;
  }

  interface User {
    isGM: boolean;
  }

  interface NotificationManager {
    warn(message: string): void;
    error(message: string): void;
  }

  interface UI {
    notifications?: NotificationManager;
  }

  const ui: UI;

  const game: Game;

  interface HookManager {
    once(event: string, callback: Function): void;
    on(event: string, callback: Function): number;
    off(event: string, hookId: number): void;
    callAll(event: string, ...args: any[]): void;
  }

  const Hooks: HookManager;

  interface Window {
    SimpleCalendar?: {
      api: SimpleCalendarCompatAPI;
      Hooks: any;
    };
    SeasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any;
    };
  }
}

export interface SeasonsStarsAPI {
  getCurrentDate(calendarId?: string): CalendarDate | null;
  advanceDays(days: number, calendarId?: string): Promise<void>;
  advanceHours(hours: number, calendarId?: string): Promise<void>;
  advanceMinutes(minutes: number, calendarId?: string): Promise<void>;
  advanceWeeks(weeks: number, calendarId?: string): Promise<void>;
  advanceMonths(months: number, calendarId?: string): Promise<void>;
  advanceYears(years: number, calendarId?: string): Promise<void>;
  formatDate(date: CalendarDate, options?: DateFormatOptions): string;
  dateToWorldTime(date: CalendarDate, calendarId?: string): number;
  worldTimeToDate(timestamp: number, calendarId?: string): CalendarDate;
  getActiveCalendar(): SeasonsStarsCalendar | null;
  setActiveCalendar(calendarId: string): Promise<void>;
  getAvailableCalendars(): string[];
  loadCalendar(data: SeasonsStarsCalendar): void;
}

export interface SimpleCalendarCompatAPI {
  getCurrentDate(): any;
  advanceDays(days: number): Promise<void>;
  formatDateTime(date: any, format?: string): string;
  dateToTimestamp(date: any): number;
  timestampToDate(timestamp: number): any;
  addMonths(date: any, months: number): any;
  addYears(date: any, years: number): any;
  setTime(time: number): Promise<void>;
}