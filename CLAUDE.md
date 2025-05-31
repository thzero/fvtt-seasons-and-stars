# Claude Development Memory: Seasons & Stars

## Project Overview
**Seasons & Stars** is a Foundry VTT v13+ calendar and timekeeping module designed as a modern alternative to Simple Calendar. It provides a clean UI for tracking in-game dates and time using Foundry's native `game.time.worldTime` system, with support for custom calendars and integration with existing modules like SmallTime.

## Current Architecture

### Core Components
- **Calendar Engine** (`calendar-engine.ts`) - Core date calculation and conversion logic
- **Calendar Manager** (`calendar-manager.ts`) - State management and API coordination  
- **Calendar Localization** (`calendar-localization.ts`) - Multi-language support
- **Time Converter** (`time-converter.ts`) - Foundry worldTime integration

### UI Components
- **Calendar Widget** (`calendar-widget.ts`) - Main calendar interface with full controls
- **Calendar Mini Widget** (`calendar-mini-widget.ts`) - Compact companion for SmallTime
- **Calendar Selection Dialog** (`calendar-selection-dialog.ts`) - Calendar picker interface

### Data Format
- **JSON Calendar Definitions** - Human-readable calendar configuration
- **Built-in Calendars**: Gregorian (`calendars/gregorian.json`), Vale Reckoning (`calendars/vale-reckoning.json`)

## Recent Development Sessions

### Current Session: Simple Calendar Compatibility Code Removal

**Problem Solved**: Completely removed all Simple Calendar compatibility code from Seasons & Stars module in favor of standalone compatibility bridge approach.

**Major Changes**:

1. **Module Cleanup** (`module.ts`)
   - Removed ~520 lines of compatibility code (64% reduction)
   - File size reduced from ~815 lines to 291 lines
   - Removed 7 major compatibility functions
   - Removed `simpleCalendarCompat` setting registration
   - Removed all fake module registration logic

2. **Type Definitions Cleanup** (`foundry-extensions.d.ts`)
   - Removed `SimpleCalendarCompatAPI` interface
   - Removed SimpleCalendar window type declarations
   - Cleaned up module type definitions

3. **Functions Removed**:
   - `setupEarlySimpleCalendarCompatibility()`
   - `setupSimpleCalendarCompatibility()` (320+ lines)
   - `getOrdinalSuffix()`
   - `getCurrentSeasonIcon()`
   - `addVeryEarlyModuleRegistration()`
   - `addSafeModuleRegistration()`
   - `removeSimpleCalendarCompatibility()`

### Previous Session: SmallTime Integration API Compatibility Fix

**Problem Solved**: Fixed `TypeError: Cannot read properties of undefined (reading 'monthName')` error when SmallTime tries to access Simple Calendar API data from Seasons & Stars compatibility layer.

**Root Cause**: SmallTime expects specific properties in the `display` object returned by `SimpleCalendar.api.timestampToDate()`, but our compatibility layer had incomplete data validation and missing properties.

**Key Fixes** (Now Moved to Standalone Bridge):

1. **Month Name Validation** (`module.ts:415`)
   ```typescript
   // Added proper range validation for month indexing
   const monthName = (ssDate.month >= 1 && ssDate.month <= activeCalendar.months.length) ? 
     activeCalendar.months[ssDate.month - 1]?.name || '' : '';
   ```

2. **Complete Display Object Properties**
   - Added missing `month` property (string representation)
   - Added `daySuffix` with ordinal suffix generation (1st, 2nd, 3rd, etc.)
   - Added `yearPrefix` and `yearPostfix` from calendar configuration
   - Enhanced error handling with debug logging

3. **Ordinal Suffix Helper Function**
   ```typescript
   function getOrdinalSuffix(day: number): string {
     if (day >= 11 && day <= 13) return 'th';
     const lastDigit = day % 10;
     switch (lastDigit) {
       case 1: return 'st';
       case 2: return 'nd'; 
       case 3: return 'rd';
       default: return 'th';
     }
   }
   ```

### Previous Session: UI Positioning & SmallTime Integration Fixes

**Problem Solved**: Fixed "jarring" mini widget positioning that would jump between different UI locations.

**Key Improvements**:

1. **Smart Positioning Logic**
   - Mini widget now consistently targets player list location (where SmallTime typically appears)
   - Implemented multi-fallback element detection for robust SmallTime integration
   - Enhanced standalone positioning to place widget where SmallTime would normally be

2. **SmallTime Integration Enhancements**
   - Detects SmallTime presence using multiple selector strategies
   - Positions above SmallTime by default (instead of below) for better visibility
   - Matches SmallTime background styling for visual consistency
   - Responsive to SmallTime movement and player list changes

3. **Main Calendar Widget Layout**
   - Converted Quick Time buttons from vertical to horizontal layout
   - Better space utilization with flex layout and proper wrapping
   - Maintained existing gradient styling and hover effects

**Technical Implementation Details**:

```typescript
// Multi-fallback SmallTime detection
const selectors = [
  '#smalltime-app',           // Primary ID
  '.smalltime-app',           // Class variant  
  '#timeDisplay',             // Content element
  '#slideContainer',          // Container element
  '[id*="smalltime"]',        // Any element with smalltime in ID
  '.form:has(#timeDisplay)'   // Form containing timeDisplay
];

// Smart standalone positioning (targets player list location)
private positionStandalone(): void {
  const players = document.querySelector('#players');
  if (players) {
    const playersRect = players.getBoundingClientRect();
    const estimatedMiniHeight = 32;
    
    position = {
      top: playersRect.top - estimatedMiniHeight - 12, // Above player list
      left: playersRect.left // Align with player list
    };
  }
  // Apply with fallback bounds checking
}
```

```scss
// Horizontal Quick Time button layout
&.horizontal {
  .time-buttons {
    display: flex;
    flex-direction: row;
    gap: 6px;
    flex-wrap: wrap;
    
    button {
      flex: 1;
      min-width: 60px;
      padding: 6px 8px;
      font-size: 0.75em;
    }
  }
}
```

**Hook Integration**:
- `seasons-stars:dateChanged` - Triggers mini widget updates
- `seasons-stars:calendarChanged` - Triggers calendar selection updates
- `renderApplication` - Monitors SmallTime rendering for positioning
- `renderPlayerList` - Responds to player list changes

## Key Design Decisions

### SmallTime Integration Strategy
- **Complementary Design**: Mini widget enhances rather than replaces SmallTime
- **Visual Consistency**: Matches SmallTime styling and positioning behavior
- **Graceful Degradation**: Works standalone when SmallTime unavailable
- **Position Preference**: Above SmallTime for better date visibility

### UI Layout Philosophy
- **Space Efficient**: Horizontal layouts for better space utilization
- **Responsive**: Adapts to different UI configurations and screen sizes
- **Consistent**: Follows Foundry v13 UI patterns and styling
- **Accessible**: Clear labeling and intuitive button groupings

### Positioning Logic
- **Player List Targeting**: Recognizes player list as the standard location for time widgets
- **Multi-Fallback**: Robust element detection prevents positioning failures
- **Bounds Checking**: Ensures widgets remain visible on all screen sizes
- **Dynamic Updates**: Responds to UI changes and window resizing

## Technical Notes

### ApplicationV2 Integration
- Uses `HandlebarsApplicationMixin` for template rendering
- Implements `_prepareContext()` for data binding
- Uses `_attachPartListeners()` for event handling
- Leverages `DEFAULT_OPTIONS` and `PARTS` static configuration

### CSS Architecture
- **CSS Variables**: Uses Foundry's CSS custom properties for theming
- **System Compatibility**: Special handling for dnd5e, pf2e themes
- **Responsive Design**: Flex layouts with proper fallbacks
- **Visual Hierarchy**: Clear distinction between different control groups

### Event Handling
- **Action System**: Uses `data-action` attributes for clean event routing
- **Async Handlers**: Proper error handling for time advancement operations
- **Hook Integration**: Bidirectional communication with other modules

## Future Considerations

### Integration Opportunities
- **Journeys & Jamborees**: Calendar-aware travel and camping mechanics
- **Weather Modules**: Seasonal weather patterns and calendar integration
- **Festival/Event Systems**: Calendar-based recurring events

### Performance Optimization
- **Lazy Loading**: Calendar definitions loaded on demand
- **Caching**: Computed date formatting and conversions
- **Memory Management**: Proper cleanup of event listeners and instances

### Enhanced Features
- **Calendar Editor**: In-app calendar creation and modification
- **Import/Export**: Simple Calendar migration tools
- **Advanced Formatting**: Cultural date formats and localization
- **Time Zones**: Multi-region time tracking

## Development Environment

### Build System
- **Rollup**: Module bundling with TypeScript support
- **Vitest**: Unit testing framework
- **SCSS**: Styling with CSS variable integration
- **Node.js**: Development toolchain

### File Structure
```
src/
  core/           # Business logic and data management
  ui/             # User interface components  
  types/          # TypeScript type definitions
  styles/         # SCSS styling
templates/        # Handlebars template files
calendars/        # JSON calendar definitions
test/             # Unit tests and test utilities
```

### Testing Strategy
- **Unit Tests**: Core calendar logic and date calculations
- **Integration Tests**: UI component rendering and interaction
- **Mock Framework**: Foundry API mocking for isolated testing
- **Coverage Goals**: 80%+ coverage for core business logic

## Module Integration Patterns

### Hook Registration
```typescript
// Register hooks for module communication
Hooks.on('seasons-stars:dateChanged', (newDate) => {
  // Other modules can listen for date changes
});

Hooks.on('seasons-stars:calendarChanged', (calendar) => {
  // Respond to calendar switches
});
```

### API Exposure
```typescript
// Expose API for other modules
game.seasonsStars = {
  manager: calendarManager,
  getCurrentDate: () => manager.getCurrentDate(),
  advanceTime: (amount, unit) => manager.advanceTime(amount, unit),
  // Additional API methods
};
```

### Simple Calendar Compatibility Layer
For seamless integration with modules expecting Simple Calendar API:

```typescript
// Complete compatibility layer with all expected properties
const compatAPI = {
  timestampToDate: (timestamp: number) => ({
    // Core date properties
    year: ssDate.year,
    month: ssDate.month - 1, // 0-based for SC compatibility
    day: ssDate.day - 1,     // 0-based for SC compatibility
    
    // Display formatting - critical for SmallTime integration
    display: {
      monthName: validatedMonthName,    // Validated month lookup
      month: ssDate.month.toString(),   // String representation  
      day: ssDate.day.toString(),
      year: ssDate.year.toString(),
      daySuffix: getOrdinalSuffix(ssDate.day),     // 1st, 2nd, 3rd
      yearPrefix: calendar.year?.prefix || '',     // From calendar def
      yearPostfix: calendar.year?.suffix || '',    // From calendar def
      date: fullDateString,
      time: timeString,
      weekday: weekdayName
    },
    
    // Time calculations for weather modules
    sunrise: calculatedSunrise,
    sunset: calculatedSunset,
    weekdays: weekdayArray
  })
};
```

This architecture ensures clean separation of concerns, robust UI integration, and extensibility for future enhancements while maintaining compatibility with existing Foundry modules and workflows.

## Development Patterns & Lessons Learned

### **SmallTime-Style Widget Positioning** 

**Key Learning**: When positioning ApplicationV2 widgets to avoid render flash, follow SmallTime's proven simple approach rather than complex immediate positioning logic.

#### **SmallTime's Simple Pattern**
```typescript
static DEFAULT_OPTIONS = {
  // ... other options
  position: {
    top: -1000,    // Start off-screen to minimize flash
    left: -1000
  }
};

async _onRender(context: any, options: any): Promise<void> {
  await super._onRender(context, options);
  
  // Simple post-render positioning
  this.positionWidget();
}

private positionWidget(): void {
  // Two simple approaches:
  // 1. Fixed positioning: this.element.style.top/left
  // 2. DOM positioning: $(targetElement).before(this.element)
}
```

#### **Why This Works Better**
- **Minimal flash**: Start off-screen, move once after render
- **Simple logic**: No complex immediate positioning or transition management  
- **DOM hierarchy**: For docking, just insert into DOM - automatic layout handling
- **Proven approach**: SmallTime uses this successfully

#### **Anti-Pattern to Avoid**
- Setting `positioned: false` and trying to prevent default positioning
- Complex two-phase rendering with immediate + delayed positioning
- Multiple similar methods for "immediate" vs "runtime" positioning
- Disabling transitions on initial render then re-enabling

**Result**: Reduced ~680 lines to ~646 lines while achieving better, more reliable positioning with less complexity.

#### **Player List Integration**
For widgets that need to move with player list expansion/contraction:
```typescript
// Simple DOM insertion - no complex positioning calculations needed
$(playerList).before(this.element);
this.element.style.position = 'relative'; // Let DOM handle layout
```
The DOM hierarchy automatically handles player list expansion without additional code.