# Known Issues

This document tracks known limitations, bugs, and workarounds for Seasons & Stars.

## Bridge Integration Issues

### Calendar and Configuration Import

**Status**: Missing Feature  
**Affects**: Simple Calendar users with custom calendars, settings, and configurations  
**Severity**: High (Migration Barrier)

#### Description

Users migrating from Simple Calendar to Seasons & Stars lose access to their custom calendar definitions, time configurations, weather settings, and other customizations. S&S only provides built-in calendars (Gregorian, Vale Reckoning) and doesn't import existing Simple Calendar world configurations.

#### Impact on Migration

- **Custom Calendars**: Years of calendar development work becomes inaccessible
- **Time Settings**: Hour lengths, day structures, week configurations lost
- **Weather Integration**: Simple Weather configurations and patterns reset
- **User Preferences**: Display settings, permissions, UI customizations lost
- **World Continuity**: Calendar system changes can break immersion and campaign flow

#### Missing Import Features

- ❌ **Calendar Definitions**: Custom months, weekdays, seasons, year structures
- ❌ **Time Configuration**: Custom hour lengths, day/week/month durations
- ❌ **Weather Settings**: Climate data, seasonal patterns, temperature ranges
- ❌ **Display Preferences**: Date formats, widget positions, visibility settings
- ❌ **Permission Settings**: Player access levels, editing rights, visibility rules
- ❌ **Hook Integrations**: Custom module integrations and automation

#### Required for Complete Migration

A comprehensive configuration import system that preserves:

1. **Calendar Structure**: Exact reproduction of custom calendar layouts
2. **Time Systems**: Preservation of custom time advancement and calculations
3. **Integration Settings**: Weather, lighting, and other module configurations
4. **User Experience**: Familiar interface and workflow preservation

**Priority**: High - Critical for user adoption from Simple Calendar ecosystem.

**Related**: See [GitHub Issue #3](https://github.com/rayners/fvtt-seasons-and-stars/issues/3) for detailed implementation requirements.

---

### Note Highlighting Synchronization (Bridge Modules)

**Status**: Known Limitation  
**Affects**: Simple Calendar Compatibility Bridge, Simple Weather Integration  
**Severity**: Low (Cosmetic)

#### Description

When external modules create calendar notes through the Simple Calendar Compatibility Bridge (e.g., Simple Weather creating daily weather entries), those notes do not automatically appear as highlighted dates in the calendar grid widget until the note storage index is manually rebuilt.

#### Root Cause

The Seasons & Stars note storage system builds an index of calendar notes during initialization, but does not automatically rebuild this index when external modules create notes through the bridge API. This creates a synchronization gap where:

1. Bridge-created notes exist in the Foundry journal system
2. Bridge-created notes are properly flagged and accessible via API calls
3. Bridge-created notes are NOT indexed by S&S storage system
4. Calendar grid widget queries the S&S index (not journal directly) for note indicators

#### Affected Scenarios

- **Simple Weather**: Daily weather data created when advancing time
- **Custom Bridge Modules**: Any module creating notes via Simple Calendar API
- **Existing Note Migration**: Pre-existing Simple Calendar notes when bridge is first installed
- **Bulk Note Operations**: Any mass creation of notes through bridge APIs

#### Workarounds

⚠️ **IMPORTANT**: The workarounds below are **theoretical and untested**. They may not actually resolve the issue and could potentially cause other problems. Use at your own risk and test in a backup world first.

##### Theoretical Console Fix (Untested)

```javascript
// WARNING: This workaround is untested and may not work
// Rebuild storage index and refresh calendar widget
game.seasonsStars.notes.storage.rebuildIndex();
window.SeasonsStars.CalendarGridWidget.getInstance()?.render();
```

**Status**: Untested - may not work due to:

- Notes manager initialization issues
- Storage system not detecting bridge flags correctly
- Widget refresh not re-querying storage
- Missing widget instances or render failures

##### Diagnostic Script (Recommended)

Before trying the workaround, run the diagnostic script to identify the actual failure point:

```javascript
// Copy and paste contents of debug-workaround.js into console
// This will test each component and identify where the chain breaks
```

##### Foundry Macro (Untested)

Create a macro with the console code above, but be aware it may not work.

##### Module Reload (Nuclear Option)

Disable and re-enable Seasons & Stars module to trigger full reinitialization. This is the most reliable workaround but requires closing all calendar widgets.

#### Impact Assessment

- **Functionality**: ✅ No loss of functionality - notes exist and are accessible
- **Data Integrity**: ✅ No data loss or corruption
- **API Compatibility**: ✅ All Simple Calendar API calls work correctly
- **User Experience**: ⚠️ Visual indicators missing until manual refresh
- **Bridge Integration**: ⚠️ Creates confusion about whether integration is working

#### Technical Details

**Storage Index Structure:**

- Index Format: `Map<dateKey, Set<noteId>>`
- Date Key Format: `"YYYY-MM-DD"` (1-based months)
- Index Population: On initialization via `buildDateIndex()`
- Bridge Detection: Checks for `foundryvtt-simple-calendar-compat` flags

**Calendar Grid Widget Flow:**

1. `generateMonthData()` calls `notesManager.storage.findNotesByDateSync()`
2. `findNotesByDateSync()` queries the `dateIndex` Map
3. Missing index entries = no note indicators in UI
4. Bridge-created notes bypass index population

#### Planned Resolution

**Phase 1**: Automatic Reindexing (Low effort)

- Bridge modules call `rebuildIndex()` after note creation
- Addresses new note creation synchronization
- Does not address existing note migration

**Phase 2**: Migration System (Medium effort)

- Bridge initialization detects and indexes existing notes
- Provides user-facing migration tools
- Handles bulk operations and edge cases

**Phase 3**: Real-time Synchronization (High effort)

- Hook-based automatic index updates
- Bidirectional sync for note updates/deletions
- Performance optimization for large note collections

#### Workaround Implementation

**Diagnostic Script**: A diagnostic script is available at `debug-workaround.js` to test each component:

```bash
# Load and run the diagnostic
cp debug-workaround.js /path/to/foundry/Data/
# Then paste contents into browser console to identify the failure point
```

**Quickfix Script**: A theoretical fix script is available at `fix-note-highlighting.js`, but it is **untested and may not work**:

```bash
# WARNING: Untested workaround
cp fix-note-highlighting.js /path/to/foundry/Data/
# Then paste contents into browser console (use at your own risk)
```

---

## Future Issue Categories

Additional sections will be added as issues are discovered:

- **Calendar Engine Issues**: Date calculation edge cases
- **UI Component Issues**: Widget positioning and rendering problems
- **API Integration Issues**: Compatibility with other modules
- **Performance Issues**: Large data set handling
- **Localization Issues**: Translation and cultural calendar support
