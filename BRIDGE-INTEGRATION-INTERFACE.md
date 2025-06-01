# Bridge Integration Interface Design

## Overview
This document defines the clean contract between Seasons & Stars and compatibility bridge modules, separating S&S generic functionality from bridge-specific Simple Calendar compatibility.

## Design Principles
1. **Zero Simple Calendar Knowledge in S&S**: S&S provides generic calendar APIs only
2. **Bridge Authority**: Bridge modules handle all compatibility-specific requirements
3. **Version Independence**: Interface supports multiple S&S versions gracefully
4. **Error Resilience**: Robust fallback strategies for missing features

---

## Core Interface Definition

### SeasonsStarsIntegration
Primary integration class that bridges use to interact with S&S.

```typescript
interface SeasonsStarsIntegration {
  readonly isAvailable: boolean;
  readonly version: string;
  readonly api: SeasonsStarsAPI;
  readonly widgets: SeasonsStarsWidgets;
  readonly hooks: SeasonsStarsHooks;
}

class SeasonsStarsIntegration {
  /**
   * Detect and create integration instance
   * @returns Integration instance or null if S&S unavailable
   */
  static detect(): SeasonsStarsIntegration | null;
  
  /**
   * Check if specific API feature is available
   * @param feature Feature name to check
   */
  hasFeature(feature: string): boolean;
  
  /**
   * Get feature version for compatibility checking
   * @param feature Feature name
   */
  getFeatureVersion(feature: string): string | null;
}
```

### SeasonsStarsAPI
Core calendar functionality interface.

```typescript
interface SeasonsStarsAPI {
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
```

### SeasonsStarsWidgets
Widget management interface for UI integration.

```typescript
interface SeasonsStarsWidgets {
  readonly main: CalendarWidget | null;
  readonly mini: CalendarMiniWidget | null;
  readonly grid: CalendarGridWidget | null;
  
  /**
   * Get preferred widget for button placement
   * @param preference Bridge's widget preference
   */
  getPreferredWidget(preference?: WidgetPreference): CalendarWidget | null;
  
  /**
   * Register for widget lifecycle events
   * @param callback Called when widgets are created/destroyed
   */
  onWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void;
}

interface CalendarWidget {
  readonly id: string;
  readonly isVisible: boolean;
  
  /**
   * Add custom button to widget sidebar
   * @param name Unique button identifier
   * @param icon FontAwesome icon class
   * @param tooltip Button tooltip text
   * @param callback Button click handler
   */
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void;
  
  /**
   * Remove custom button from widget
   * @param name Button identifier to remove
   */
  removeSidebarButton(name: string): void;
  
  /**
   * Check if button exists
   * @param name Button identifier
   */
  hasSidebarButton(name: string): boolean;
  
  /**
   * Get widget instance (for advanced manipulation)
   */
  getInstance(): any;
}

enum WidgetPreference {
  MAIN = 'main',
  MINI = 'mini', 
  GRID = 'grid',
  ANY = 'any'
}
```

### SeasonsStarsHooks
Hook system interface for event handling.

```typescript
interface SeasonsStarsHooks {
  /**
   * Register for date/time changes
   * @param callback Handler for date changes
   */
  onDateChanged(callback: (event: DateChangeEvent) => void): void;
  
  /**
   * Register for calendar switches
   * @param callback Handler for calendar changes
   */
  onCalendarChanged(callback: (event: CalendarChangeEvent) => void): void;
  
  /**
   * Register for S&S ready event
   * @param callback Handler for module ready
   */
  onReady(callback: (event: ReadyEvent) => void): void;
  
  /**
   * Unregister hook callback
   * @param hookName Hook name
   * @param callback Callback to remove
   */
  off(hookName: string, callback: Function): void;
}

interface DateChangeEvent {
  newDate: CalendarDate;
  oldDate: CalendarDate;
  worldTime: number;
  calendarId: string;
}

interface CalendarChangeEvent {
  newCalendarId: string;
  oldCalendarId: string;
  calendar: Calendar;
}

interface ReadyEvent {
  api: SeasonsStarsAPI;
  widgets: SeasonsStarsWidgets;
  version: string;
}
```

---

## Data Types

### Core Calendar Types

```typescript
interface CalendarDate {
  year: number;
  month: number;    // 1-based
  day: number;      // 1-based
  weekday: number;  // 1-based
  time?: {
    hour: number;
    minute: number;
    second: number;
  };
}

interface Calendar {
  id: string;
  name: string;
  description?: string;
  months: CalendarMonth[];
  weekdays: string[];
  yearZero?: number;
  // ... other calendar properties
}

interface CalendarMonth {
  name: string;
  days: number;
  intercalary?: boolean;
}

interface TimeOfDay {
  sunrise: number;    // Hours from midnight
  sunset: number;     // Hours from midnight
}

interface SeasonInfo {
  name: string;
  icon: string;
  description?: string;
}
```

---

## Error Handling Strategy

### Feature Detection
Bridges should check feature availability before use:

```typescript
const integration = SeasonsStarsIntegration.detect();
if (!integration) {
  throw new Error('Seasons & Stars not available');
}

if (integration.hasFeature('time-advancement')) {
  await integration.api.advanceDays(1);
} else {
  console.warn('Time advancement not supported in this S&S version');
}
```

### Graceful Degradation
Bridges should provide fallbacks for missing features:

```typescript
// Widget integration with fallbacks
const widget = integration.widgets.getPreferredWidget('mini');
if (widget) {
  widget.addSidebarButton('weather', 'fa-cloud', 'Weather', callback);
} else {
  // Fallback to DOM manipulation or skip feature
  console.warn('No widgets available for button integration');
}
```

### Error Recovery
```typescript
try {
  const date = integration.api.getCurrentDate();
  // Process date...
} catch (error) {
  console.error('S&S API error:', error);
  // Fall back to Foundry worldTime or default date
  const fallbackDate = this.createFallbackDate(game.time.worldTime);
}
```

---

## Version Compatibility

### Version Detection
```typescript
const integration = SeasonsStarsIntegration.detect();
const version = integration.version; // e.g., "1.2.3"

// Check for minimum required version
if (this.compareVersions(version, '1.2.0') < 0) {
  console.warn('S&S version too old, some features disabled');
}
```

### Feature Versioning
```typescript
// Check specific feature versions
const widgetVersion = integration.getFeatureVersion('widgets');
if (this.compareVersions(widgetVersion, '1.1.0') >= 0) {
  // Use advanced widget features
} else {
  // Use basic widget features
}
```

---

## Implementation Guidelines

### For Seasons & Stars
1. **Expose Clean API**: Implement `game.seasonsStars.integration` with this interface
2. **Version Reporting**: Report version and feature availability clearly
3. **Error Handling**: Throw descriptive errors for invalid operations
4. **Widget Lifecycle**: Emit events when widgets are created/destroyed
5. **Hook Consistency**: Ensure hooks fire reliably with complete data

### For Bridges
1. **Feature Detection**: Always check feature availability before use
2. **Error Recovery**: Implement robust fallbacks for all operations
3. **Resource Cleanup**: Unregister hooks and remove buttons on disable
4. **Version Tolerance**: Support multiple S&S versions gracefully
5. **Performance**: Cache integration instances, avoid repeated detection

---

## Migration Plan

### Phase 1: S&S Interface Implementation
- Implement `SeasonsStarsIntegration` class in S&S
- Wrap existing APIs with new interface
- Add feature detection and version reporting
- Maintain backward compatibility

### Phase 2: Bridge Refactoring  
- Update bridge to use new interface
- Remove direct API calls and DOM manipulation
- Implement proper error handling and fallbacks
- Add comprehensive feature detection

### Phase 3: Cleanup
- Remove old compatibility layers from S&S
- Remove deprecated bridge patterns
- Update documentation and examples
- Comprehensive testing

---

## Testing Strategy

### Integration Tests
```typescript
describe('SeasonsStarsIntegration', () => {
  it('should detect S&S availability', () => {
    const integration = SeasonsStarsIntegration.detect();
    expect(integration).toBeTruthy();
    expect(integration.isAvailable).toBe(true);
  });
  
  it('should provide working API', () => {
    const integration = SeasonsStarsIntegration.detect();
    const date = integration.api.getCurrentDate();
    expect(date).toHaveProperty('year');
    expect(date).toHaveProperty('month');
    expect(date).toHaveProperty('day');
  });
  
  it('should support widget button integration', () => {
    const integration = SeasonsStarsIntegration.detect();
    const widget = integration.widgets.getPreferredWidget();
    if (widget) {
      expect(() => widget.addSidebarButton('test', 'fa-test', 'Test', () => {})).not.toThrow();
    }
  });
});
```

### Compatibility Tests
```typescript
describe('Bridge Compatibility', () => {
  it('should work with missing S&S', () => {
    // Test bridge behavior when S&S not available
    expect(() => createBridge()).not.toThrow();
  });
  
  it('should handle version mismatches', () => {
    // Test bridge with older S&S versions
    const bridge = createBridge();
    expect(bridge.isCompatible()).toBe(true);
  });
});
```

This interface design provides clean separation of concerns while maintaining full compatibility and robust error handling.