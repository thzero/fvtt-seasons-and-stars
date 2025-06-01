/**
 * Efficient date-based storage and retrieval system for calendar notes
 */

import type { CalendarDate as ICalendarDate } from '../types/calendar';

/**
 * High-performance storage system with date-based indexing
 */
export class NoteStorage {
  private dateIndex: Map<string, Set<string>> = new Map();
  private noteCache: Map<string, JournalEntry> = new Map();
  private cacheSize = 100; // Limit cache size to prevent memory issues
  private indexBuilt = false;

  /**
   * Initialize the storage system
   */
  initialize(): void {
    this.buildDateIndex();
    this.indexBuilt = true;
    console.log('Seasons & Stars | Note storage initialized');
  }

  /**
   * Store a note with date indexing
   */
  async storeNote(note: JournalEntry, date: ICalendarDate): Promise<void> {
    if (!this.indexBuilt) {
      this.initialize();
    }

    const dateKey = this.getDateKey(date);
    this.addToDateIndex(dateKey, note.id);
    
    // Add to cache
    this.addToCache(note.id, note);
  }

  /**
   * Remove a note from storage and indexing
   */
  async removeNote(noteId: string): Promise<void> {
    // Remove from all date indices
    for (const [dateKey, noteIds] of this.dateIndex.entries()) {
      if (noteIds.has(noteId)) {
        this.removeFromDateIndex(dateKey, noteId);
      }
    }

    // Remove from cache
    this.noteCache.delete(noteId);
  }

  /**
   * Find notes by specific date (fast retrieval using index)
   */
  async findNotesByDate(date: ICalendarDate): Promise<JournalEntry[]> {
    if (!this.indexBuilt) {
      this.initialize();
    }

    const dateKey = this.getDateKey(date);
    const noteIds = this.dateIndex.get(dateKey) || new Set();
    
    const notes: JournalEntry[] = [];
    for (const noteId of noteIds) {
      const note = this.getFromCache(noteId) || game.journal?.get(noteId);
      if (note && this.isCalendarNote(note)) {
        notes.push(note);
        // Add to cache if retrieved from game
        if (!this.noteCache.has(noteId)) {
          this.addToCache(noteId, note);
        }
      }
    }

    return this.sortNotesByCreation(notes);
  }

  /**
   * Find notes by date range (optimized for ranges)
   */
  async findNotesByDateRange(start: ICalendarDate, end: ICalendarDate): Promise<JournalEntry[]> {
    if (!this.indexBuilt) {
      this.initialize();
    }

    const notes: JournalEntry[] = [];
    const noteIds = new Set<string>();

    // Iterate through date range and collect note IDs
    const startKey = this.getDateKey(start);
    const endKey = this.getDateKey(end);

    for (const [dateKey, dayNoteIds] of this.dateIndex.entries()) {
      if (dateKey >= startKey && dateKey <= endKey) {
        for (const noteId of dayNoteIds) {
          noteIds.add(noteId);
        }
      }
    }

    // Retrieve notes
    for (const noteId of noteIds) {
      const note = this.getFromCache(noteId) || game.journal?.get(noteId);
      if (note && this.isCalendarNote(note)) {
        // Double-check date range for notes that span multiple days
        const noteFlags = note.flags?.['seasons-and-stars'];
        if (noteFlags?.startDate && this.isDateInRange(noteFlags.startDate, start, end)) {
          notes.push(note);
          // Add to cache if retrieved from game
          if (!this.noteCache.has(noteId)) {
            this.addToCache(noteId, note);
          }
        }
      }
    }

    return this.sortNotesByDate(notes);
  }

  /**
   * Rebuild the date index (call when notes are created/updated outside storage)
   */
  rebuildIndex(): void {
    console.log('Seasons & Stars | Rebuilding note storage index');
    this.dateIndex.clear();
    this.buildDateIndex();
    console.log(`Seasons & Stars | Index rebuilt with ${this.dateIndex.size} date entries`);
  }

  /**
   * Clear the cache to free memory
   */
  clearCache(): void {
    this.noteCache.clear();
    console.log('Seasons & Stars | Note cache cleared');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.noteCache.size,
      maxSize: this.cacheSize
    };
  }

  /**
   * Build the date index from existing journal entries
   */
  private buildDateIndex(): void {
    this.dateIndex.clear();
    
    if (!game.journal) {
      console.warn('Seasons & Stars | Game journal not available for indexing');
      return;
    }

    let indexedCount = 0;
    
    game.journal.forEach(journal => {
      const flags = journal.flags?.['seasons-and-stars'];
      if (this.isCalendarNote(journal) && flags?.dateKey) {
        this.addToDateIndex(flags.dateKey, journal.id);
        indexedCount++;
      }
    });

    console.log(`Seasons & Stars | Built date index for ${indexedCount} calendar notes`);
  }

  /**
   * Generate a date key for indexing (YYYY-MM-DD format)
   */
  private getDateKey(date: ICalendarDate): string {
    const year = date.year.toString().padStart(4, '0');
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Add a note to the date index
   */
  private addToDateIndex(dateKey: string, noteId: string): void {
    if (!this.dateIndex.has(dateKey)) {
      this.dateIndex.set(dateKey, new Set());
    }
    this.dateIndex.get(dateKey)!.add(noteId);
  }

  /**
   * Remove a note from the date index
   */
  private removeFromDateIndex(dateKey: string, noteId: string): void {
    const noteIds = this.dateIndex.get(dateKey);
    if (noteIds) {
      noteIds.delete(noteId);
      // Clean up empty date entries
      if (noteIds.size === 0) {
        this.dateIndex.delete(dateKey);
      }
    }
  }

  /**
   * Add note to cache with size management
   */
  private addToCache(noteId: string, note: JournalEntry): void {
    // Manage cache size
    if (this.noteCache.size >= this.cacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.noteCache.keys().next().value;
      if (firstKey) {
        this.noteCache.delete(firstKey);
      }
    }

    this.noteCache.set(noteId, note);
  }

  /**
   * Get note from cache
   */
  private getFromCache(noteId: string): JournalEntry | null {
    return this.noteCache.get(noteId) || null;
  }

  /**
   * Check if a journal entry is a calendar note
   */
  private isCalendarNote(journal: JournalEntry): boolean {
    const flags = journal.flags?.['seasons-and-stars'];
    return flags?.calendarNote === true;
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
   * Sort notes by creation time
   */
  private sortNotesByCreation(notes: JournalEntry[]): JournalEntry[] {
    return notes.sort((a, b) => {
      const aFlags = a.flags?.['seasons-and-stars'];
      const bFlags = b.flags?.['seasons-and-stars'];
      return (aFlags?.created || 0) - (bFlags?.created || 0);
    });
  }

  /**
   * Sort notes by date, then creation time
   */
  private sortNotesByDate(notes: JournalEntry[]): JournalEntry[] {
    return notes.sort((a, b) => {
      const aFlags = a.flags?.['seasons-and-stars'];
      const bFlags = b.flags?.['seasons-and-stars'];
      
      const aDate = aFlags?.startDate;
      const bDate = bFlags?.startDate;
      
      if (aDate && bDate) {
        const comparison = this.compareDates(aDate, bDate);
        if (comparison !== 0) return comparison;
      }
      
      return (aFlags?.created || 0) - (bFlags?.created || 0);
    });
  }
}

/**
 * Singleton instance for global access
 */
export const noteStorage = new NoteStorage();