/**
 * Manual WFRP Calendar Test Script
 *
 * Tests the exact scenarios from GitHub Issue #21
 * Run this in a browser console with the WFRP calendar loaded
 */

console.log('🧪 WFRP Calendar Manual Test Script - Issue #21');
console.log('===============================================');

// Verify we have the WFRP calendar loaded
if (!window.SeasonsAndStars?.calendarManager?.engine) {
  console.error('❌ Seasons & Stars not loaded or no calendar engine found');
  console.log('Please load the WFRP calendar first');
} else {
  const engine = window.SeasonsAndStars.calendarManager.engine;
  const calendar = engine.getCalendar();

  console.log(`✅ Calendar loaded: ${calendar.id || 'unknown'}`);
  console.log(`✅ Weekdays: ${calendar.weekdays?.length || 0} (expected: 8 for WFRP)`);
  console.log(
    `✅ Intercalary days: ${calendar.intercalaryDays?.length || 0} (expected: 6 for WFRP)`
  );

  // Test 1: Verify intercalary days are visible in calendar
  console.log('\\n🧪 TEST 1: Intercalary Day Visibility');
  console.log('=====================================');

  const intercalaryDays = engine.getIntercalaryDays(2522);
  console.log(`Found ${intercalaryDays.length} intercalary days for year 2522:`);
  intercalaryDays.forEach((day, index) => {
    console.log(`  ${index + 1}. ${day.name} (after ${day.afterMonth}/${day.afterDay})`);
  });

  // Test 2: Issue #21 specific scenario - weekday progression
  console.log('\\n🧪 TEST 2: Issue #21 Weekday Progression Bug');
  console.log('=============================================');

  // Test the exact scenario: 33rd Jahrdrung → Mitterfruhl → 1st Pflugzeit
  const jahrdrung33 = { year: 2522, month: 2, day: 33, weekday: 0 };
  const weekdayBefore = engine.calculateWeekday(
    jahrdrung33.year,
    jahrdrung33.month,
    jahrdrung33.day
  );
  const weekdayName = calendar.weekdays[weekdayBefore];

  console.log(`33rd Jahrdrung = ${weekdayName} (weekday ${weekdayBefore})`);

  // Add 1 day to get to Mitterfruhl (intercalary day)
  const mitterfruhl = engine.addDays(jahrdrung33, 1);
  console.log(
    `+1 day → ${mitterfruhl.month}/${mitterfruhl.day} (should be Mitterfruhl intercalary day)`
  );

  // Add 2 days total to get to 1st Pflugzeit
  const pflugzeit1 = engine.addDays(jahrdrung33, 2);
  const weekdayAfter = engine.calculateWeekday(pflugzeit1.year, pflugzeit1.month, pflugzeit1.day);
  const weekdayAfterName = calendar.weekdays[weekdayAfter];

  console.log(
    `+2 days → ${pflugzeit1.month}/${pflugzeit1.day} = ${weekdayAfterName} (weekday ${weekdayAfter})`
  );

  // Verify the weekday advanced by exactly 1 (skipping Mitterfruhl)
  const expectedWeekday = (weekdayBefore + 1) % calendar.weekdays.length;
  const weekdayDiff = weekdayAfter - weekdayBefore;

  console.log(`\\nWeekday progression check:`);
  console.log(`  Before: ${weekdayBefore} (${weekdayName})`);
  console.log(`  After:  ${weekdayAfter} (${weekdayAfterName})`);
  console.log(`  Difference: ${weekdayDiff} (should be 1 for proper intercalary day handling)`);
  console.log(`  Expected: ${expectedWeekday}`);

  if (weekdayAfter === expectedWeekday) {
    console.log('✅ WEEKDAY PROGRESSION: FIXED! Intercalary days properly skipped');
  } else {
    console.log(
      '❌ WEEKDAY PROGRESSION: BROKEN! Intercalary days incorrectly count towards weekdays'
    );
  }

  // Test 3: Week advancement bug
  console.log('\\n🧪 TEST 3: Week Advancement Bug (+1 week should be +8 days)');
  console.log('===========================================================');

  const startDate = { year: 2522, month: 3, day: 10, weekday: 0 };
  const startWeekday = engine.calculateWeekday(startDate.year, startDate.month, startDate.day);
  const startWeekdayName = calendar.weekdays[startWeekday];

  console.log(
    `Start: ${startDate.month}/${startDate.day} = ${startWeekdayName} (weekday ${startWeekday})`
  );

  // Test +1 week advancement (should be +8 days for WFRP)
  const afterWeek = engine.addDays(startDate, calendar.weekdays.length);
  const afterWeekday = engine.calculateWeekday(afterWeek.year, afterWeek.month, afterWeek.day);
  const afterWeekdayName = calendar.weekdays[afterWeekday];

  const daysAdvanced = engine.dateToDays(afterWeek) - engine.dateToDays(startDate);

  console.log(
    `+${calendar.weekdays.length} days: ${afterWeek.month}/${afterWeek.day} = ${afterWeekdayName} (weekday ${afterWeekday})`
  );
  console.log(`Days actually advanced: ${daysAdvanced}`);

  if (daysAdvanced === calendar.weekdays.length && afterWeekday === startWeekday) {
    console.log('✅ WEEK ADVANCEMENT: FIXED! +1 week advances 8 days and returns to same weekday');
  } else {
    console.log('❌ WEEK ADVANCEMENT: BROKEN! Week advancement not using correct 8-day length');
  }

  // Test 4: All intercalary days check
  console.log('\\n🧪 TEST 4: All 6 WFRP Intercalary Days Navigation');
  console.log('=================================================');

  const expectedIntercalary = [
    { name: 'Hexenstag', month: 12, afterDay: 33 },
    { name: 'Mitterfruhl', month: 2, afterDay: 33 },
    { name: 'Sonnstill', month: 5, afterDay: 33 },
    { name: 'Geheimnistag', month: 6, afterDay: 33 },
    { name: 'Mittherbst', month: 8, afterDay: 33 },
    { name: 'Mondstille', month: 11, afterDay: 33 },
  ];

  let allIntercalaryWorking = true;

  expectedIntercalary.forEach((expected, index) => {
    try {
      const beforeIntercalary = {
        year: 2522,
        month: expected.month,
        day: expected.afterDay,
        weekday: 0,
      };
      const intercalaryDate = engine.addDays(beforeIntercalary, 1);

      console.log(
        `${index + 1}. ${expected.name}: ${expected.month}/${expected.afterDay} → ${intercalaryDate.month}/${intercalaryDate.day}`
      );

      // Check if this creates a valid intercalary day
      if (intercalaryDate.month !== expected.month || intercalaryDate.day !== 1) {
        console.log(
          `   ❌ Expected month ${expected.month} day 1, got month ${intercalaryDate.month} day ${intercalaryDate.day}`
        );
        allIntercalaryWorking = false;
      } else {
        console.log(`   ✅ Correct intercalary day navigation`);
      }
    } catch (error) {
      console.log(`   ❌ Error navigating to ${expected.name}: ${error.message}`);
      allIntercalaryWorking = false;
    }
  });

  if (allIntercalaryWorking) {
    console.log('✅ ALL INTERCALARY DAYS: Navigation working correctly');
  } else {
    console.log('❌ INTERCALARY DAYS: Some navigation issues found');
  }

  // Overall test results
  console.log('\\n🎯 OVERALL TEST RESULTS');
  console.log('=======================');
  console.log('Test this manually in the calendar UI:');
  console.log('1. Navigate to 33rd Jahrdrung');
  console.log('2. Click +1 day button → should show Mitterfruhl');
  console.log('3. Click +1 day button again → should show 1st Pflugzeit with correct weekday');
  console.log('4. Use +1 week button from any date → should advance 8 days');
  console.log('5. Check that all 6 intercalary days are visible in calendar grid');

  console.log('\\n✅ Manual test script completed');
}

// Function to help with manual UI testing
window.testWFRPIssue21 = function () {
  console.log('Setting calendar to test scenario...');

  if (window.SeasonsAndStars?.calendarManager) {
    // Set to 33rd Jahrdrung for testing
    window.SeasonsAndStars.calendarManager.setCurrentDate({
      year: 2522,
      month: 2,
      day: 33,
      weekday: 0,
    });
    console.log('Calendar set to 33rd Jahrdrung 2522 - now test the +1 day button!');
  } else {
    console.log('Calendar manager not available');
  }
};

console.log('\\n💡 TIP: Run testWFRPIssue21() to set calendar to test date');
