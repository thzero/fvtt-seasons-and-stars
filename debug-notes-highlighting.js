/**
 * Debug script for testing note highlighting in calendar grid widget
 * 
 * This script provides diagnostic methods to:
 * 1. Create test notes for debugging
 * 2. Check note storage and indexing
 * 3. Verify data loading in the calendar widget
 * 4. Identify if the issue is data vs display
 * 
 * Run in browser console while in a Foundry world with Seasons & Stars active
 */

// Utility to check if Seasons & Stars is available
function checkSeasonsStarsAvailable() {
  if (!game.seasonsStars) {
    console.error("❌ Seasons & Stars not available. Make sure the module is active.");
    return false;
  }
  if (!game.seasonsStars.manager) {
    console.error("❌ Calendar manager not available.");
    return false;
  }
  if (!game.seasonsStars.notes) {
    console.error("❌ Notes manager not available.");
    return false;
  }
  console.log("✅ Seasons & Stars is available and initialized.");
  return true;
}

// 1. Create test notes for the current month
async function createTestNotes() {
  if (!checkSeasonsStarsAvailable()) return;
  
  console.log("🔧 Creating test notes for debugging...");
  
  const notesManager = game.seasonsStars.notes;
  const currentDate = game.seasonsStars.manager.getCurrentDate();
  
  if (!currentDate) {
    console.error("❌ No current date available");
    return;
  }
  
  console.log(`📅 Current date:`, currentDate.toObject());
  
  const testNotes = [
    {
      title: "Debug Note 1",
      content: "This is a test note for debugging calendar highlighting",
      startDate: currentDate.toObject(),
      allDay: true,
      category: "general",
      tags: ["debug", "test"],
      playerVisible: true
    },
    {
      title: "Debug Note 2", 
      content: "Another test note for tomorrow",
      startDate: {
        ...currentDate.toObject(),
        day: currentDate.day + 1
      },
      allDay: true,
      category: "general", 
      tags: ["debug", "test"],
      playerVisible: true
    },
    {
      title: "Debug Note 3",
      content: "Test note for next week",
      startDate: {
        ...currentDate.toObject(),
        day: currentDate.day + 7
      },
      allDay: true,
      category: "general",
      tags: ["debug", "test"],
      playerVisible: true
    }
  ];
  
  const createdNotes = [];
  
  for (const noteData of testNotes) {
    try {
      const note = await notesManager.createNote(noteData);
      createdNotes.push(note);
      console.log(`✅ Created note: ${noteData.title}`, note);
    } catch (error) {
      console.error(`❌ Failed to create note: ${noteData.title}`, error);
    }
  }
  
  console.log(`📝 Created ${createdNotes.length} test notes`);
  return createdNotes;
}

// 2. Check note storage and indexing
function checkNoteStorage() {
  if (!checkSeasonsStarsAvailable()) return;
  
  console.log("🔍 Checking note storage system...");
  
  const notesManager = game.seasonsStars.notes;
  const storage = notesManager.storage;
  
  // Check storage initialization
  console.log("📊 Storage initialized:", !!storage);
  console.log("📊 Storage stats:", storage.getCacheStats());
  console.log("📊 Performance metrics:", storage.getPerformanceMetrics());
  
  // Check date index
  const dateIndex = storage.dateIndex;
  console.log("📊 Date index size:", dateIndex?.size || 0);
  
  if (dateIndex && dateIndex.size > 0) {
    console.log("📊 Date index entries:");
    const entries = Array.from(dateIndex.entries()).slice(0, 10); // Show first 10
    entries.forEach(([dateKey, noteIds]) => {
      console.log(`  ${dateKey}: ${noteIds.size} notes`);
    });
  }
  
  // Check all calendar notes
  const allNotes = game.journal?.filter(journal => {
    const ssFlags = journal.flags?.['seasons-and-stars'];
    return ssFlags?.calendarNote === true;
  }) || [];
  
  console.log(`📊 Total calendar notes in system: ${allNotes.length}`);
  
  if (allNotes.length > 0) {
    console.log("📊 Sample notes:");
    allNotes.slice(0, 5).forEach(note => {
      const flags = note.flags['seasons-and-stars'];
      console.log(`  "${note.name}" - Date: ${flags.dateKey}, Category: ${flags.category}`);
    });
  }
}

// 3. Test note retrieval for current month
async function testNoteRetrieval() {
  if (!checkSeasonsStarsAvailable()) return;
  
  console.log("🔎 Testing note retrieval for current month...");
  
  const notesManager = game.seasonsStars.notes;
  const currentDate = game.seasonsStars.manager.getCurrentDate();
  const engine = game.seasonsStars.manager.getActiveEngine();
  
  if (!currentDate || !engine) {
    console.error("❌ Missing current date or engine");
    return;
  }
  
  const monthLength = engine.getMonthLength(currentDate.month, currentDate.year);
  console.log(`📅 Testing month ${currentDate.month}/${currentDate.year} (${monthLength} days)`);
  
  const notesByDay = new Map();
  
  // Test each day of the month
  for (let day = 1; day <= monthLength; day++) {
    const testDate = {
      year: currentDate.year,
      month: currentDate.month,
      day: day,
      weekday: 0,
      time: { hour: 0, minute: 0, second: 0 }
    };
    
    try {
      // Test both async and sync versions
      const notesAsync = await notesManager.getNotesForDate(testDate);
      const notesSync = notesManager.storage.findNotesByDateSync(testDate);
      
      if (notesAsync.length > 0 || notesSync.length > 0) {
        notesByDay.set(day, { async: notesAsync.length, sync: notesSync.length });
        console.log(`📅 Day ${day}: ${notesAsync.length} notes (async), ${notesSync.length} notes (sync)`);
      }
    } catch (error) {
      console.error(`❌ Error getting notes for day ${day}:`, error);
    }
  }
  
  console.log(`📊 Found notes on ${notesByDay.size} days this month`);
  return notesByDay;
}

// 4. Test calendar grid data generation
function testCalendarGridData() {
  if (!checkSeasonsStarsAvailable()) return;
  
  console.log("🎯 Testing calendar grid data generation...");
  
  const gridWidget = window.SeasonsStars?.CalendarGridWidget;
  if (!gridWidget) {
    console.error("❌ CalendarGridWidget not available");
    return;
  }
  
  // Get the active grid widget instance if any
  const activeInstance = gridWidget.getInstance();
  if (activeInstance) {
    console.log("📱 Found active grid widget instance");
    
    // Trigger a re-render to see if data flows correctly
    console.log("🔄 Triggering grid widget re-render...");
    activeInstance.render();
    
    // Check the generated month data
    const viewDate = activeInstance.viewDate;
    console.log("📅 Grid widget view date:", viewDate);
    
    // Try to access the generateMonthData method (it's private but we can test it)
    if (activeInstance.generateMonthData) {
      console.log("⚠️ generateMonthData is private, but checking availability...");
    }
  } else {
    console.log("📱 No active grid widget instance found");
    console.log("💡 Try opening the grid widget first, then run this test again");
  }
}

// 5. Check DOM elements and CSS classes
function checkDOMElements() {
  console.log("🌐 Checking DOM elements for calendar grid widget...");
  
  const gridWidget = document.querySelector('.calendar-grid-widget');
  if (!gridWidget) {
    console.log("❌ No calendar grid widget found in DOM");
    console.log("💡 Open the calendar grid widget first");
    return;
  }
  
  console.log("✅ Found calendar grid widget in DOM");
  
  // Check for calendar days
  const calendarDays = gridWidget.querySelectorAll('.calendar-day');
  console.log(`📅 Found ${calendarDays.length} calendar day elements`);
  
  // Check for note indicators
  const daysWithNotes = gridWidget.querySelectorAll('.calendar-day.has-notes');
  console.log(`📝 Found ${daysWithNotes.length} days with has-notes class`);
  
  // Check for specific note highlighting classes
  const categoryClasses = ['category-general', 'category-mixed', 'category-event', 'category-reminder'];
  categoryClasses.forEach(className => {
    const elements = gridWidget.querySelectorAll(`.${className}`);
    console.log(`🎨 Found ${elements.length} elements with ${className} class`);
  });
  
  // Show sample of day elements with their classes
  console.log("📋 Sample of calendar day elements:");
  Array.from(calendarDays).slice(0, 10).forEach((day, index) => {
    const dayNum = day.dataset.day;
    const classes = Array.from(day.classList).join(' ');
    console.log(`  Day ${dayNum}: classes="${classes}"`);
  });
}

// 6. Full diagnostic check
async function fullDiagnostic() {
  console.log("🔍 Running full note highlighting diagnostic...");
  console.log("=" * 60);
  
  console.log("\n1. Checking Seasons & Stars availability:");
  if (!checkSeasonsStarsAvailable()) return;
  
  console.log("\n2. Checking note storage:");
  checkNoteStorage();
  
  console.log("\n3. Testing note retrieval:");
  await testNoteRetrieval();
  
  console.log("\n4. Testing calendar grid data:");
  testCalendarGridData();
  
  console.log("\n5. Checking DOM elements:");
  checkDOMElements();
  
  console.log("\n🔍 Diagnostic complete!");
  console.log("💡 If notes exist but aren't highlighting, the issue is likely in the data flow from storage to the calendar widget.");
}

// 7. Clean up test notes
async function cleanupTestNotes() {
  console.log("🧹 Cleaning up test notes...");
  
  const testNotes = game.journal?.filter(journal => {
    const flags = journal.flags?.['seasons-and-stars'];
    return flags?.calendarNote === true && 
           (journal.name.includes('Debug Note') || flags.tags?.includes('debug'));
  }) || [];
  
  console.log(`Found ${testNotes.length} test notes to clean up`);
  
  for (const note of testNotes) {
    try {
      await note.delete();
      console.log(`🗑️ Deleted: ${note.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete: ${note.name}`, error);
    }
  }
  
  console.log("🧹 Cleanup complete");
}

// Export functions to console
console.log("🔧 Seasons & Stars Note Highlighting Debug Tools Loaded");
console.log("Available functions:");
console.log("  createTestNotes() - Create test notes for debugging");
console.log("  checkNoteStorage() - Check note storage system");  
console.log("  testNoteRetrieval() - Test note retrieval for current month");
console.log("  testCalendarGridData() - Test calendar grid data generation");
console.log("  checkDOMElements() - Check DOM elements and CSS classes");
console.log("  fullDiagnostic() - Run complete diagnostic");
console.log("  cleanupTestNotes() - Remove test notes");
console.log("");
console.log("💡 Start with: await fullDiagnostic()");

// Make functions available globally for console use
window.seasonsStarsDebug = {
  createTestNotes,
  checkNoteStorage,
  testNoteRetrieval,
  testCalendarGridData,
  checkDOMElements,
  fullDiagnostic,
  cleanupTestNotes
};