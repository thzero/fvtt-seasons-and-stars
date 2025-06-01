# Phase 2 Implementation Plan: Notes & Integration

**Target Timeline**: Q1 2025  
**Status**: Planning Phase  
**Version**: Seasons & Stars v2.0

Based on the roadmap and current architecture, this document outlines the implementation strategy for **Phase 2: Notes & Integration**.

## 🎯 Phase 2 Core Objectives

1. **Full Notes System** with Journal integration
2. **Complete Weather Module Support** 
3. **Advanced Hook System**

---

## 📝 1. Notes System Architecture

### Data Structure

```typescript
interface CalendarNote {
  id: string;
  title: string;
  content: string;
  date: CalendarDate;
  timeRange?: { start: number; end: number }; // minutes from midnight
  recurring?: RecurrencePattern;
  categories: string[];
  visibility: 'gm' | 'players' | 'all';
  journalEntryId?: string; // Link to Foundry Journal
  reminders?: ReminderConfig[];
}

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  endDate?: CalendarDate;
  customDays?: number[]; // For weekly patterns
}

interface ReminderConfig {
  type: 'notification' | 'chat' | 'journal';
  timing: number; // minutes before event
  message?: string;
}
```

### Storage Strategy

```typescript
// World-level settings for notes
game.settings.register('seasons-and-stars', 'calendar-notes', {
  scope: 'world',
  config: false,
  type: Object,
  default: {}
});

// User-level settings for note preferences
game.settings.register('seasons-and-stars', 'note-preferences', {
  scope: 'client',
  config: false,
  type: Object,
  default: { 
    showReminders: true, 
    categories: [],
    defaultVisibility: 'gm',
    reminderSound: true
  }
});
```

### UI Components

1. **Note Creation Dialog** - Rich text editor with date/time pickers
2. **Calendar Day Indicators** - Visual dots/badges for days with notes
3. **Note List Panel** - Filterable list view with search
4. **Note Details Sidebar** - Full note display with edit/delete
5. **Reminder Notifications** - Toast notifications for upcoming events
6. **Category Management** - Color-coded note categories
7. **Bulk Operations** - Multi-select for note management

---

## 🌤️ 2. Weather Module Support

### Simple Calendar Notes API Compatibility

```typescript
// Implement missing SimpleCalendar.api methods
class SimpleCalendarNotesAPI {
  
  // Core note management
  static addNote(note: SimpleCalendarNote): Promise<string> {
    // Convert SC note format to S&S format
    const ssNote = this.convertFromSimpleCalendar(note);
    return SeasonsStars.api.notes.create(ssNote);
  }
  
  static getNotes(date?: Date): SimpleCalendarNote[] {
    const ssNotes = SeasonsStars.api.notes.getByDate(date);
    return ssNotes.map(note => this.convertToSimpleCalendar(note));
  }
  
  static updateNote(noteId: string, updates: Partial<SimpleCalendarNote>): Promise<void> {
    const ssUpdates = this.convertFromSimpleCalendar(updates);
    return SeasonsStars.api.notes.update(noteId, ssUpdates);
  }
  
  static removeNote(noteId: string): Promise<void> {
    return SeasonsStars.api.notes.delete(noteId);
  }
  
  static searchNotes(query: string, options?: SearchOptions): SimpleCalendarNote[] {
    const ssNotes = SeasonsStars.api.notes.search(query, options);
    return ssNotes.map(note => this.convertToSimpleCalendar(note));
  }
  
  // Weather-specific methods
  static setWeatherForDate(date: Date, weather: WeatherData): Promise<void> {
    return this.addNote({
      title: `Weather: ${weather.temperature}°`,
      content: this.formatWeatherContent(weather),
      date: date,
      categories: ['weather'],
      visibility: 'all'
    });
  }
  
  static getWeatherForDate(date: Date): WeatherData | null {
    const weatherNotes = this.getNotes(date).filter(note => 
      note.categories?.includes('weather')
    );
    
    if (weatherNotes.length > 0) {
      return this.parseWeatherContent(weatherNotes[0]);
    }
    
    return null;
  }
}
```

### Weather Module Integration Points

1. **About Time Integration** - Automatic weather updates on time advancement
2. **Weather Control Integration** - Direct weather setting through calendar
3. **FX Master Integration** - Visual weather effects tied to calendar
4. **Custom Weather APIs** - Extensible weather data structure
5. **Climate Data** - Long-term weather pattern storage
6. **Seasonal Effects** - Automatic weather changes based on calendar seasons

---

## 🔗 3. Advanced Hook System

### New Hooks Implementation

```typescript
// Enhanced time change hooks
Hooks.call('seasonsStars.timeAdvanced', {
  previousTime: oldWorldTime,
  newTime: game.time.worldTime,
  previousDate: oldCalendarDate,
  newDate: currentCalendarDate,
  advancement: { days: 1, hours: 8, minutes: 30 }
});

// Note system hooks
Hooks.call('seasonsStars.noteCreated', noteData);
Hooks.call('seasonsStars.noteUpdated', { noteId, oldData, newData });
Hooks.call('seasonsStars.noteDeleted', noteData);
Hooks.call('seasonsStars.noteReminderTriggered', { note, timeUntil });

// Calendar system hooks
Hooks.call('seasonsStars.calendarChanged', {
  previousCalendar: oldCalendarId,
  newCalendar: newCalendarId,
  migrationData: conversionResults
});

// Weather integration hooks
Hooks.call('seasonsStars.weatherUpdated', {
  date: calendarDate,
  weather: weatherData,
  source: 'manual' | 'automatic' | 'module'
});

// UI interaction hooks
Hooks.call('seasonsStars.widgetOpened', { widgetType: 'calendar' | 'notes' });
Hooks.call('seasonsStars.dateSelected', { date: calendarDate, source: 'click' | 'navigation' });
```

### Backward Compatibility Hooks

```typescript
// Maintain Simple Calendar hook compatibility
Hooks.call(SimpleCalendar.Hooks.DateTimeChange, {
  date: scCompatibleDate,
  diff: timeDifference,
  source: 'seasons-and-stars'
});

Hooks.call(SimpleCalendar.Hooks.CalendarNoteUpdated, {
  noteId: noteId,
  note: convertedNote
});

Hooks.call(SimpleCalendar.Hooks.CalendarDateTimeChange, {
  date: scCompatibleDate,
  diff: timeDifference
});
```

---

## 📚 4. Journal Integration Strategy

### Two-Way Sync System

```typescript
class JournalIntegration {
  
  // Create journal entries from calendar notes
  static async createJournalFromNote(note: CalendarNote): Promise<JournalEntry> {
    const journalData = {
      name: `${note.title} (${this.formatDate(note.date)})`,
      content: this.formatNoteContent(note),
      folder: await this.getOrCreateCalendarFolder(),
      flags: {
        'seasons-and-stars': {
          noteId: note.id,
          calendarDate: note.date,
          syncMode: 'bidirectional'
        }
      }
    };
    
    return JournalEntry.create(journalData);
  }
  
  // Sync existing journal entries to calendar
  static async importJournalEntries(): Promise<void> {
    const entries = game.journal.contents.filter(entry => 
      entry.getFlag('seasons-and-stars', 'calendarDate')
    );
    
    for (const entry of entries) {
      await this.syncJournalToNote(entry);
    }
  }
  
  // Handle journal updates
  static onJournalUpdate(journal: JournalEntry, changes: any): void {
    const noteId = journal.getFlag('seasons-and-stars', 'noteId');
    if (noteId && changes.content) {
      SeasonsStars.api.notes.updateFromJournal(noteId, journal);
    }
  }
  
  // Batch operations
  static async exportNotesToJournal(noteIds: string[]): Promise<JournalEntry[]> {
    const results = [];
    for (const noteId of noteIds) {
      const note = SeasonsStars.api.notes.get(noteId);
      if (note) {
        results.push(await this.createJournalFromNote(note));
      }
    }
    return results;
  }
  
  // Folder management
  static async getOrCreateCalendarFolder(): Promise<Folder | null> {
    let folder = game.folders.find(f => 
      f.type === 'JournalEntry' && 
      f.getFlag('seasons-and-stars', 'isCalendarFolder')
    );
    
    if (!folder) {
      folder = await Folder.create({
        name: 'Calendar Events',
        type: 'JournalEntry',
        flags: {
          'seasons-and-stars': { isCalendarFolder: true }
        }
      });
    }
    
    return folder;
  }
}
```

---

## 🔄 5. Migration and Compatibility

### Simple Calendar Data Migration

```typescript
class SimpleCalendarMigration {
  
  // Migrate existing Simple Calendar notes
  static async migrateNotes(): Promise<MigrationResult> {
    const scNotes = this.getSimpleCalendarNotes();
    const results = {
      total: scNotes.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const scNote of scNotes) {
      try {
        const ssNote = this.convertNote(scNote);
        await SeasonsStars.api.notes.create(ssNote);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ note: scNote, error: error.message });
      }
    }
    
    return results;
  }
  
  // Convert Simple Calendar note format
  static convertNote(scNote: any): CalendarNote {
    return {
      id: foundry.utils.randomID(),
      title: scNote.title || 'Imported Note',
      content: scNote.content || '',
      date: this.convertDate(scNote.date),
      categories: scNote.categories || [],
      visibility: scNote.playerVisible ? 'all' : 'gm',
      recurring: this.convertRecurrence(scNote.repeats)
    };
  }
  
  // Handle calendar configuration migration
  static async migrateCalendarConfig(): Promise<void> {
    const scConfig = game.settings.get('foundryvtt-simple-calendar', 'configuration');
    if (scConfig) {
      const ssCalendar = this.convertCalendarConfig(scConfig);
      await this.importCustomCalendar(ssCalendar);
    }
  }
}
```

---

## 🛠️ 6. Implementation Timeline

### **Week 1-2: Core Notes System**
- [ ] Design note data structures and storage
- [ ] Implement basic CRUD operations for notes
- [ ] Create note creation/editing dialogs with rich text support
- [ ] Add calendar day indicators for notes
- [ ] Implement note categories and filtering

### **Week 3-4: UI Enhancement**
- [ ] Build note list panel with advanced filtering
- [ ] Add search functionality with full-text search
- [ ] Implement recurring notes with pattern support
- [ ] Create reminder system with multiple notification types
- [ ] Add bulk operations for note management

### **Week 5-6: Journal Integration**
- [ ] Two-way sync between notes and journal entries
- [ ] Import existing journal entries with date detection
- [ ] Handle journal folder organization automatically
- [ ] Add journal creation from notes with templates
- [ ] Implement conflict resolution for sync conflicts

### **Week 7-8: Weather Module Support**
- [ ] Implement Simple Calendar notes API compatibility layer
- [ ] Test with major weather modules (About Time, Weather Control, FX Master)
- [ ] Add weather-specific note templates and parsing
- [ ] Create weather integration hooks and events
- [ ] Implement climate data storage and retrieval

### **Week 9-10: Advanced Hooks & Testing**
- [ ] Implement comprehensive hook system with backward compatibility
- [ ] Add module integration examples and documentation
- [ ] Extensive testing with existing modules and systems
- [ ] Performance optimization for large note datasets
- [ ] Memory usage optimization and caching

### **Week 11-12: Polish & Release**
- [ ] Update documentation with new features and APIs
- [ ] Create migration tools for Simple Calendar users
- [ ] Beta testing with community feedback integration
- [ ] Final bug fixes and performance tuning
- [ ] Release Phase 2 with full feature set

---

## 🎯 7. Success Metrics

### **Compatibility Targets**
1. **Weather Module Compatibility**: 95% of existing weather modules work without changes
2. **Simple Calendar API Coverage**: 100% of commonly used API methods implemented
3. **Journal Sync Reliability**: 99.9% success rate for bidirectional sync

### **Performance Targets**
1. **Note Operations**: Complete in <100ms for datasets up to 10,000 notes
2. **Search Performance**: Return results in <200ms for full-text searches
3. **Memory Usage**: <50MB additional memory for typical note datasets
4. **UI Responsiveness**: <16ms frame time for smooth 60fps interactions

### **User Experience Targets**
1. **Hook Coverage**: All major calendar events trigger appropriate hooks
2. **User Adoption**: 80% of beta testers actively use notes system
3. **Migration Success**: 90% successful migration from Simple Calendar
4. **Community Feedback**: 4.5+ star rating on module reviews

### **Integration Success**
1. **Module Ecosystem**: 20+ modules verified compatible with Phase 2
2. **API Usage**: 10+ new modules built using Seasons & Stars APIs
3. **Documentation Quality**: <5% support requests due to unclear documentation

---

## 🚀 8. Risk Mitigation

### **Technical Risks**
- **Data Loss**: Implement comprehensive backup/restore for note migrations
- **Performance**: Use incremental loading and virtualization for large datasets
- **Compatibility**: Maintain extensive test suite for module interactions

### **Timeline Risks**
- **Scope Creep**: Lock feature set after Week 2, defer new features to Phase 3
- **Testing Delays**: Begin community beta testing at Week 8 instead of Week 11
- **Integration Issues**: Allocate 20% buffer time for unexpected compatibility problems

### **Adoption Risks**
- **Migration Complexity**: Provide automated migration tools and detailed guides
- **Feature Parity**: Ensure 100% feature parity with Simple Calendar core functionality
- **Documentation**: Create video tutorials and interactive guides for complex features

This implementation plan builds on the solid foundation of Phase 1 while maintaining backward compatibility and providing the advanced features needed for full Simple Calendar replacement.