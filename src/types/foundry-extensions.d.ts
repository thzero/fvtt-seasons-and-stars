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
import type { NoteCategories } from '../core/note-categories';

// Extend the Game interface to include S&S specific properties
declare global {
  interface Game {
    seasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any; // CalendarManager - avoiding circular import
      notes: NotesManagerInterface; // NotesManager interface
      categories: NoteCategories; // Note categories management
      integration: SeasonsStarsIntegration | null;
    };
  }

  interface Window {
    SeasonsStars?: {
      api: SeasonsStarsAPI;
      manager: any;
      notes: any;
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

// Notes Manager interface for type safety
export interface NotesManagerInterface {
  createNote(data: any): Promise<JournalEntry>;
  updateNote(noteId: string, data: any): Promise<JournalEntry>;
  deleteNote(noteId: string): Promise<void>;
  getNote(noteId: string): Promise<JournalEntry | null>;
  getNotesForDate(date: CalendarDate): Promise<JournalEntry[]>;
  getNotesForDateRange(start: CalendarDate, end: CalendarDate): Promise<JournalEntry[]>;
  setNoteModuleData(noteId: string, moduleId: string, data: any): Promise<void>;
  getNoteModuleData(noteId: string, moduleId: string): any;
  storage: {
    findNotesByDateSync(date: CalendarDate): JournalEntry[];
  };
}


