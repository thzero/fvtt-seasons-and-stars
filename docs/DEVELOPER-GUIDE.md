# Developer Guide - Seasons & Stars

Complete API reference and integration guide for module developers working with Seasons & Stars.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Core API](#core-api)
- [Simple Calendar Compatibility](#simple-calendar-compatibility)
- [Hook System](#hook-system)
- [Calendar Data Structures](#calendar-data-structures)
- [Integration Examples](#integration-examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## 🚀 Getting Started

### API Access
Seasons & Stars exposes its API through the global `game` object:

```javascript
// Check if Seasons & Stars is available
if (game.seasonsStars) {
  const currentDate = game.seasonsStars.api.getCurrentDate();
  console.log('Current date:', currentDate);
}
```

### Detecting Seasons & Stars
```javascript
// Method 1: Direct check
const hasSeasonsStars = !!game.seasonsStars;

// Method 2: Feature detection
const hasAdvancedCalendar = typeof game.seasonsStars?.api?.getCurrentDate === 'function';

// Method 3: Version check (when available)
const version = game.seasonsStars?.VERSION;
```

## 🔧 Core API

### Date Retrieval

#### `getCurrentDate(calendarId?: string)`
Get the current date from the active calendar.

```javascript
// Get current date from active calendar
const currentDate = game.seasonsStars.api.getCurrentDate();
// Returns: { year: 2024, month: 12, day: 25, weekday: 3, time: { hour: 14, minute: 30, second: 0 } }

// Get date from specific calendar
const gregorianDate = game.seasonsStars.api.getCurrentDate('gregorian');
```

**Returns:** `CalendarDate | null`

### Time Manipulation

#### `advanceDays(days: number)`
Advance world time by specified number of days.

```javascript
// Advance by 1 day
await game.seasonsStars.api.advanceDays(1);

// Go back 3 days (negative values)
await game.seasonsStars.api.advanceDays(-3);
```

#### `advanceHours(hours: number)`
Advance world time by specified number of hours.

```javascript
// Advance by 8 hours (long rest)
await game.seasonsStars.api.advanceHours(8);

// Advance by 30 minutes
await game.seasonsStars.api.advanceMinutes(30);
```

#### Other Time Functions
```javascript
// Time advancement functions
await game.seasonsStars.api.advanceMinutes(minutes);
await game.seasonsStars.api.advanceWeeks(weeks);
await game.seasonsStars.api.advanceMonths(months);
await game.seasonsStars.api.advanceYears(years);
```

### Date Conversion

#### `dateToWorldTime(date: CalendarDate)`
Convert a calendar date to Foundry world time.

```javascript
const date = {
  year: 2024,
  month: 12,
  day: 25,
  weekday: 3,
  time: { hour: 12, minute: 0, second: 0 }
};

const worldTime = game.seasonsStars.api.dateToWorldTime(date);
console.log('World time:', worldTime); // Returns timestamp in seconds
```

#### `worldTimeToDate(timestamp: number)`
Convert Foundry world time to calendar date.

```javascript
const currentTime = game.time.worldTime;
const date = game.seasonsStars.api.worldTimeToDate(currentTime);
console.log('Calendar date:', date);
```

### Date Formatting

#### `formatDate(date: CalendarDate, options?: DateFormatOptions)`
Format a date according to calendar conventions.

```javascript
const date = game.seasonsStars.api.getCurrentDate();

// Default formatting
const formatted = game.seasonsStars.api.formatDate(date);
// Returns: "December 25th, 2024 CE"

// Custom formatting options
const custom = game.seasonsStars.api.formatDate(date, {
  includeTime: true,
  includeWeekday: true,
  format: 'long'
});
// Returns: "Wednesday, December 25th, 2024 CE at 2:30 PM"
```

**Options:**
```typescript
interface DateFormatOptions {
  includeTime?: boolean;
  includeWeekday?: boolean;
  includeYear?: boolean;
  format?: 'short' | 'long' | 'numeric';
}
```

### Calendar Management

#### `getActiveCalendar()`
Get the currently active calendar definition.

```javascript
const calendar = game.seasonsStars.api.getActiveCalendar();
console.log('Active calendar:', calendar.id);
console.log('Months:', calendar.months.map(m => m.name));
```

#### `setActiveCalendar(calendarId: string)`
Switch to a different calendar system.

```javascript
// Switch to Vale Reckoning calendar
await game.seasonsStars.api.setActiveCalendar('vale-reckoning');

// Switch back to Gregorian
await game.seasonsStars.api.setActiveCalendar('gregorian');
```

#### `getAvailableCalendars()`
Get list of all available calendar IDs.

```javascript
const calendars = game.seasonsStars.api.getAvailableCalendars();
console.log('Available calendars:', calendars);
// Returns: ['gregorian', 'vale-reckoning', 'custom-calendar']
```

## 🔄 Simple Calendar Compatibility

Seasons & Stars provides automatic compatibility with Simple Calendar API for seamless module migration.

### Compatibility Detection
```javascript
// Check if compatibility layer is active
const isCompatLayer = window.SimpleCalendar?._isSeasonsStarsCompatibility;

if (window.SimpleCalendar && !isCompatLayer) {
  // Real Simple Calendar is present
  console.log('Using Simple Calendar');
} else if (window.SimpleCalendar && isCompatLayer) {
  // Seasons & Stars compatibility layer
  console.log('Using Seasons & Stars compatibility');
} else {
  // No calendar system
  console.log('No calendar system available');
}
```

### Compatible API Functions

#### `SimpleCalendar.api.currentDateTime()`
Get current date in Simple Calendar format (0-based months/days).

```javascript
const current = SimpleCalendar.api.currentDateTime();
// Returns: { year: 2024, month: 11, day: 24, hour: 14, minute: 30, second: 0, weekday: 3 }
```

#### `SimpleCalendar.api.timestampToDate(timestamp)`
Critical function for weather modules - includes full display formatting.

```javascript
const dateInfo = SimpleCalendar.api.timestampToDate(game.time.worldTime);

// Access formatted display data
console.log(`Today is ${dateInfo.display.monthName} ${dateInfo.display.day}${dateInfo.display.daySuffix}`);
// Output: "Today is December 25th"

// Full display object includes:
// - monthName: "December"
// - day: "25", daySuffix: "th"
// - year: "2024", yearPrefix: "", yearPostfix: " CE"
// - date: "2024-12-25", time: "14:30:00"
// - weekday: "Wednesday"
```

#### `SimpleCalendar.api.changeDate(date)`
Change the current date using Simple Calendar format.

```javascript
const newDate = {
  year: 2024,
  month: 11,  // 0-based (December)
  day: 30,    // 0-based (31st)
  hour: 9,
  minute: 0
};

const success = await SimpleCalendar.api.changeDate(newDate);
if (success) {
  console.log('Date changed successfully');
}
```

### Calendar Data Access
```javascript
// Get calendar structure
const months = SimpleCalendar.api.getAllMonths();
const weekdays = SimpleCalendar.api.getAllWeekdays();
const currentCalendar = SimpleCalendar.api.getCurrentCalendar();

console.log('Month names:', months.map(m => m.name));
console.log('Weekday names:', weekdays.map(w => w.name));
```

### Notes System Compatibility
```javascript
// Placeholder functions (Phase 2 implementation)
const notes = SimpleCalendar.api.getNotes(); // Returns []
const success = await SimpleCalendar.api.addNote(noteData); // Returns false + warning
```

## 🪝 Hook System

### Seasons & Stars Hooks

#### `seasons-stars:dateChanged`
Fired when the world time changes.

```javascript
Hooks.on('seasons-stars:dateChanged', (data) => {
  console.log('Date changed from', data.oldTime, 'to', data.newTime);
  console.log('New date:', data.newDate);
  console.log('Time delta:', data.delta, 'seconds');
  
  // Update your module's time-sensitive features
  updateWeatherForNewDate(data.newDate);
  refreshTimedAbilities();
});
```

**Data Structure:**
```typescript
interface DateChangeData {
  newDate: CalendarDate;
  oldTime: number;
  newTime: number;
  delta: number;
}
```

#### `seasons-stars:calendarChanged`
Fired when the active calendar system changes.

```javascript
Hooks.on('seasons-stars:calendarChanged', (data) => {
  console.log('Calendar changed to:', data.newCalendarId);
  console.log('New calendar data:', data.calendar);
  
  // Recalculate seasonal effects, holidays, etc.
  recalculateSeasonalEffects(data.calendar);
});
```

#### `seasons-stars:ready`
Fired when Seasons & Stars is fully initialized.

```javascript
Hooks.on('seasons-stars:ready', (data) => {
  console.log('Seasons & Stars ready');
  console.log('Manager:', data.manager);
  console.log('API:', data.api);
  
  // Safe to use Seasons & Stars API
  initializeCalendarIntegration();
});
```

### Simple Calendar Hook Compatibility

#### Mapped Hooks
```javascript
// These hooks are automatically mapped for compatibility:
Hooks.on(SimpleCalendar.Hooks.DateTimeChange, (data) => {
  // Equivalent to 'seasons-stars:dateChanged'
});

Hooks.on(SimpleCalendar.Hooks.Ready, (data) => {
  // Equivalent to 'seasons-stars:ready'
});
```

## 📊 Calendar Data Structures

### CalendarDate Interface
```typescript
interface CalendarDate {
  year: number;
  month: number;        // 1-based (1 = first month)
  day: number;          // 1-based (1 = first day)
  weekday: number;      // 0-based (0 = first weekday)
  intercalary?: string; // Special day name (optional)
  time?: {
    hour: number;       // 0-23
    minute: number;     // 0-59
    second: number;     // 0-59
  };
}
```

### Calendar Structure
```typescript
interface SeasonsStarsCalendar {
  id: string;
  translations: {
    [languageCode: string]: {
      label: string;
      description?: string;
      setting?: string;
    };
  };
  
  year: {
    epoch: number;      // Starting year for calculations
    currentYear: number; // Default current year
    prefix: string;     // Text before year (e.g., "")
    suffix: string;     // Text after year (e.g., " CE")
    startDay: number;   // Which weekday the epoch starts on
  };
  
  months: CalendarMonth[];
  weekdays: CalendarWeekday[];
  intercalary: CalendarIntercalary[]; // Special days
  
  leapYear: {
    rule: 'none' | 'gregorian' | 'custom';
    interval?: number;  // For custom rules
    month?: string;     // Which month gets extra days
    extraDays?: number; // How many extra days
  };
  
  time: {
    hoursInDay: number;    // Usually 24
    minutesInHour: number; // Usually 60
    secondsInMinute: number; // Usually 60
  };
}
```

## 🔧 Integration Examples

### Weather Module Integration
```javascript
class WeatherManager {
  constructor() {
    this.setupCalendarIntegration();
  }
  
  setupCalendarIntegration() {
    // Support both Simple Calendar and Seasons & Stars
    if (window.SimpleCalendar) {
      Hooks.on(SimpleCalendar.Hooks.DateTimeChange, this.onDateChange.bind(this));
      this.calendarAPI = SimpleCalendar.api;
    }
    
    // Direct Seasons & Stars integration (preferred)
    if (game.seasonsStars) {
      Hooks.on('seasons-stars:dateChanged', this.onDateChange.bind(this));
      this.calendarAPI = game.seasonsStars.api;
    }
  }
  
  onDateChange(data) {
    const currentDate = this.calendarAPI.getCurrentDate();
    const season = this.calculateSeason(currentDate);
    const weather = this.generateWeather(season, currentDate);
    
    this.updateWeatherDisplay(weather);
    this.saveWeatherToNotes(currentDate, weather);
  }
  
  calculateSeason(date) {
    // Use calendar months to determine season
    const calendar = this.calendarAPI.getActiveCalendar();
    const monthsPerSeason = calendar.months.length / 4;
    return Math.floor((date.month - 1) / monthsPerSeason);
  }
  
  async saveWeatherToNotes(date, weather) {
    // Phase 1: Use Simple Calendar compatibility
    if (this.calendarAPI.addNote) {
      await this.calendarAPI.addNote({
        date: date,
        title: 'Weather',
        content: weather.description,
        category: 'weather'
      });
    }
  }
}
```

### Time-Sensitive Spell Effects
```javascript
class SpellEffectManager {
  constructor() {
    Hooks.on('seasons-stars:dateChanged', this.checkExpiringEffects.bind(this));
  }
  
  async addTimedEffect(actorId, effectData, duration) {
    const currentDate = game.seasonsStars.api.getCurrentDate();
    const expirationTime = game.time.worldTime + duration;
    
    // Store expiration time with effect
    const effect = {
      ...effectData,
      expirationTime: expirationTime,
      startDate: currentDate
    };
    
    await this.storeEffect(actorId, effect);
  }
  
  checkExpiringEffects(data) {
    const currentTime = data.newTime;
    
    // Check all active effects
    for (const [actorId, effects] of this.activeEffects) {
      const expired = effects.filter(e => e.expirationTime <= currentTime);
      
      expired.forEach(effect => {
        this.removeEffect(actorId, effect);
        ui.notifications.info(`${effect.name} effect has expired on ${actorId}`);
      });
    }
  }
}
```

### Calendar Event System
```javascript
class EventManager {
  constructor() {
    this.events = new Map();
    this.setupEventHandling();
  }
  
  setupEventHandling() {
    Hooks.on('seasons-stars:dateChanged', this.checkEvents.bind(this));
    Hooks.on('seasons-stars:calendarChanged', this.convertEventDates.bind(this));
  }
  
  addRecurringEvent(eventData) {
    const event = {
      id: foundry.utils.randomID(),
      name: eventData.name,
      description: eventData.description,
      recurrence: eventData.recurrence, // 'daily', 'weekly', 'monthly', 'yearly'
      startDate: eventData.startDate,
      endDate: eventData.endDate
    };
    
    this.events.set(event.id, event);
  }
  
  checkEvents(data) {
    const currentDate = data.newDate;
    
    for (const event of this.events.values()) {
      if (this.shouldTriggerEvent(event, currentDate)) {
        this.triggerEvent(event, currentDate);
      }
    }
  }
  
  shouldTriggerEvent(event, currentDate) {
    // Check if event should trigger on current date
    switch (event.recurrence) {
      case 'daily':
        return true;
      case 'weekly':
        return currentDate.weekday === event.startDate.weekday;
      case 'monthly':
        return currentDate.day === event.startDate.day;
      case 'yearly':
        return currentDate.month === event.startDate.month && 
               currentDate.day === event.startDate.day;
      default:
        return false;
    }
  }
}
```

## 🔄 Migration Guide

### From Simple Calendar

#### Phase 1: Basic Compatibility
Your existing Simple Calendar integration should work immediately:

```javascript
// This code continues working unchanged:
const currentDate = SimpleCalendar.api.currentDateTime();
const formatted = SimpleCalendar.api.timestampToDate(game.time.worldTime);

Hooks.on(SimpleCalendar.Hooks.DateTimeChange, (data) => {
  // Your existing hook handler
});
```

#### Phase 2: Enhanced Integration
Migrate to native Seasons & Stars API for better features:

```javascript
// Old Simple Calendar code:
const oldDate = SimpleCalendar.api.currentDateTime();

// New Seasons & Stars code:
const newDate = game.seasonsStars.api.getCurrentDate();

// Benefits: Better type safety, more features, direct access
```

#### Phase 3: Notes System Migration
When Phase 2 releases, migrate note handling:

```javascript
// Old Simple Calendar notes:
const notes = SimpleCalendar.api.getNotes(date);

// New Seasons & Stars notes:
const notes = game.seasonsStars.api.getNotes(date);
```

### From Custom Time Systems

#### Step 1: Replace Time Calculations
```javascript
// Old custom time code:
function advanceGameTime(hours) {
  const newTime = game.time.worldTime + (hours * 3600);
  game.time.advance(newTime - game.time.worldTime);
}

// New Seasons & Stars code:
async function advanceGameTime(hours) {
  await game.seasonsStars.api.advanceHours(hours);
}
```

#### Step 2: Use Calendar-Aware Functions
```javascript
// Old date calculation:
function addDaysToDate(date, days) {
  // Complex calculation considering month lengths, leap years, etc.
}

// New calendar-aware calculation:
function addDaysToDate(date, days) {
  return game.seasonsStars.api.dateToWorldTime(
    game.seasonsStars.manager.getActiveEngine().addDays(date, days)
  );
}
```

## 🎯 Best Practices

### Error Handling
```javascript
// Always check if Seasons & Stars is available
function safeGetCurrentDate() {
  if (!game.seasonsStars?.api?.getCurrentDate) {
    console.warn('Seasons & Stars not available');
    return null;
  }
  
  try {
    return game.seasonsStars.api.getCurrentDate();
  } catch (error) {
    console.error('Failed to get current date:', error);
    return null;
  }
}
```

### Performance Considerations
```javascript
// Cache calendar data instead of repeated API calls
class CalendarCache {
  constructor() {
    this.calendarData = null;
    this.lastUpdate = 0;
    
    Hooks.on('seasons-stars:calendarChanged', () => {
      this.invalidateCache();
    });
  }
  
  getCalendar() {
    const now = Date.now();
    if (!this.calendarData || now - this.lastUpdate > 60000) {
      this.calendarData = game.seasonsStars.api.getActiveCalendar();
      this.lastUpdate = now;
    }
    return this.calendarData;
  }
  
  invalidateCache() {
    this.calendarData = null;
    this.lastUpdate = 0;
  }
}
```

### Graceful Degradation
```javascript
// Support multiple calendar systems
class UniversalCalendarAdapter {
  constructor() {
    this.adapter = this.detectCalendarSystem();
  }
  
  detectCalendarSystem() {
    if (game.seasonsStars) {
      return new SeasonsStarsAdapter();
    } else if (window.SimpleCalendar) {
      return new SimpleCalendarAdapter();
    } else {
      return new FallbackAdapter();
    }
  }
  
  getCurrentDate() {
    return this.adapter.getCurrentDate();
  }
  
  onDateChange(callback) {
    this.adapter.onDateChange(callback);
  }
}
```

### Module Dependencies
```javascript
// In your module.json
{
  "relationships": {
    "systems": [],
    "requires": [],
    "recommends": [
      {
        "id": "seasons-and-stars",
        "type": "module",
        "reason": "Enhanced calendar functionality"
      }
    ]
  }
}
```

---

**Need more help?** Check the [User Guide](./USER-GUIDE.md) for basic usage or visit our [GitHub Discussions](https://github.com/your-username/seasons-and-stars/discussions) for developer support.