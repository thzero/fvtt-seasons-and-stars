/**
 * Quick manual test to create a note and check if it shows up in the calendar
 * Paste this into the browser console while in a Foundry world
 */

async function quickNoteTest() {
  console.log("🔬 Quick Note Test Starting...");
  
  // Check if S&S is available
  if (!game.seasonsStars?.notes) {
    console.error("❌ Seasons & Stars notes manager not available");
    return;
  }
  
  if (!game.seasonsStars?.manager) {
    console.error("❌ Seasons & Stars calendar manager not available");
    return;
  }
  
  const notesManager = game.seasonsStars.notes;
  const currentDate = game.seasonsStars.manager.getCurrentDate();
  
  if (!currentDate) {
    console.error("❌ No current date available");
    return;
  }
  
  console.log("📅 Current date:", currentDate.toObject());
  
  // Create a simple test note for today
  const testNoteData = {
    title: "QUICK TEST NOTE",
    content: "This note should show up in the calendar grid with highlighting",
    startDate: currentDate.toObject(),
    allDay: true,
    category: "general",
    tags: ["quicktest"],
    playerVisible: true
  };
  
  try {
    console.log("📝 Creating test note...");
    const note = await notesManager.createNote(testNoteData);
    console.log("✅ Note created successfully:", note.name, note.id);
    
    // Check if it's in the storage index
    console.log("🔍 Checking storage index...");
    const dateKey = `${currentDate.year}-${currentDate.month.toString().padStart(2, '0')}-${currentDate.day.toString().padStart(2, '0')}`;
    console.log("📅 Looking for dateKey:", dateKey);
    
    const storage = notesManager.storage;
    const notesForToday = storage.findNotesByDateSync(currentDate.toObject());
    console.log(`📊 Found ${notesForToday.length} notes for today:`, notesForToday.map(n => n.name));
    
    // Check the date index directly
    const dateIndexEntry = storage.dateIndex?.get(dateKey);
    console.log(`📊 Date index entry for ${dateKey}:`, dateIndexEntry ? Array.from(dateIndexEntry) : "none");
    
    // Force rebuild storage index
    console.log("🔄 Rebuilding storage index...");
    storage.rebuildIndex();
    
    // Check again
    const notesAfterRebuild = storage.findNotesByDateSync(currentDate.toObject());
    console.log(`📊 After rebuild: ${notesAfterRebuild.length} notes for today:`, notesAfterRebuild.map(n => n.name));
    
    // Check if calendar grid widget exists and refresh it
    const gridWidget = window.SeasonsStars?.CalendarGridWidget?.getInstance();
    if (gridWidget) {
      console.log("📱 Found calendar grid widget, refreshing...");
      gridWidget.render();
      console.log("✅ Calendar grid widget refreshed");
      
      // Wait a moment then check DOM
      setTimeout(() => {
        const calendarElement = document.querySelector('.calendar-grid-widget');
        if (calendarElement) {
          const todayElement = calendarElement.querySelector(`[data-day="${currentDate.day}"]`);
          if (todayElement) {
            console.log("🎯 Today's calendar element classes:", todayElement.classList.toString());
            console.log("🎯 Today's calendar element has-notes:", todayElement.classList.contains('has-notes'));
          } else {
            console.log("❌ Could not find today's calendar element");
          }
        } else {
          console.log("❌ Could not find calendar grid widget in DOM");
        }
      }, 500);
      
    } else {
      console.log("❌ No calendar grid widget found - open it first, then try again");
    }
    
    return note;
    
  } catch (error) {
    console.error("❌ Failed to create test note:", error);
  }
}

// Cleanup function
async function cleanupQuickTest() {
  console.log("🧹 Cleaning up quick test notes...");
  
  const testNotes = game.journal?.filter(journal => 
    journal.name === "QUICK TEST NOTE" || 
    journal.flags?.['seasons-and-stars']?.tags?.includes('quicktest')
  ) || [];
  
  for (const note of testNotes) {
    try {
      await note.delete();
      console.log(`🗑️ Deleted: ${note.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete: ${note.name}`, error);
    }
  }
  
  console.log("✅ Cleanup complete");
}

console.log("💡 Quick test functions loaded:");
console.log("  quickNoteTest() - Create a test note and check highlighting");
console.log("  cleanupQuickTest() - Remove test notes");
console.log("");
console.log("🚀 Run: await quickNoteTest()");

// Make functions globally available
window.quickNoteTest = quickNoteTest;
window.cleanupQuickTest = cleanupQuickTest;