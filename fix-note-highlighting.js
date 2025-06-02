/**
 * UNTESTED Theoretical Fix for Calendar Grid Widget Note Highlighting
 * 
 * WARNING: This script is theoretical and untested. It may not actually work
 * and could potentially cause issues. Use at your own risk in a backup world first.
 * 
 * This script attempts to fix the issue where notes created by Simple Weather
 * through the compatibility bridge don't show up as highlighted dates
 * in the calendar grid widget.
 * 
 * RECOMMENDED: Run debug-workaround.js first to diagnose the actual issue.
 * 
 * Run this in the Foundry VTT console after Simple Weather has created notes.
 */

(function fixNoteHighlighting() {
  console.log('=== Fixing Calendar Grid Widget Note Highlighting ===');
  
  // Check if Seasons & Stars is available
  if (!game.seasonsStars?.notes?.storage) {
    console.error('Seasons & Stars notes system not available');
    return;
  }
  
  // Get the storage system
  const storage = game.seasonsStars.notes.storage;
  
  console.log('Rebuilding note storage index...');
  
  // Trigger storage reindex to include bridge-created notes
  storage.rebuildIndex();
  
  console.log('Storage index rebuilt');
  
  // Check if calendar grid widget is open and refresh it
  console.log('Checking for active calendar grid widget...');
  
  // Get the active widget instance directly
  const CalendarGridWidget = window.SeasonsStars?.CalendarGridWidget;
  const activeInstance = CalendarGridWidget?.getInstance?.();
  
  if (activeInstance && activeInstance.rendered) {
    console.log('Found active calendar grid widget, refreshing...');
    activeInstance.render();
    console.log('Calendar grid widget refreshed');
  } else {
    console.log('No active calendar grid widget found or widget not rendered');
    
    // Try alternative approach - look for the widget in the DOM
    const widgetElement = document.querySelector('[data-appid*="seasons-stars-grid-widget"]');
    if (widgetElement) {
      console.log('Found grid widget element in DOM, but no active instance');
    }
  }
  
  // Verify the fix by checking for calendar notes
  const calendarNotes = game.journal.filter(j => {
    const ssFlags = j.flags?.['seasons-and-stars'];
    const bridgeFlags = j.flags?.['foundryvtt-simple-calendar-compat'];
    return ssFlags?.calendarNote === true || bridgeFlags?.isCalendarNote === true;
  });
  
  console.log(`Found ${calendarNotes.length} calendar notes after reindex`);
  
  if (calendarNotes.length > 0) {
    console.log('Calendar notes found:');
    calendarNotes.forEach(note => {
      const ssFlags = note.flags?.['seasons-and-stars'];
      const bridgeFlags = note.flags?.['foundryvtt-simple-calendar-compat'];
      const dateKey = ssFlags?.dateKey || bridgeFlags?.dateKey;
      console.log(`- "${note.name}" (${dateKey})`);
    });
  }
  
  console.log('✅ Note highlighting fix complete!');
  console.log('If calendar grid widget is open, dates with notes should now be highlighted.');
})();