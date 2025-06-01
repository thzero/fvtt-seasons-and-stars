/**
 * Simple Weather Integration Test Script
 * 
 * This script tests the integration between Simple Weather and Seasons & Stars notes system
 * via the Simple Calendar compatibility bridge.
 * 
 * Run this in a Foundry VTT console with both Simple Weather and Seasons & Stars active.
 */

(async function testSimpleWeatherIntegration() {
  console.log('=== Simple Weather + Seasons & Stars Integration Test ===');
  
  // Check if required modules are available
  const hasSimpleWeather = !!game.modules.get('simple-weather')?.active;
  const hasSeasonsStars = !!game.modules.get('seasons-and-stars')?.active;
  const hasCompatBridge = !!game.modules.get('simple-calendar-compat')?.active;
  
  console.log('Module Status:', {
    'Simple Weather': hasSimpleWeather,
    'Seasons & Stars': hasSeasonsStars,  
    'SC Compat Bridge': hasCompatBridge
  });
  
  if (!hasSimpleWeather || !hasSeasonsStars) {
    console.error('Missing required modules for integration test');
    return;
  }
  
  // Test 1: Simple Calendar API availability
  console.log('\n--- Test 1: Simple Calendar API Availability ---');
  const hasSimpleCalendarAPI = !!window.SimpleCalendar;
  console.log('window.SimpleCalendar available:', hasSimpleCalendarAPI);
  
  if (!hasSimpleCalendarAPI) {
    console.error('SimpleCalendar API not available - bridge may not be loaded');
    return;
  }
  
  // Test 2: Notes API methods
  console.log('\n--- Test 2: Notes API Methods ---');
  const notesAPI = window.SimpleCalendar.api;
  const hasAddNote = typeof notesAPI.addNote === 'function';
  const hasRemoveNote = typeof notesAPI.removeNote === 'function';
  const hasGetNotesForDay = typeof notesAPI.getNotesForDay === 'function';
  
  console.log('Notes API Methods:', {
    addNote: hasAddNote,
    removeNote: hasRemoveNote,
    getNotesForDay: hasGetNotesForDay
  });
  
  // Test 3: Create a test weather note
  console.log('\n--- Test 3: Create Test Weather Note ---');
  try {
    const currentDate = window.SimpleCalendar.api.getCurrentDate();
    console.log('Current Date (SC format):', currentDate);
    
    // Create a weather note like Simple Weather would
    const weatherNote = await notesAPI.addNote(
      'Test Weather Data',
      'This is a test weather note created by the integration test.',
      { year: currentDate.year, month: currentDate.month, day: currentDate.day },
      null,
      true // allDay
    );
    
    console.log('Created weather note:', weatherNote);
    
    // Test 4: Set weather flag data
    console.log('\n--- Test 4: Set Weather Flag Data ---');
    const weatherData = {
      temperature: 72,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      season: 'Spring'
    };
    
    // This simulates how Simple Weather stores data
    await weatherNote.setFlag('simple-weather', 'dailyWeather', weatherData);
    console.log('Set weather flag data:', weatherData);
    
    // Test 5: Retrieve notes for the current day
    console.log('\n--- Test 5: Retrieve Notes for Current Day ---');
    const notesForDay = notesAPI.getNotesForDay(
      currentDate.year,
      currentDate.month,
      currentDate.day
    );
    
    console.log(`Found ${notesForDay.length} notes for current day:`, notesForDay);
    
    // Test 6: Verify flag data retrieval
    console.log('\n--- Test 6: Verify Flag Data Retrieval ---');
    if (notesForDay.length > 0) {
      for (const note of notesForDay) {
        const flagData = note.getFlag('simple-weather', 'dailyWeather');
        console.log(`Note "${note.name}" weather data:`, flagData);
      }
    }
    
    // Test 7: Clean up - remove test note
    console.log('\n--- Test 7: Clean Up ---');
    await notesAPI.removeNote(weatherNote.id);
    console.log('Cleaned up test note');
    
    console.log('\n✅ Simple Weather Integration Test PASSED');
    
  } catch (error) {
    console.error('\n❌ Simple Weather Integration Test FAILED:', error);
  }
})();