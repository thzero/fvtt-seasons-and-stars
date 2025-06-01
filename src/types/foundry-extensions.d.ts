/**
 * Seasons & Stars Specific Type Extensions
 * 
 * These extend the base Foundry types with module-specific functionality.
 * Core Foundry types are provided by foundry-v13-essentials.d.ts
 */

import type { 
  SeasonsStarsCalendar, 
  CalendarDate, 
  DateFormatOptions 
} from './calendar';
import type { SeasonsStarsIntegration } from '../core/bridge-integration';

// Extend the Game interface to include S&S specific properties
declare global {
  interface Game {
    seasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any; // CalendarManager - avoiding circular import
      integration: SeasonsStarsIntegration | null;
    };
  }

  interface Window {
    SeasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any;
      integration: typeof SeasonsStarsIntegration;
    };
  }
}

// S&S API interface used by the module
export interface SeasonsStarsAPI {
  getCurrentDate(): CalendarDate | null;
  setCurrentDate(date: CalendarDate): Promise<boolean>;
  advanceTime(amount: number, unit: string): Promise<void>;
  getActiveCalendar(): SeasonsStarsCalendar | null;
  formatDate(date: CalendarDate, options?: DateFormatOptions): string;
}


