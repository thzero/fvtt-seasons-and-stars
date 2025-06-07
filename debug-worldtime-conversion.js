/**
 * Debug script to trace worldTime to days conversion issue
 * Run in Foundry console to see exactly what's happening
 */

// Copy the calendar engine logic to debug step by step
function debugWorldTimeConversion() {
  console.log('=== DEBUGGING WORLDTIME CONVERSION ===');
  
  // Calendar configuration from Golarion
  const calendar = {
    time: {
      hoursInDay: 24,
      minutesInHour: 60,
      secondsInMinute: 60
    }
  };
  
  // Test case: One year worth of seconds
  const oneYearInSeconds = 365.25 * 24 * 60 * 60; // 31,557,600
  console.log('One year in seconds:', oneYearInSeconds);
  
  // Calculate seconds per day
  const secondsPerDay = calendar.time.hoursInDay * calendar.time.minutesInHour * calendar.time.secondsInMinute;
  console.log('Seconds per day:', secondsPerDay); // Should be 86,400
  
  // Calculate total days
  const totalDays = Math.floor(oneYearInSeconds / secondsPerDay);
  console.log('Total days from one year:', totalDays); // Should be 365 or 366
  
  // Test with the actual values from failing test
  const testCases = [
    { worldTime: 0, description: 'Epoch' },
    { worldTime: 86400, description: 'One day' },
    { worldTime: 31536000, description: 'One year (365 days)' },
    { worldTime: 31557600, description: 'One year (365.25 days)' }
  ];
  
  testCases.forEach(({ worldTime, description }) => {
    const totalSeconds = Math.floor(worldTime);
    const calculatedDays = Math.floor(totalSeconds / secondsPerDay);
    const daysFraction = (totalSeconds / secondsPerDay);
    
    console.log(`${description}:`);
    console.log(`  WorldTime: ${worldTime}`);
    console.log(`  Total seconds: ${totalSeconds}`);
    console.log(`  Days (exact): ${daysFraction}`);
    console.log(`  Days (floored): ${calculatedDays}`);
    console.log(`  Expected year advancement: ${calculatedDays >= 365 ? 'YES' : 'NO'}`);
    console.log('---');
  });
  
  // Now check what S&S is actually producing
  if (game.seasonsStars?.manager) {
    console.log('\n=== ACTUAL S&S BEHAVIOR ===');
    const manager = game.seasonsStars.manager;
    const engine = manager.getActiveEngine();
    
    testCases.forEach(({ worldTime, description }) => {
      const result = engine.worldTimeToDate(worldTime);
      console.log(`${description}: ${result.year}/${result.month}/${result.day}`);
    });
  }
}

// Test the round-trip conversion too
function debugRoundTripConversion() {
  console.log('\n=== DEBUGGING ROUND-TRIP CONVERSION ===');
  
  if (game.seasonsStars?.manager) {
    const engine = game.seasonsStars.manager.getActiveEngine();
    
    // Test a date that should be 1 year after epoch
    const testDate = { year: 2701, month: 1, day: 1 }; // One year after Golarion epoch
    
    console.log('Test date:', testDate);
    
    // Convert to worldTime
    const worldTime = engine.dateToWorldTime(testDate);
    console.log('Converted to worldTime:', worldTime);
    console.log('WorldTime in days:', worldTime / 86400);
    console.log('Expected days for 1 year:', 365.25);
    
    // Convert back
    const reconverted = engine.worldTimeToDate(worldTime);
    console.log('Converted back to date:', reconverted);
    
    // Check if round-trip works
    const matches = testDate.year === reconverted.year && 
                   testDate.month === reconverted.month && 
                   testDate.day === reconverted.day;
    console.log('Round-trip successful:', matches);
    
    if (!matches) {
      console.log('❌ Round-trip FAILED - this indicates the bug');
    } else {
      console.log('✅ Round-trip PASSED - bug is elsewhere');
    }
  }
}

// Check if current game.time.worldTime is reasonable
function checkCurrentWorldTime() {
  console.log('\n=== CURRENT GAME STATE ===');
  console.log('game.time.worldTime:', game.time.worldTime);
  console.log('WorldTime in days:', game.time.worldTime / 86400);
  console.log('WorldTime in years:', game.time.worldTime / (86400 * 365.25));
  
  if (game.seasonsStars?.manager) {
    const currentDate = game.seasonsStars.manager.getCurrentDate();
    console.log('S&S current date:', currentDate);
    
    // Check if the current worldTime makes sense for current date
    const engine = game.seasonsStars.manager.getActiveEngine();
    const calculatedWorldTime = engine.dateToWorldTime(currentDate);
    console.log('S&S calculated worldTime for current date:', calculatedWorldTime);
    console.log('Difference from game.time.worldTime:', Math.abs(game.time.worldTime - calculatedWorldTime));
  }
}

// Run all debug functions
debugWorldTimeConversion();
debugRoundTripConversion();
checkCurrentWorldTime();