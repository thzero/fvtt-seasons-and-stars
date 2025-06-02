/**
 * Debug script to test if the note highlighting workaround actually works
 * 
 * This script tests each step of the workaround to identify where it fails
 */

(function debugWorkaround() {
  console.log('=== Debugging Note Highlighting Workaround ===');
  
  // Step 1: Check if S&S is available
  console.log('\n--- Step 1: Seasons & Stars Availability ---');
  const seasonsStars = game.seasonsStars;
  console.log('game.seasonsStars:', !!seasonsStars);
  
  if (!seasonsStars) {
    console.error('❌ Seasons & Stars not available - module not loaded?');
    return;
  }
  
  // Step 2: Check notes system
  console.log('\n--- Step 2: Notes System Availability ---');
  const notes = seasonsStars.notes;
  const storage = notes?.storage;
  console.log('notes manager:', !!notes);
  console.log('storage system:', !!storage);
  
  if (!storage) {
    console.error('❌ Storage system not available');
    return;
  }
  
  // Step 3: Check for bridge-created notes in journal
  console.log('\n--- Step 3: Bridge Notes Detection ---');
  const bridgeNotes = game.journal.filter(j => {
    const bridgeFlags = j.flags?.['foundryvtt-simple-calendar-compat'];
    return bridgeFlags?.isCalendarNote === true;
  });
  
  console.log(`Found ${bridgeNotes.length} bridge-created notes in journal`);
  if (bridgeNotes.length > 0) {
    console.log('Sample bridge note:', {
      name: bridgeNotes[0].name,
      flags: bridgeNotes[0].flags?.['foundryvtt-simple-calendar-compat']
    });
  }
  
  // Step 4: Check current storage index
  console.log('\n--- Step 4: Storage Index Before Rebuild ---');
  const indexSizeBefore = storage.dateIndex?.size || 'undefined';
  console.log('Index size before rebuild:', indexSizeBefore);
  
  // Step 5: Test rebuildIndex()
  console.log('\n--- Step 5: Testing rebuildIndex() ---');
  try {
    storage.rebuildIndex();
    const indexSizeAfter = storage.dateIndex?.size || 'undefined';
    console.log('Index size after rebuild:', indexSizeAfter);
    console.log('Index size changed:', indexSizeBefore !== indexSizeAfter);
    
    if (indexSizeAfter > indexSizeBefore) {
      console.log('✅ rebuildIndex() appears to have found new notes');
    } else {
      console.log('⚠️ rebuildIndex() did not increase index size');
    }
  } catch (error) {
    console.error('❌ rebuildIndex() failed:', error);
    return;
  }
  
  // Step 6: Test note retrieval for a specific date
  console.log('\n--- Step 6: Testing Note Retrieval ---');
  if (bridgeNotes.length > 0) {
    // Get date from first bridge note
    const firstNote = bridgeNotes[0];
    const bridgeFlags = firstNote.flags?.['foundryvtt-simple-calendar-compat'];
    const dateKey = bridgeFlags?.dateKey;
    
    if (dateKey) {
      console.log('Testing retrieval for date:', dateKey);
      
      // Parse dateKey (YYYY-MM-DD) into ICalendarDate
      const [year, month, day] = dateKey.split('-').map(Number);
      const testDate = {
        year,
        month,
        day,
        weekday: 0,
        time: { hour: 0, minute: 0, second: 0 }
      };
      
      const retrievedNotes = storage.findNotesByDateSync(testDate);
      console.log(`Retrieved ${retrievedNotes.length} notes for ${dateKey}`);
      
      if (retrievedNotes.length > 0) {
        console.log('✅ Note retrieval working');
      } else {
        console.log('❌ Note retrieval failed - index issue?');
      }
    }
  }
  
  // Step 7: Check widget availability
  console.log('\n--- Step 7: Widget System Test ---');
  const SeasonsStars = window.SeasonsStars;
  const CalendarGridWidget = SeasonsStars?.CalendarGridWidget;
  const instance = CalendarGridWidget?.getInstance?.();
  
  console.log('window.SeasonsStars:', !!SeasonsStars);
  console.log('CalendarGridWidget class:', !!CalendarGridWidget);
  console.log('Active widget instance:', !!instance);
  console.log('Instance rendered:', instance?.rendered);
  
  // Step 8: Test widget refresh (if available)
  if (instance && instance.rendered) {
    console.log('\n--- Step 8: Testing Widget Refresh ---');
    try {
      instance.render();
      console.log('✅ Widget render() called successfully');
      console.log('Check calendar for note highlighting now...');
    } catch (error) {
      console.error('❌ Widget render() failed:', error);
    }
  } else {
    console.log('\n--- Step 8: Widget Refresh Skipped ---');
    console.log('No active calendar grid widget to refresh');
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log('Bridge notes found:', bridgeNotes.length);
  console.log('Storage system working:', !!storage);
  console.log('Widget system working:', !!(instance && instance.rendered));
  
  if (bridgeNotes.length > 0 && storage && instance?.rendered) {
    console.log('✅ All components available - workaround should work');
    console.log('If highlighting still not working, the issue is elsewhere');
  } else {
    console.log('❌ Missing components - workaround cannot work');
  }
  
  console.log('\n=== Debug Complete ===');
})();