/**
 * Bridge Integration Interface for Seasons & Stars
 * 
 * Provides a clean, generic API for compatibility bridge modules to integrate
 * with S&S without requiring external calendar system knowledge in the core.
 */

import type { CalendarDate, Calendar } from '../types/calendar';
import { CalendarManager } from './calendar-manager';
import { CalendarWidget } from '../ui/calendar-widget';
import { CalendarMiniWidget } from '../ui/calendar-mini-widget';
import { CalendarGridWidget } from '../ui/calendar-grid-widget';

// Core integration interface types
export interface SeasonsStarsAPI {
  // Core date operations
  getCurrentDate(calendarId?: string): CalendarDate;
  worldTimeToDate(timestamp: number, calendarId?: string): CalendarDate;
  dateToWorldTime(date: CalendarDate, calendarId?: string): number;
  formatDate(date: CalendarDate, options?: any): string;
  
  // Calendar management
  getActiveCalendar(): Calendar;
  setActiveCalendar(calendarId: string): Promise<void>;
  getAvailableCalendars(): string[];
  
  // Time advancement (GM only)
  advanceDays?(days: number, calendarId?: string): Promise<void>;
  advanceHours?(hours: number, calendarId?: string): Promise<void>;
  advanceMinutes?(minutes: number, calendarId?: string): Promise<void>;
  
  // Calendar metadata
  getMonthNames(calendarId?: string): string[];
  getWeekdayNames(calendarId?: string): string[];
  
  // Optional advanced features
  getSunriseSunset?(date: CalendarDate, calendarId?: string): TimeOfDay;
  getSeasonInfo?(date: CalendarDate, calendarId?: string): SeasonInfo;
}

export interface SeasonsStarsWidgets {
  readonly main: BridgeCalendarWidget | null;
  readonly mini: BridgeCalendarWidget | null;
  readonly grid: BridgeCalendarWidget | null;
  
  getPreferredWidget(preference?: WidgetPreference): BridgeCalendarWidget | null;
  onWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void;
  offWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void;
}

export interface BridgeCalendarWidget {
  readonly id: string;
  readonly isVisible: boolean;
  
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void;
  removeSidebarButton(name: string): void;
  hasSidebarButton(name: string): boolean;
  getInstance(): any;
}

export interface SeasonsStarsHooks {
  onDateChanged(callback: (event: DateChangeEvent) => void): void;
  onCalendarChanged(callback: (event: CalendarChangeEvent) => void): void;
  onReady(callback: (event: ReadyEvent) => void): void;
  off(hookName: string, callback: Function): void;
}

// Event types
export interface DateChangeEvent {
  newDate: CalendarDate;
  oldDate: CalendarDate;
  worldTime: number;
  calendarId: string;
}

export interface CalendarChangeEvent {
  newCalendarId: string;
  oldCalendarId: string;
  calendar: Calendar;
}

export interface ReadyEvent {
  api: SeasonsStarsAPI;
  widgets: SeasonsStarsWidgets;
  version: string;
}

// Supporting types
export interface TimeOfDay {
  sunrise: number;
  sunset: number;
}

export interface SeasonInfo {
  name: string;
  icon: string;
  description?: string;
}

export enum WidgetPreference {
  MAIN = 'main',
  MINI = 'mini',
  GRID = 'grid',
  ANY = 'any'
}

/**
 * Main integration class that bridges use to interact with S&S
 */
export class SeasonsStarsIntegration {
  private static instance: SeasonsStarsIntegration | null = null;
  private manager: CalendarManager;
  private widgetManager: IntegrationWidgetManager;
  private hookManager: IntegrationHookManager;
  
  private constructor(manager: CalendarManager) {
    this.manager = manager;
    this.widgetManager = new IntegrationWidgetManager();
    this.hookManager = new IntegrationHookManager(manager);
  }
  
  /**
   * Detect and create integration instance
   */
  static detect(): SeasonsStarsIntegration | null {
    if (this.instance) {
      return this.instance;
    }
    
    // Check if S&S is available
    const module = game.modules.get('seasons-and-stars');
    if (!module?.active) {
      return null;
    }
    
    // Check if manager is available
    const manager = (game as any).seasonsStars?.manager;
    if (!manager) {
      return null;
    }
    
    this.instance = new SeasonsStarsIntegration(manager);
    return this.instance;
  }
  
  /**
   * Get current version
   */
  get version(): string {
    const module = game.modules.get('seasons-and-stars');
    return module?.version || '0.0.0';
  }
  
  /**
   * Check if integration is available
   */
  get isAvailable(): boolean {
    return !!(this.manager && this.api);
  }
  
  /**
   * Get API interface
   */
  get api(): SeasonsStarsAPI {
    return new IntegrationAPI(this.manager);
  }
  
  /**
   * Get widgets interface
   */
  get widgets(): SeasonsStarsWidgets {
    return this.widgetManager;
  }
  
  /**
   * Get hooks interface
   */
  get hooks(): SeasonsStarsHooks {
    return this.hookManager;
  }
  
  /**
   * Check if specific feature is available
   */
  hasFeature(feature: string): boolean {
    return this.getFeatureVersion(feature) !== null;
  }
  
  /**
   * Get feature version for compatibility checking
   */
  getFeatureVersion(feature: string): string | null {
    const version = this.version;
    
    // Map features to version requirements
    const featureMap: Record<string, string> = {
      'basic-api': '1.0.0',
      'widget-system': '1.1.0',
      'sidebar-buttons': '1.2.0',
      'mini-widget': '1.2.0',
      'time-advancement': '1.2.0',
      'multiple-calendars': '1.3.0',
      'grid-widget': '1.3.0',
      'bridge-interface': '2.0.0'
    };
    
    const requiredVersion = featureMap[feature];
    if (!requiredVersion) {
      return null;
    }
    
    // Simple version comparison (can be enhanced with semantic versioning)
    return this.compareVersions(version, requiredVersion) >= 0 ? version : null;
  }
  
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part !== v2Part) {
        return v1Part - v2Part;
      }
    }
    
    return 0;
  }
  
  /**
   * Clean up integration resources
   */
  cleanup(): void {
    this.hookManager.cleanup();
    this.widgetManager.cleanup();
    SeasonsStarsIntegration.instance = null;
  }
}

/**
 * API implementation that wraps the calendar manager
 */
class IntegrationAPI implements SeasonsStarsAPI {
  constructor(private manager: CalendarManager) {}
  
  getCurrentDate(calendarId?: string): CalendarDate {
    return this.manager.getCurrentDate(calendarId);
  }
  
  worldTimeToDate(timestamp: number, calendarId?: string): CalendarDate {
    return this.manager.worldTimeToDate(timestamp, calendarId);
  }
  
  dateToWorldTime(date: CalendarDate, calendarId?: string): number {
    return this.manager.dateToWorldTime(date, calendarId);
  }
  
  formatDate(date: CalendarDate, options?: any): string {
    return this.manager.formatDate(date, options);
  }
  
  getActiveCalendar(): Calendar {
    return this.manager.getActiveCalendar();
  }
  
  async setActiveCalendar(calendarId: string): Promise<void> {
    return this.manager.setActiveCalendar(calendarId);
  }
  
  getAvailableCalendars(): string[] {
    return this.manager.getAvailableCalendars();
  }
  
  async advanceDays(days: number, calendarId?: string): Promise<void> {
    if (this.manager.advanceDays) {
      return this.manager.advanceDays(days, calendarId);
    }
    throw new Error('Time advancement not supported');
  }
  
  async advanceHours(hours: number, calendarId?: string): Promise<void> {
    if (this.manager.advanceHours) {
      return this.manager.advanceHours(hours, calendarId);
    }
    throw new Error('Time advancement not supported');
  }
  
  async advanceMinutes(minutes: number, calendarId?: string): Promise<void> {
    if (this.manager.advanceMinutes) {
      return this.manager.advanceMinutes(minutes, calendarId);
    }
    throw new Error('Time advancement not supported');
  }
  
  getMonthNames(calendarId?: string): string[] {
    const calendar = calendarId ? 
      this.manager.getCalendar(calendarId) : 
      this.manager.getActiveCalendar();
    
    return calendar.months.map(month => month.name);
  }
  
  getWeekdayNames(calendarId?: string): string[] {
    const calendar = calendarId ? 
      this.manager.getCalendar(calendarId) : 
      this.manager.getActiveCalendar();
    
    return calendar.weekdays || [];
  }
  
  getSunriseSunset(date: CalendarDate, calendarId?: string): TimeOfDay {
    // Default implementation - can be enhanced with calendar-specific data
    return {
      sunrise: 6,  // 6 AM
      sunset: 18   // 6 PM
    };
  }
  
  getSeasonInfo(date: CalendarDate, calendarId?: string): SeasonInfo {
    // Default seasonal calculation - can be enhanced with calendar-specific data
    const month = date.month;
    
    if (month >= 3 && month <= 5) {
      return { name: 'Spring', icon: 'spring' };
    } else if (month >= 6 && month <= 8) {
      return { name: 'Summer', icon: 'summer' };
    } else if (month >= 9 && month <= 11) {
      return { name: 'Fall', icon: 'fall' };
    } else {
      return { name: 'Winter', icon: 'winter' };
    }
  }
}

/**
 * Widget manager for bridge integration
 */
class IntegrationWidgetManager implements SeasonsStarsWidgets {
  private changeCallbacks: ((widgets: SeasonsStarsWidgets) => void)[] = [];
  
  get main(): BridgeCalendarWidget | null {
    const widget = CalendarWidget.getInstance();
    return widget ? new BridgeWidgetWrapper(widget, 'main') : null;
  }
  
  get mini(): BridgeCalendarWidget | null {
    const widget = CalendarMiniWidget.getInstance();
    return widget ? new BridgeWidgetWrapper(widget, 'mini') : null;
  }
  
  get grid(): BridgeCalendarWidget | null {
    const widget = CalendarGridWidget.getInstance();
    return widget ? new BridgeWidgetWrapper(widget, 'grid') : null;
  }
  
  getPreferredWidget(preference: WidgetPreference = WidgetPreference.ANY): BridgeCalendarWidget | null {
    switch (preference) {
      case WidgetPreference.MAIN:
        return this.main;
      case WidgetPreference.MINI:
        return this.mini;
      case WidgetPreference.GRID:
        return this.grid;
      case WidgetPreference.ANY:
      default:
        return this.mini || this.main || this.grid;
    }
  }
  
  onWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void {
    this.changeCallbacks.push(callback);
  }
  
  offWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index > -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }
  
  notifyWidgetChange(): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(this);
      } catch (error) {
        console.error('Widget change callback error:', error);
      }
    }
  }
  
  cleanup(): void {
    this.changeCallbacks.length = 0;
  }
}

/**
 * Wrapper for widget instances to provide bridge interface
 */
class BridgeWidgetWrapper implements BridgeCalendarWidget {
  constructor(
    private widget: any,
    private widgetType: string
  ) {}
  
  get id(): string {
    return `${this.widgetType}-widget`;
  }
  
  get isVisible(): boolean {
    return this.widget.rendered || false;
  }
  
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    if (typeof this.widget.addSidebarButton === 'function') {
      this.widget.addSidebarButton(name, icon, tooltip, callback);
    } else {
      throw new Error(`Widget ${this.widgetType} does not support sidebar buttons`);
    }
  }
  
  removeSidebarButton(name: string): void {
    if (typeof this.widget.removeSidebarButton === 'function') {
      this.widget.removeSidebarButton(name);
    }
  }
  
  hasSidebarButton(name: string): boolean {
    if (typeof this.widget.hasSidebarButton === 'function') {
      return this.widget.hasSidebarButton(name);
    }
    return false;
  }
  
  getInstance(): any {
    return this.widget;
  }
}

/**
 * Hook manager for bridge integration
 */
class IntegrationHookManager implements SeasonsStarsHooks {
  private hookCallbacks: Map<string, Function[]> = new Map();
  
  constructor(private manager: CalendarManager) {
    this.setupHookListeners();
  }
  
  private setupHookListeners(): void {
    // Listen to internal S&S hooks and translate for bridges
    Hooks.on('seasons-stars:dateChanged', (data: any) => {
      this.emitToCallbacks('dateChanged', data);
    });
    
    Hooks.on('seasons-stars:calendarChanged', (data: any) => {
      this.emitToCallbacks('calendarChanged', data);
    });
    
    Hooks.on('seasons-stars:ready', (data: any) => {
      this.emitToCallbacks('ready', data);
    });
  }
  
  onDateChanged(callback: (event: DateChangeEvent) => void): void {
    this.addCallback('dateChanged', callback);
  }
  
  onCalendarChanged(callback: (event: CalendarChangeEvent) => void): void {
    this.addCallback('calendarChanged', callback);
  }
  
  onReady(callback: (event: ReadyEvent) => void): void {
    this.addCallback('ready', callback);
  }
  
  off(hookName: string, callback: Function): void {
    const callbacks = this.hookCallbacks.get(hookName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  private addCallback(hookName: string, callback: Function): void {
    if (!this.hookCallbacks.has(hookName)) {
      this.hookCallbacks.set(hookName, []);
    }
    this.hookCallbacks.get(hookName)!.push(callback);
  }
  
  private emitToCallbacks(hookName: string, data: any): void {
    const callbacks = this.hookCallbacks.get(hookName);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Hook callback error for ${hookName}:`, error);
        }
      }
    }
  }
  
  cleanup(): void {
    this.hookCallbacks.clear();
    // Note: We don't remove the Foundry hooks as other parts of S&S may still need them
  }
}