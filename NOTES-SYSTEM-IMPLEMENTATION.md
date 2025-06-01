# Notes System Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive notes system in Seasons & Stars that provides full Simple Calendar API compatibility, particularly for modules like Simple Weather that require persistent calendar notes with flag-based data storage.

## Current State Analysis

### What Works Now
- ✅ **Basic API stubs** - Simple Calendar bridge has placeholder note methods
- ✅ **Simple Weather core features** - Weather generation, display, effects all work
- ✅ **JournalEntry creation** - Basic note creation exists but lacks calendar integration

### What's Missing
- ❌ **Date-based organization** - No system for retrieving notes by calendar date
- ❌ **Persistent calendar integration** - Notes don't integrate with calendar widgets
- ❌ **Flag storage support** - Limited support for module-specific data
- ❌ **Note management UI** - No interface for creating/editing calendar notes
- ❌ **Search and filtering** - No way to find notes by date, content, or category

## Architecture Design

### Core Components

#### 1. Notes Manager (`src/core/notes-manager.ts`)
**Purpose**: Central coordination for all note operations

```typescript
export class NotesManager {
  private storage: NoteStorage;
  private permissions: NotePermissions;
  
  // Core CRUD operations
  async createNote(data: CreateNoteData): Promise<JournalEntry>
  async updateNote(noteId: string, data: UpdateNoteData): Promise<JournalEntry>
  async deleteNote(noteId: string): Promise<void>
  async getNote(noteId: string): Promise<JournalEntry | null>
  
  // Date-based retrieval
  async getNotesForDate(date: ICalendarDate): Promise<JournalEntry[]>
  async getNotesForDateRange(start: ICalendarDate, end: ICalendarDate): Promise<JournalEntry[]>
  
  // Calendar integration
  async initializeNotesFolder(): Promise<Folder>
  async getOrCreateNotesFolder(): Promise<Folder>
  
  // Module integration support
  async setNoteModuleData(noteId: string, moduleId: string, data: any): Promise<void>
  async getNoteModuleData(noteId: string, moduleId: string): any
}
```

#### 2. Note Storage (`src/core/note-storage.ts`)
**Purpose**: Efficient date-based storage and retrieval

```typescript
export class NoteStorage {
  // Date indexing for fast retrieval
  private dateIndex: Map<string, Set<string>> = new Map();
  
  // Storage operations
  async storeNote(note: JournalEntry, date: ICalendarDate): Promise<void>
  async removeNote(noteId: string): Promise<void>
  async findNotesByDate(date: ICalendarDate): Promise<JournalEntry[]>
  async findNotesByDateRange(start: ICalendarDate, end: ICalendarDate): Promise<JournalEntry[]>
  
  // Index management
  private buildDateIndex(): void
  private getDateKey(date: ICalendarDate): string
  private addToDateIndex(dateKey: string, noteId: string): void
  private removeFromDateIndex(dateKey: string, noteId: string): void
}
```

#### 3. Note Document Wrapper (`src/core/note-document.ts`)
**Purpose**: Calendar-specific JournalEntry management

```typescript
export class CalendarNote {
  constructor(private journal: JournalEntry) {}
  
  // Calendar metadata
  get startDate(): ICalendarDate | null
  get endDate(): ICalendarDate | null
  get isAllDay(): boolean
  get calendarId(): string
  get category(): string
  
  // Content management
  get title(): string
  get content(): string
  async updateContent(content: string): Promise<void>
  
  // Module integration
  async setModuleFlag(moduleId: string, key: string, data: any): Promise<void>
  getModuleFlag(moduleId: string, key: string): any
  
  // Calendar integration
  isVisibleToUser(user: User): boolean
  isEditableByUser(user: User): boolean
}
```

#### 4. Permissions Manager (`src/core/note-permissions.ts`)
**Purpose**: Handle note visibility and editing permissions

```typescript
export class NotePermissions {
  // Permission checking
  canCreateNote(user: User): boolean
  canEditNote(user: User, note: JournalEntry): boolean
  canDeleteNote(user: User, note: JournalEntry): boolean
  canViewNote(user: User, note: JournalEntry): boolean
  
  // Ownership management
  setNoteOwnership(note: JournalEntry, ownership: any): Promise<void>
  
  // GM-only features
  isGMOnlyFeature(action: string): boolean
}
```

### Data Structures

#### Note Flags Structure
```typescript
interface CalendarNoteFlags {
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
    recurring?: RecurringPattern;
    created: number;           // timestamp
    modified: number;          // timestamp
  };
  [moduleId: string]: any;     // Module-specific data
}
```

#### Simple Calendar API Compatibility
```typescript
interface SimpleCalendarNote {
  // Core properties (0-based for SC compatibility)
  year: number;
  month: number;              // 0-based
  day: number;                // 0-based
  
  // Display data
  title: string;
  content: string;
  allDay: boolean;
  
  // Foundry integration
  journalEntryId: string;
  
  // Enhanced data
  startDate: any;
  endDate?: any;
  author: string;
  playerVisible: boolean;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (8-12 hours)

#### Tasks
1. **Create NotesManager class** (3-4 hours)
   - Basic CRUD operations
   - Folder management for calendar notes
   - Integration with existing calendar system

2. **Implement NoteStorage system** (2-3 hours)
   - Date-based indexing for fast retrieval
   - Efficient search algorithms
   - Memory management for large note collections

3. **Build CalendarNote wrapper** (2-3 hours)
   - Calendar-specific JournalEntry management
   - Metadata handling and validation
   - Content management methods

4. **Add NotePermissions system** (1-2 hours)
   - User permission checking
   - Ownership management
   - GM-only feature controls

#### Deliverables
- ✅ **Complete notes infrastructure**
- ✅ **Date-based note organization**
- ✅ **Basic permission system**
- ✅ **Integration with existing calendar**

#### Success Criteria
- Can create, update, delete calendar notes
- Notes are organized by date efficiently
- Proper permission handling for GM/player access
- Integration with Seasons & Stars calendar system

### Phase 2: Simple Calendar API Integration (4-6 hours)

#### Tasks
1. **Complete API bridge methods** (2-3 hours)
   - Implement full `addNote()` with JournalEntry creation
   - Complete `getNotesForDay()` with date conversion
   - Finish `removeNote()` with proper cleanup

2. **Add date format conversion** (1-2 hours)
   - Handle 0-based (Simple Calendar) ↔ 1-based (S&S) conversion
   - Robust date validation and error handling
   - Timezone and calendar system considerations

3. **Implement module flag support** (1 hour)
   - Allow modules to store custom data in note flags
   - Support for Simple Weather's flag structure
   - Clean API for flag management

#### Deliverables
- ✅ **Complete Simple Calendar API compatibility**
- ✅ **Full Simple Weather integration**
- ✅ **Robust date handling**
- ✅ **Module flag support**

#### Success Criteria
- Simple Weather "Store weather in Simple Calendar notes" works perfectly
- All Simple Weather features function with S&S calendar
- Notes persist across sessions and date changes
- Complete API compatibility with existing Simple Calendar modules

### Phase 3: Calendar Widget Integration (3-4 hours) ✅ COMPLETED

#### Tasks ✅ COMPLETED
1. **Add note indicators to calendar widgets** (2 hours) ✅ COMPLETED
   - ✅ Visual indicators on calendar grid for days with notes via subtle borders
   - ✅ Note count badges for multiple notes (circular with count number)
   - ✅ Single note icons for days with one note (sticky-note icon)
   - ✅ Integration with existing widget rendering using month-based note loading

2. **Implement note creation UI** (1-2 hours) ✅ COMPLETED
   - ✅ Quick note creation from calendar widgets via hover-activated buttons
   - ✅ Date auto-population from widget context with comprehensive form fields
   - ✅ Basic note editing interface with Title, Content, Category, All Day, Player Visible

#### Deliverables ✅ COMPLETED
- ✅ **Visual note indicators on calendars** - Borders and badges show days with notes
- ✅ **Quick note creation from widgets** - Hover buttons enable rapid note creation
- ✅ **Seamless calendar integration** - Notes system integrated without disrupting navigation

#### Success Criteria ✅ ACHIEVED
- ✅ Users can see which days have notes through clear visual indicators
- ✅ Quick note creation from calendar grid with minimal clicks required
- ✅ Notes integrate naturally with existing UI and real-time updates

**Implementation Summary** (Commit: `5be67af`):
- **Files Modified**: calendar-grid-widget.ts (+153 lines), calendar-grid-widget.hbs (note indicators), calendar-grid-widget.scss (+72 lines), foundry-v13-essentials.d.ts (+24 lines Dialog interface)
- **Key Features**: Synchronous note loading, hover-based creation buttons, permission-aware interface, real-time calendar updates, comprehensive error handling
- **User Experience**: Context-aware tooltips, event propagation control, hook system integration, category selection, responsive design

### Phase 4: Advanced Features (6-8 hours)

#### Tasks
1. **Note categories and tagging** (2-3 hours)
   - Category system for organizing notes
   - Tag-based filtering and search
   - Category-specific styling and icons

2. **Recurring events system** (2-3 hours)
   - Daily, weekly, monthly recurring patterns
   - Exception handling for skipped occurrences
   - Efficient storage of recurring note data

3. **Search and filtering** (2 hours)
   - Content-based note searching
   - Date range filtering
   - Category and tag-based filters

#### Deliverables
- ✅ **Complete note organization system**
- ✅ **Recurring events support**
- ✅ **Advanced search capabilities**

#### Success Criteria
- Notes can be organized by categories and tags
- Recurring events work reliably
- Fast search across large note collections

### Phase 5: Testing and Polish (4-6 hours)

#### Tasks
1. **Simple Weather integration testing** (2 hours)
   - Test all Simple Weather features with S&S notes
   - Verify data persistence and flag handling
   - Cross-module compatibility testing

2. **Performance optimization** (1-2 hours)
   - Optimize note retrieval for large collections
   - Memory management improvements
   - Lazy loading for better performance

3. **Documentation and examples** (1-2 hours)
   - API documentation for developers
   - User guide for note management
   - Integration examples for other modules

#### Deliverables
- ✅ **Comprehensive testing coverage**
- ✅ **Performance optimizations**
- ✅ **Complete documentation**

#### Success Criteria
- All tests pass consistently
- Performance remains good with 1000+ notes
- Clear documentation for users and developers

## Technical Implementation Details

### Foundry v13 Integration Patterns

#### JournalEntry Creation
```typescript
// Create calendar note with proper v13 structure
async createCalendarNote(data: CreateNoteData): Promise<JournalEntry> {
  const noteFolder = await this.getOrCreateNotesFolder();
  
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
        calendarId: data.calendarId || 'default',
        category: data.category || 'general',
        created: Date.now(),
        modified: Date.now()
      }
    }
  });
  
  // Create content page using v13 pages system
  await journal.createEmbeddedDocuments("JournalEntryPage", [{
    type: 'text',
    name: 'Content',
    text: { content: data.content }
  }]);
  
  return journal;
}
```

#### Date-Based Retrieval
```typescript
// Efficient date-based note lookup
async getNotesForDate(date: ICalendarDate): Promise<JournalEntry[]> {
  const dateKey = this.formatDateKey(date);
  
  // Use game.journal collection with flags filtering
  const notes = game.journal.filter(journal => {
    const flags = journal.flags?.['seasons-and-stars'];
    return flags?.calendarNote && flags?.dateKey === dateKey;
  });
  
  // Sort by creation time
  return notes.sort((a, b) => {
    const aFlags = a.flags['seasons-and-stars'];
    const bFlags = b.flags['seasons-and-stars'];
    return (aFlags?.created || 0) - (bFlags?.created || 0);
  });
}
```

#### Module Flag Management
```typescript
// Support for module-specific data storage
async setNoteModuleData(noteId: string, moduleId: string, data: any): Promise<void> {
  const journal = game.journal.get(noteId);
  if (!journal) throw new Error(`Note ${noteId} not found`);
  
  await journal.setFlag(moduleId, 'data', data);
  
  // Update modification timestamp
  await journal.setFlag('seasons-and-stars', 'modified', Date.now());
}
```

### Simple Calendar API Compatibility Layer

#### Complete API Implementation
```typescript
// Full Simple Calendar notes API in compatibility bridge
export const notesAPI = {
  // Core CRUD operations
  async addNote(title: string, content: string, startDate: any, endDate: any, allDay: boolean): Promise<any> {
    const provider = this.getProvider();
    if (!provider) throw new Error('No calendar provider available');
    
    // Convert Simple Calendar format (0-based) to S&S format (1-based)
    const convertedStartDate = this.convertSCDateToSS(startDate);
    const convertedEndDate = endDate ? this.convertSCDateToSS(endDate) : null;
    
    const note = await provider.createNote({
      title,
      content,
      startDate: convertedStartDate,
      endDate: convertedEndDate,
      allDay,
      playerVisible: true
    });
    
    // Return Simple Calendar compatible object
    return this.convertNoteToSCFormat(note);
  },
  
  async removeNote(noteId: string): Promise<void> {
    const provider = this.getProvider();
    if (!provider) throw new Error('No calendar provider available');
    
    await provider.deleteNote(noteId);
  },
  
  getNotesForDay(year: number, month: number, day: number): any[] {
    const provider = this.getProvider();
    if (!provider) return [];
    
    // Convert 0-based SC format to 1-based S&S format
    const date = {
      year,
      month: month + 1,
      day: day + 1
    };
    
    const notes = provider.getNotesForDate(date);
    return notes.map(note => this.convertNoteToSCFormat(note));
  }
};
```

### Performance Considerations

#### Date Index Optimization
```typescript
// Efficient date indexing for fast retrieval
class NoteStorage {
  private dateIndex: Map<string, Set<string>> = new Map();
  
  private buildDateIndex(): void {
    this.dateIndex.clear();
    
    game.journal.forEach(journal => {
      const flags = journal.flags?.['seasons-and-stars'];
      if (flags?.calendarNote && flags?.dateKey) {
        this.addToDateIndex(flags.dateKey, journal.id);
      }
    });
  }
  
  async findNotesByDate(date: ICalendarDate): Promise<JournalEntry[]> {
    const dateKey = this.formatDateKey(date);
    const noteIds = this.dateIndex.get(dateKey) || new Set();
    
    return Array.from(noteIds)
      .map(id => game.journal.get(id))
      .filter(Boolean) as JournalEntry[];
  }
}
```

#### Memory Management
```typescript
// Lazy loading for large note collections
class NotesManager {
  private noteCache: Map<string, CalendarNote> = new Map();
  private cacheSize = 100; // Limit cache size
  
  async getNote(noteId: string): Promise<CalendarNote | null> {
    // Check cache first
    if (this.noteCache.has(noteId)) {
      return this.noteCache.get(noteId)!;
    }
    
    // Load from Foundry documents
    const journal = game.journal.get(noteId);
    if (!journal) return null;
    
    const note = new CalendarNote(journal);
    
    // Add to cache with size management
    if (this.noteCache.size >= this.cacheSize) {
      const firstKey = this.noteCache.keys().next().value;
      this.noteCache.delete(firstKey);
    }
    
    this.noteCache.set(noteId, note);
    return note;
  }
}
```

## Integration Points

### Calendar Widget Integration
- **Note indicators** on calendar grid showing days with notes
- **Quick creation** from calendar widget context menus
- **Note count badges** for days with multiple notes
- **Category color coding** for visual organization

### Hook System Integration
```typescript
// Emit hooks for module integration
Hooks.call('seasons-stars:noteCreated', note);
Hooks.call('seasons-stars:noteUpdated', note);
Hooks.call('seasons-stars:noteDeleted', noteId);

// Listen for calendar changes to update note displays
Hooks.on('seasons-stars:dateChanged', (newDate) => {
  this.updateNoteDisplay(newDate);
});
```

### Module API Exposure
```typescript
// Expose notes API for other modules
game.seasonsStars.notes = {
  create: (data) => notesManager.createNote(data),
  get: (id) => notesManager.getNote(id),
  update: (id, data) => notesManager.updateNote(id, data),
  delete: (id) => notesManager.deleteNote(id),
  getForDate: (date) => notesManager.getNotesForDate(date),
  search: (query) => notesManager.searchNotes(query)
};
```

## Testing Strategy

### Unit Tests
- **NotesManager CRUD operations**
- **Date conversion utilities**
- **Permission checking logic**
- **Storage and retrieval efficiency**

### Integration Tests
- **Simple Weather compatibility**
- **Calendar widget integration**
- **Cross-module flag handling**
- **Foundry v13 document operations**

### Performance Tests
- **Large note collection handling** (1000+ notes)
- **Date range query performance**
- **Memory usage optimization**
- **UI responsiveness with many notes**

## Risk Assessment

### Technical Risks
- **Foundry v13 API changes** - Mitigation: Use stable document APIs
- **Performance with large datasets** - Mitigation: Efficient indexing and caching
- **Module compatibility issues** - Mitigation: Comprehensive testing with popular modules

### User Experience Risks
- **UI complexity** - Mitigation: Progressive disclosure, simple defaults
- **Data migration** - Mitigation: Clear migration tools and documentation
- **Learning curve** - Mitigation: Good documentation and examples

## Success Metrics

### Technical Success
- ✅ **100% Simple Weather compatibility** - All features work seamlessly
- ✅ **API completeness** - Full Simple Calendar notes API implemented
- ✅ **Performance targets** - Sub-100ms response for note operations
- ✅ **Memory efficiency** - Stable memory usage with large note collections

### User Experience Success
- ✅ **Intuitive note creation** - Users can create notes easily
- ✅ **Visual integration** - Notes integrate naturally with calendar widgets
- ✅ **Reliable persistence** - Notes survive session restarts and updates
- ✅ **Cross-module compatibility** - Works with existing FoundryVTT modules

## Post-Implementation Considerations

### Documentation Updates
- **API reference** for developers using the notes system
- **User guide** for creating and managing calendar notes
- **Migration guide** for users switching from Simple Calendar
- **Integration examples** for module developers

### Future Enhancements
- **Advanced recurring patterns** - More complex recurrence rules
- **Note sharing and collaboration** - Multi-user note editing
- **Export/import functionality** - Backup and migration tools
- **Advanced search** - Full-text search with highlighting
- **Calendar sync** - Integration with external calendar services

### Maintenance Plan
- **Regular testing** with Foundry updates
- **Performance monitoring** as note collections grow
- **User feedback integration** for UX improvements
- **Module compatibility updates** as ecosystem evolves

---

**Total Implementation Time: 25-35 hours**
**Priority: Phase 1 & 2 for Simple Weather compatibility (12-18 hours)**