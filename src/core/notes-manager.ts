/**
 * Notes management system for Seasons & Stars calendar integration
 */

import type { CalendarDate as ICalendarDate } from '../types/calendar';
import { CalendarDate } from './calendar-date';
import { NoteStorage } from './note-storage';
import { notePermissions } from './note-permissions';

export interface CreateNoteData {
  title: string;
  content: string;
  startDate: ICalendarDate;
  endDate?: ICalendarDate;
  allDay: boolean;
  calendarId?: string;
  category?: string;
  tags?: string[];
  playerVisible: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  startDate?: ICalendarDate;
  endDate?: ICalendarDate;
  allDay?: boolean;
  category?: string;
  tags?: string[];
  playerVisible?: boolean;
}

export interface CalendarNoteFlags {
  'seasons-and-stars': {
    calendarNote: true;
    version: string;
    dateKey: string;           // "2024-12-25" (1-based storage)
    startDate: ICalendarDate;
    endDate?: ICalendarDate;
    allDay: boolean;
    calendarId: string;
    category?: string;
    tags?: string[];
    created: number;           // timestamp
    modified: number;          // timestamp
  };
  [moduleId: string]: any;     // Module-specific data
}

/**
 * Central coordinator for all calendar note operations
 */
export class NotesManager {
  private initialized: boolean = false;
  private notesFolderId: string | null = null;
  private storage: NoteStorage;

  constructor() {
    this.storage = new NoteStorage();
  }

  /**
   * Initialize the notes manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Seasons & Stars | Initializing Notes Manager');
    
    // Initialize storage system
    this.storage.initialize();
    
    // Initialize notes folder
    await this.initializeNotesFolder();
    
    this.initialized = true;
    console.log('Seasons & Stars | Notes Manager initialized');
  }

  /**
   * Create a new calendar note
   */
  async createNote(data: CreateNoteData): Promise<JournalEntry> {
    if (!this.initialized) {
      throw new Error('NotesManager not initialized');
    }

    const noteFolder = await this.getOrCreateNotesFolder();
    const activeCalendar = game.seasonsStars?.manager?.getActiveCalendar();
    if (!activeCalendar) {
      throw new Error('No active calendar available');
    }

    // Create the journal entry
    const journal = await JournalEntry.create({
      name: data.title,
      folder: noteFolder.id,
      ownership: data.playerVisible ? { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } : {},
      flags: {
        'seasons-and-stars': {
          calendarNote: true,
          version: '1.0',
          dateKey: this.formatDateKey(data.startDate),
          startDate: data.startDate,
          endDate: data.endDate,
          allDay: data.allDay,
          calendarId: data.calendarId || activeCalendar.id,
          category: data.category || 'general',
          tags: data.tags || [],
          created: Date.now(),
          modified: Date.now()
        }
      }
    });

    if (!journal) {
      throw new Error('Failed to create journal entry');
    }

    // Create content page using v13 pages system
    await journal.createEmbeddedDocuments("JournalEntryPage", [{
      type: 'text',
      name: 'Content',
      text: { content: data.content }
    }]);

    // Add to storage system
    await this.storage.storeNote(journal, data.startDate);

    // Emit hook for note creation
    Hooks.callAll('seasons-stars:noteCreated', journal);

    console.log(`Seasons & Stars | Created note: ${data.title}`);
    return journal;
  }

  /**
   * Update an existing calendar note
   */
  async updateNote(noteId: string, data: UpdateNoteData): Promise<JournalEntry> {
    const journal = game.journal?.get(noteId);
    if (!journal) {
      throw new Error(`Note ${noteId} not found`);
    }

    // Verify this is a calendar note
    const flags = journal.flags?.['seasons-and-stars'];
    if (!flags?.calendarNote) {
      throw new Error(`Journal entry ${noteId} is not a calendar note`);
    }

    // Build update object
    const updateData: any = {};

    // Update basic properties
    if (data.title !== undefined) {
      updateData.name = data.title;
    }

    // Update flags
    const flagUpdates: any = {
      modified: Date.now()
    };

    if (data.startDate !== undefined) {
      flagUpdates.startDate = data.startDate;
      flagUpdates.dateKey = this.formatDateKey(data.startDate);
    }
    if (data.endDate !== undefined) flagUpdates.endDate = data.endDate;
    if (data.allDay !== undefined) flagUpdates.allDay = data.allDay;
    if (data.category !== undefined) flagUpdates.category = data.category;
    if (data.tags !== undefined) flagUpdates.tags = data.tags;

    updateData['flags.seasons-and-stars'] = flagUpdates;

    // Update ownership if visibility changed
    if (data.playerVisible !== undefined) {
      updateData.ownership = data.playerVisible ? 
        { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } : 
        {};
    }

    await journal.update(updateData);

    // Update content if provided
    if (data.content !== undefined) {
      const pages = journal.pages;
      if (pages.size > 0) {
        const contentPage = pages.contents[0];
        await contentPage.update({
          'text.content': data.content
        });
      }
    }

    // Emit hook for note update
    Hooks.callAll('seasons-stars:noteUpdated', journal);

    console.log(`Seasons & Stars | Updated note: ${journal.name}`);
    return journal;
  }

  /**
   * Delete a calendar note
   */
  async deleteNote(noteId: string): Promise<void> {
    const journal = game.journal?.get(noteId);
    if (!journal) {
      throw new Error(`Note ${noteId} not found`);
    }

    // Verify this is a calendar note
    const flags = journal.flags?.['seasons-and-stars'];
    if (!flags?.calendarNote) {
      throw new Error(`Journal entry ${noteId} is not a calendar note`);
    }

    // Remove from storage system
    await this.storage.removeNote(noteId);

    await journal.delete();

    // Emit hook for note deletion
    Hooks.callAll('seasons-stars:noteDeleted', noteId);

    console.log(`Seasons & Stars | Deleted note: ${journal.name}`);
  }

  /**
   * Get a specific calendar note
   */
  async getNote(noteId: string): Promise<JournalEntry | null> {
    const journal = game.journal?.get(noteId);
    if (!journal) return null;

    // Verify this is a calendar note
    const flags = journal.flags?.['seasons-and-stars'];
    if (!flags?.calendarNote) return null;

    return journal;
  }

  /**
   * Get all notes for a specific date
   */
  async getNotesForDate(date: ICalendarDate): Promise<JournalEntry[]> {
    if (!this.initialized) {
      throw new Error('NotesManager not initialized');
    }

    return await this.storage.findNotesByDate(date);
  }

  /**
   * Get all notes for a date range
   */
  async getNotesForDateRange(start: ICalendarDate, end: ICalendarDate): Promise<JournalEntry[]> {
    if (!this.initialized) {
      throw new Error('NotesManager not initialized');
    }

    return await this.storage.findNotesByDateRange(start, end);
  }

  /**
   * Set module-specific data on a note
   */
  async setNoteModuleData(noteId: string, moduleId: string, data: any): Promise<void> {
    const journal = game.journal?.get(noteId);
    if (!journal) {
      throw new Error(`Note ${noteId} not found`);
    }

    await journal.setFlag(moduleId, 'data', data);
    
    // Update modification timestamp
    await journal.setFlag('seasons-and-stars', 'modified', Date.now());
  }

  /**
   * Get module-specific data from a note
   */
  getNoteModuleData(noteId: string, moduleId: string): any {
    const journal = game.journal?.get(noteId);
    if (!journal) return null;

    return journal.getFlag(moduleId, 'data');
  }

  /**
   * Initialize the notes folder if it doesn't exist
   */
  private async initializeNotesFolder(): Promise<void> {
    await this.getOrCreateNotesFolder();
  }

  /**
   * Get or create the notes folder
   */
  async getOrCreateNotesFolder(): Promise<Folder> {
    // Try to find existing folder
    const existingFolder = game.folders?.find(f => 
      f.type === 'JournalEntry' && 
      f.getFlag('seasons-and-stars', 'notesFolder') === true
    );

    if (existingFolder) {
      this.notesFolderId = existingFolder.id;
      return existingFolder;
    }

    // Create new folder
    const folder = await Folder.create({
      name: 'Calendar Notes',
      type: 'JournalEntry',
      flags: {
        'seasons-and-stars': {
          notesFolder: true,
          version: '1.0'
        }
      }
    });

    if (!folder) {
      throw new Error('Failed to create notes folder');
    }

    this.notesFolderId = folder.id;
    console.log('Seasons & Stars | Created Calendar Notes folder');
    return folder;
  }

  /**
   * Format a date as a key for storage (YYYY-MM-DD format, 1-based)
   */
  private formatDateKey(date: ICalendarDate): string {
    const year = date.year.toString().padStart(4, '0');
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if a date is within a range (inclusive)
   */
  private isDateInRange(date: ICalendarDate, start: ICalendarDate, end: ICalendarDate): boolean {
    return this.compareDates(date, start) >= 0 && this.compareDates(date, end) <= 0;
  }

  /**
   * Compare two dates
   */
  private compareDates(a: ICalendarDate, b: ICalendarDate): number {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  }

  /**
   * Rebuild storage index (useful after bulk operations)
   */
  rebuildStorageIndex(): void {
    if (!this.initialized) return;
    this.storage.rebuildIndex();
  }

  /**
   * Get storage statistics for debugging
   */
  getStorageStats(): any {
    if (!this.initialized) return null;
    return this.storage.getCacheStats();
  }

  /**
   * Check if current user can create notes
   */
  canCreateNote(): boolean {
    return notePermissions.canCreateNote(game.user!);
  }

  /**
   * Check if current user can edit a note
   */
  canEditNote(noteId: string): boolean {
    const journal = game.journal?.get(noteId);
    if (!journal) return false;
    return notePermissions.canEditNote(game.user!, journal);
  }

  /**
   * Check if current user can delete a note
   */
  canDeleteNote(noteId: string): boolean {
    const journal = game.journal?.get(noteId);
    if (!journal) return false;
    return notePermissions.canDeleteNote(game.user!, journal);
  }

  /**
   * Check if current user can view a note
   */
  canViewNote(noteId: string): boolean {
    const journal = game.journal?.get(noteId);
    if (!journal) return false;
    return notePermissions.canViewNote(game.user!, journal);
  }

  /**
   * Get all notes the current user can view
   */
  getUserViewableNotes(): JournalEntry[] {
    return notePermissions.getViewableNotes(game.user!);
  }

  /**
   * Get all notes the current user can edit
   */
  getUserEditableNotes(): JournalEntry[] {
    return notePermissions.getEditableNotes(game.user!);
  }
}