# Seasons & Stars Notes System API Documentation

## Overview

The Seasons & Stars Notes System provides a comprehensive calendar-integrated note management solution for Foundry VTT. It offers full Simple Calendar API compatibility while providing advanced features like categories, recurring events, and powerful search capabilities.

## Core Components

### NotesManager

Central coordination for all note operations with calendar integration.

#### Initialization

```typescript
// The notes manager is automatically initialized when the module loads
const notesManager = game.seasonsStars.notes;

// Manual initialization (usually not needed)
await notesManager.initialize();
```

#### Basic CRUD Operations

```typescript
// Create a new note
const noteData: CreateNoteData = {
  title: "Meeting with Council",
  content: "Discuss trade agreements and border security",
  startDate: { year: 2024, month: 3, day: 15, weekday: 1 },
  endDate: null, // Optional end date
  allDay: true,
  calendarId: "default",
  playerVisible: true,
  category: "event", // Optional category
  tags: ["important", "politics"] // Optional tags
};

const note = await notesManager.createNote(noteData);

// Update an existing note
const updateData: UpdateNoteData = {
  title: "Updated Meeting with Council",
  content: "Added agenda items",
  tags: ["important", "politics", "urgent"]
};

await notesManager.updateNote(note.id, updateData);

// Get a specific note
const retrievedNote = await notesManager.getNote(note.id);

// Delete a note
await notesManager.deleteNote(note.id);
```

#### Date-Based Retrieval

```typescript
// Get all notes for a specific date
const date = { year: 2024, month: 3, day: 15, weekday: 1 };
const notesForDay = await notesManager.getNotesForDate(date);

// Get notes for a date range
const startDate = { year: 2024, month: 3, day: 1, weekday: 4 };
const endDate = { year: 2024, month: 3, day: 31, weekday: 6 };
const notesForMonth = await notesManager.getNotesForDateRange(startDate, endDate);
```

#### Module Integration

```typescript
// Store module-specific data in a note
const weatherData = {
  temperature: 72,
  description: "Partly cloudy",
  humidity: 65
};

await notesManager.setNoteModuleData(note.id, "simple-weather", weatherData);

// Retrieve module-specific data
const retrievedWeatherData = notesManager.getNoteModuleData(note.id, "simple-weather");
```

### Categories System

Organize notes with predefined and custom categories.

#### Working with Categories

```typescript
// Get all available categories
const categories = notesManager.categories.getAllCategories();

// Create a custom category
const customCategory = {
  id: "custom-encounters",
  name: "Random Encounters", 
  description: "Notes about random encounters and NPCs",
  icon: "fas fa-dice-d20",
  color: "#8B4513"
};

await notesManager.categories.addCategory(customCategory);

// Get category by ID
const category = notesManager.categories.getCategory("event");

// Update a category
await notesManager.categories.updateCategory("custom-encounters", {
  description: "Updated description"
});

// Remove a category (moves notes to "general")
await notesManager.categories.removeCategory("custom-encounters");
```

#### Built-in Categories

- **general**: General notes and reminders
- **event**: Important events and meetings  
- **reminder**: Personal reminders and tasks
- **weather**: Weather-related information
- **story**: Story beats and narrative notes
- **combat**: Combat encounters and tactics
- **travel**: Travel plans and journey notes
- **npc**: NPC information and interactions

### Recurring Events

Create notes that repeat on specific patterns.

#### Basic Recurring Patterns

```typescript
// Daily recurring note
const dailyPattern: RecurringPattern = {
  frequency: 'daily',
  interval: 1, // Every day
  endDate: { year: 2024, month: 12, day: 31, weekday: 1 }
};

// Weekly recurring note (every Monday)
const weeklyPattern: RecurringPattern = {
  frequency: 'weekly',
  interval: 1,
  weekdays: [1], // Monday
  maxOccurrences: 52
};

// Monthly recurring note (3rd Friday of each month)
const monthlyPattern: RecurringPattern = {
  frequency: 'monthly',
  interval: 1,
  monthlyType: 'weekday',
  weekdayOrder: 3, // 3rd
  weekdays: [5] // Friday
};

// Create recurring note
const recurringNoteData: CreateNoteData = {
  title: "Town Council Meeting",
  content: "Regular council meeting",
  startDate: { year: 2024, month: 3, day: 15, weekday: 5 },
  allDay: true,
  recurring: weeklyPattern
};

const parentNote = await notesManager.createRecurringNote(recurringNoteData);
```

#### Managing Recurring Notes

```typescript
// Get all occurrences of a recurring note
const occurrences = notesManager.getRecurringOccurrences(parentNote.id);

// Update the recurring pattern
const newPattern: RecurringPattern = {
  frequency: 'weekly',
  interval: 2, // Every 2 weeks
  weekdays: [1, 3] // Monday and Wednesday
};

await notesManager.updateRecurringPattern(parentNote.id, newPattern);

// Delete entire recurring series
await notesManager.deleteRecurringSeries(parentNote.id);

// Check if a note is part of a recurring series
const isParent = notesManager.isRecurringParent(note.id);
const isOccurrence = notesManager.isRecurringOccurrence(note.id);
```

### Search and Filtering

Powerful search capabilities across all notes.

#### Basic Search

```typescript
// Quick text search
const searchResults = await notesManager.quickSearch("council meeting");

// Search by category
const eventNotes = await notesManager.getByCategory("event");

// Search by tags
const importantNotes = await notesManager.getByTags(["important"]);

// Get upcoming notes (next 7 days)
const upcomingNotes = await notesManager.getUpcomingNotes(7);
```

#### Advanced Search

```typescript
// Complex search criteria
const searchCriteria: NoteSearchCriteria = {
  query: "trade agreement",
  dateFrom: { year: 2024, month: 1, day: 1, weekday: 1 },
  dateTo: { year: 2024, month: 12, day: 31, weekday: 7 },
  categories: ["event", "story"],
  tags: ["important"],
  excludeTags: ["cancelled"],
  playerVisible: true,
  sortBy: "date",
  sortOrder: "desc",
  limit: 50,
  offset: 0
};

const searchResult = await notesManager.advancedSearch(searchCriteria);
console.log(`Found ${searchResult.totalCount} matching notes`);
console.log(`Search took ${searchResult.searchTime}ms`);
```

### Performance Monitoring

Monitor and optimize notes system performance.

#### Performance Metrics

```typescript
// Get current performance metrics
const metrics = notesManager.getPerformanceMetrics();
console.log('Performance Metrics:', {
  totalNotes: metrics.totalNotes,
  indexedDates: metrics.indexedDates,
  cacheHitRate: metrics.cacheHitRate,
  memoryUsage: `${metrics.memoryUsage.toFixed(1)}MB`,
  lastSearchTime: `${metrics.searchTime}ms`
});

// Optimize performance for large collections
await notesManager.optimizePerformance();
```

## Simple Calendar API Compatibility

The notes system provides complete Simple Calendar API compatibility for seamless integration with existing modules.

### Available Methods

```typescript
// Access Simple Calendar API through window object
const api = window.SimpleCalendar.api;

// Add a note (Simple Calendar format)
const note = await api.addNote(
  "Weather Update",           // title
  "Sunny and warm today",     // content
  { year: 2024, month: 2, day: 14 }, // startDate (0-based month/day)
  null,                       // endDate
  true                        // allDay
);

// Get notes for a specific day (0-based month/day)
const notes = api.getNotesForDay(2024, 2, 14);

// Remove a note
await api.removeNote(note.id);

// Store module-specific data
await note.setFlag("simple-weather", "dailyWeather", weatherData);

// Retrieve module-specific data  
const weatherData = note.getFlag("simple-weather", "dailyWeather");
```

### Date Format Conversion

The compatibility layer automatically handles date format conversion:

- **Simple Calendar**: Uses 0-based months and days
- **Seasons & Stars**: Uses 1-based months and days

```typescript
// Simple Calendar format (0-based)
const scDate = { year: 2024, month: 2, day: 14 }; // March 15th

// Automatically converted to Seasons & Stars format (1-based)
const ssDate = { year: 2024, month: 3, day: 15 }; // March 15th
```

## Integration Examples

### Simple Weather Integration

```typescript
// Enable Simple Weather note storage in Simple Weather settings
// ModuleSettings.set('storeInSCNotes', true);

// Simple Weather will automatically:
// 1. Create notes for weather data using SimpleCalendar.api.addNote()
// 2. Store weather data in note flags using setFlag()
// 3. Retrieve existing weather notes using getNotesForDay()
// 4. All operations work seamlessly with Seasons & Stars notes
```

### Custom Module Integration

```typescript
// Your custom module can integrate with the notes system
class MyModule {
  async onDateChange(newDate) {
    // Get notes for the new date
    const notes = await game.seasonsStars.notes.getNotesForDate(newDate);
    
    // Filter for notes relevant to your module
    const myNotes = notes.filter(note => 
      note.getFlag('my-module', 'data')
    );
    
    // Process the notes
    this.processNotes(myNotes);
  }
  
  async createEventNote(eventData) {
    // Create a note for your event
    const noteData = {
      title: eventData.name,
      content: eventData.description,
      startDate: eventData.date,
      category: "event",
      tags: ["my-module", eventData.type]
    };
    
    const note = await game.seasonsStars.notes.createNote(noteData);
    
    // Store module-specific data
    await game.seasonsStars.notes.setNoteModuleData(
      note.id, 
      'my-module', 
      eventData
    );
    
    return note;
  }
}
```

## Data Structures

### CreateNoteData

```typescript
interface CreateNoteData {
  title: string;
  content: string;
  startDate: CalendarDate;
  endDate?: CalendarDate;
  allDay: boolean;
  calendarId: string;
  playerVisible?: boolean;
  category?: string;
  tags?: string[];
  recurring?: RecurringPattern;
}
```

### UpdateNoteData

```typescript
interface UpdateNoteData {
  title?: string;
  content?: string;
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  allDay?: boolean;
  category?: string;
  tags?: string[];
  recurring?: RecurringPattern;
}
```

### CalendarDate

```typescript
interface CalendarDate {
  year: number;
  month: number;  // 1-based (1-12)
  day: number;    // 1-based (1-31)
  weekday: number; // 0-based (0-6, Sunday-Saturday)
}
```

### RecurringPattern

```typescript
interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N periods
  
  // Weekly options
  weekdays?: number[]; // 0-6 for Sunday-Saturday
  
  // Monthly options
  monthlyType?: 'date' | 'weekday';
  weekdayOrder?: number; // 1st, 2nd, 3rd, 4th, -1 for last
  
  // Yearly options
  yearlyType?: 'date' | 'weekday';
  
  // Limits
  endDate?: CalendarDate;
  maxOccurrences?: number;
  
  // Exceptions
  skipDates?: CalendarDate[];
}
```

## Error Handling

The notes system provides comprehensive error handling:

```typescript
try {
  await notesManager.createNote(noteData);
} catch (error) {
  if (error.message.includes('permission')) {
    // Handle permission error
    ui.notifications.error("Insufficient permissions to create note");
  } else if (error.message.includes('invalid date')) {
    // Handle date validation error
    ui.notifications.error("Invalid date specified");
  } else {
    // Handle general error
    console.error('Note creation failed:', error);
    ui.notifications.error("Failed to create note");
  }
}
```

## Performance Best Practices

### For Large Collections (1000+ notes)

1. **Use date-based queries** when possible instead of searching all notes
2. **Enable pagination** for search results
3. **Monitor memory usage** with performance metrics
4. **Regular optimization** using `optimizePerformance()`

```typescript
// Good: Date-based query
const todayNotes = await notesManager.getNotesForDate(currentDate);

// Less efficient: Full search
const allNotes = await notesManager.advancedSearch({ query: "" });

// Monitor performance
const metrics = notesManager.getPerformanceMetrics();
if (metrics.memoryUsage > 100) { // 100MB threshold
  await notesManager.optimizePerformance();
}
```

### Search Optimization

```typescript
// Use specific search criteria to reduce result sets
const efficientSearch: NoteSearchCriteria = {
  dateFrom: recentDate,     // Limit date range
  categories: ["event"],    // Specific categories
  limit: 50,               // Reasonable limit
  sortBy: "date"           // Efficient sorting
};

// Avoid very broad searches
const inefficientSearch: NoteSearchCriteria = {
  query: "a",              // Too broad
  limit: 10000            // Too large
};
```

## Migration and Compatibility

### Migrating from Simple Calendar Notes

The system automatically detects and works with existing Simple Calendar notes. No migration is required - existing functionality continues to work seamlessly.

### Version Compatibility

- **Foundry VTT**: v13.340.0+
- **Simple Calendar**: All versions (through compatibility bridge)
- **Simple Weather**: v1.17.0+

## Troubleshooting

### Common Issues

1. **Notes not appearing**: Check if the calendar date format is correct (1-based for S&S)
2. **Performance issues**: Use `getPerformanceMetrics()` to identify bottlenecks
3. **Module integration**: Verify the compatibility bridge is loaded
4. **Permission errors**: Ensure proper GM/player permissions are set

### Debug Commands

```typescript
// Check system status
game.seasonsStars.notes.getPerformanceMetrics();

// Rebuild indexes
game.seasonsStars.notes.storage.rebuildIndex();

// Clear cache
game.seasonsStars.notes.storage.clearCache();

// Test Simple Calendar compatibility
window.SimpleCalendar?.api?.getNotesForDay(2024, 2, 14);
```

## Support and Development

For issues, feature requests, or contributions:

- **Documentation**: [docs.rayners.dev](https://docs.rayners.dev/seasons-and-stars/)
- **GitHub Issues**: [seasons-and-stars/issues](https://github.com/rayners/fvtt-seasons-and-stars/issues)
- **Discord**: Foundry VTT Community - #modules channel

## Changelog

### v1.0.0 - Notes System Release
- Complete notes system with CRUD operations
- Simple Calendar API compatibility
- Categories and tagging system
- Recurring events support
- Advanced search and filtering
- Performance optimization for large collections
- Comprehensive API documentation