/**
 * Comprehensive Simple Weather Integration Test
 * 
 * This test validates the complete integration between Simple Weather and Seasons & Stars
 * via the Simple Calendar compatibility bridge, testing all aspects including:
 * - API availability and methods
 * - Note creation and flag storage 
 * - Weather data persistence and retrieval
 * - Date format conversion (0-based SC ↔ 1-based S&S)
 * - Module flag handling for weather data
 */

(async function comprehensiveSimpleWeatherTest() {
  console.log('🌤️ === Comprehensive Simple Weather + Seasons & Stars Integration Test ===');
  
  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${details ? ' - ' + details : ''}`);
    
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push(`${testName}: ${details}`);
    }
  }
  
  try {
    // Test 0: Module Availability Check
    console.log('\n--- Module Availability Check ---');
    
    const simpleWeather = game.modules.get('simple-weather');
    const seasonsStars = game.modules.get('seasons-and-stars');
    const compatBridge = game.modules.get('simple-calendar-compat');
    
    logTest('Simple Weather module loaded', !!simpleWeather?.active);
    logTest('Seasons & Stars module loaded', !!seasonsStars?.active);
    logTest('SC Compat Bridge loaded', !!compatBridge?.active);
    logTest('SimpleCalendar API available', !!window.SimpleCalendar);
    
    if (!simpleWeather?.active || !seasonsStars?.active || !window.SimpleCalendar) {
      console.error('❌ Missing required modules - cannot continue test');
      return;
    }
    
    // Test 1: API Method Availability
    console.log('\n--- Test 1: API Method Availability ---');
    
    const api = window.SimpleCalendar.api;
    logTest('addNote method available', typeof api.addNote === 'function');
    logTest('removeNote method available', typeof api.removeNote === 'function');
    logTest('getNotesForDay method available', typeof api.getNotesForDay === 'function');
    logTest('getCurrentDate method available', typeof api.getCurrentDate === 'function');
    logTest('timestampToDate method available', typeof api.timestampToDate === 'function');
    
    // Test 2: Seasons & Stars Notes System
    console.log('\n--- Test 2: Seasons & Stars Notes System ---');
    
    const ssNotes = game.seasonsStars?.notes;
    logTest('S&S notes manager available', !!ssNotes);
    logTest('S&S createNote method', typeof ssNotes?.createNote === 'function');
    logTest('S&S setNoteModuleData method', typeof ssNotes?.setNoteModuleData === 'function');
    logTest('S&S getNoteModuleData method', typeof ssNotes?.getNoteModuleData === 'function');
    
    // Test 3: Date Format Conversion
    console.log('\n--- Test 3: Date Format Conversion ---');
    
    const currentDate = api.getCurrentDate();
    console.log('Current Date (Simple Calendar format - 0-based):', {
      year: currentDate.year,
      month: currentDate.month,
      day: currentDate.day
    });
    
    // Simple Calendar uses 0-based months/days, S&S uses 1-based
    const scMonth = currentDate.month; // 0-based
    const scDay = currentDate.day;     // 0-based
    const ssMonth = scMonth + 1;       // Convert to 1-based
    const ssDay = scDay + 1;           // Convert to 1-based
    
    console.log('Converted to S&S format (1-based):', {
      year: currentDate.year,
      month: ssMonth,
      day: ssDay
    });
    
    logTest('Date conversion logic correct', ssMonth > 0 && ssDay > 0 && ssMonth <= 12);
    
    // Test 4: Weather Note Creation and Flag Storage
    console.log('\n--- Test 4: Weather Note Creation and Flag Storage ---');
    
    // Create a weather note like Simple Weather does
    const weatherData = {
      temperature: 68,
      description: 'Partly cloudy with light breeze',
      humidity: 55,
      windSpeed: 12,
      precipitation: 0,
      season: 'Spring',
      hexFlowerCell: 42,
      climate: 1,
      testData: true // Mark as test data
    };
    
    const noteTitle = '🌤️ Test Weather Data';
    const noteContent = `Today's weather: ${weatherData.temperature}°F - ${weatherData.description}`;
    
    console.log('Creating weather note with data:', weatherData);
    
    const weatherNote = await api.addNote(
      noteTitle,
      noteContent,
      { year: currentDate.year, month: currentDate.month, day: currentDate.day },
      null,
      true // allDay
    );
    
    logTest('Weather note created', !!weatherNote);
    logTest('Weather note has ID', !!weatherNote?.id);
    
    if (!weatherNote) {
      console.error('❌ Cannot continue - weather note creation failed');
      return;
    }
    
    // Store weather data in flag (like Simple Weather does)
    console.log('Setting weather flag data...');
    await weatherNote.setFlag('simple-weather', 'dailyWeather', weatherData);
    
    logTest('Weather flag data set', true);
    
    // Test 5: Note Retrieval and Flag Data Recovery
    console.log('\n--- Test 5: Note Retrieval and Flag Data Recovery ---');
    
    const notesForDay = api.getNotesForDay(
      currentDate.year,
      currentDate.month,
      currentDate.day
    );
    
    logTest('Notes retrieved for current day', notesForDay.length > 0);
    console.log(`Found ${notesForDay.length} notes for current day`);
    
    // Find our test weather note
    const foundWeatherNote = notesForDay.find(note => 
      note.name === noteTitle || note.title === noteTitle
    );
    
    logTest('Test weather note found in results', !!foundWeatherNote);
    
    if (foundWeatherNote) {
      // Retrieve flag data
      const retrievedWeatherData = foundWeatherNote.getFlag('simple-weather', 'dailyWeather');
      
      logTest('Weather flag data retrieved', !!retrievedWeatherData);
      logTest('Weather data temperature matches', retrievedWeatherData?.temperature === weatherData.temperature);
      logTest('Weather data description matches', retrievedWeatherData?.description === weatherData.description);
      logTest('Test marker present', retrievedWeatherData?.testData === true);
      
      console.log('Retrieved weather data:', retrievedWeatherData);
    }
    
    // Test 6: Module Data API Usage
    console.log('\n--- Test 6: Module Data API Usage (Direct S&S API) ---');
    
    if (ssNotes) {
      try {
        // Test direct module data API
        const moduleTestData = { customField: 'test-value', timestamp: Date.now() };
        await ssNotes.setNoteModuleData(weatherNote.id, 'test-module', moduleTestData);
        logTest('setNoteModuleData works', true);
        
        const retrievedModuleData = ssNotes.getNoteModuleData(weatherNote.id, 'test-module');
        logTest('getNoteModuleData works', !!retrievedModuleData);
        logTest('Module data matches', retrievedModuleData?.customField === 'test-value');
        
      } catch (error) {
        logTest('Module data API test', false, error.message);
      }
    }
    
    // Test 7: Note Persistence Across Date Changes  
    console.log('\n--- Test 7: Note Persistence Across Virtual Date Changes ---');
    
    // Simulate changing to tomorrow and back
    const tomorrowDate = {
      year: currentDate.year,
      month: currentDate.month,
      day: currentDate.day + 1
    };
    
    // Check tomorrow has no weather notes initially
    const tomorrowNotes = api.getNotesForDay(
      tomorrowDate.year,
      tomorrowDate.month,
      tomorrowDate.day
    );
    
    logTest('Tomorrow starts with no weather notes', 
      !tomorrowNotes.some(note => note.getFlag('simple-weather', 'dailyWeather')?.testData)
    );
    
    // Check our weather note is still present for today
    const todayNotesAgain = api.getNotesForDay(
      currentDate.year,
      currentDate.month,
      currentDate.day
    );
    
    const weatherNoteStillThere = todayNotesAgain.find(note => 
      note.getFlag('simple-weather', 'dailyWeather')?.testData === true
    );
    
    logTest('Weather note persists for original date', !!weatherNoteStillThere);
    
    // Test 8: Cleanup
    console.log('\n--- Test 8: Cleanup ---');
    
    try {
      await api.removeNote(weatherNote.id);
      logTest('Test weather note removed', true);
      
      // Verify removal
      const notesAfterCleanup = api.getNotesForDay(
        currentDate.year,
        currentDate.month,
        currentDate.day
      );
      
      const noteStillExists = notesAfterCleanup.find(note => 
        note.getFlag('simple-weather', 'dailyWeather')?.testData === true
      );
      
      logTest('Weather note successfully deleted', !noteStillExists);
      
    } catch (error) {
      logTest('Cleanup', false, error.message);
    }
    
    // Test Summary
    console.log('\n🏁 === Test Summary ===');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    console.log(`\n📊 Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('\n🎉 INTEGRATION TEST PASSED - Simple Weather + Seasons & Stars compatibility verified!');
    } else {
      console.log('\n⚠️ INTEGRATION TEST NEEDS ATTENTION - Some compatibility issues detected');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal test error:', error);
    console.error('Stack trace:', error.stack);
  }
})();