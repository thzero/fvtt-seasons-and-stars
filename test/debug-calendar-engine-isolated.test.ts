/**
 * Isolated test to identify exactly where the calendar engine bug occurs
 */

import { describe, test, expect } from 'vitest';
import { CalendarEngine } from '../src/core/calendar-engine';
import type { SeasonsStarsCalendar } from '../src/types/calendar';

const golarionCalendar: SeasonsStarsCalendar = {
  id: "golarion-pf2e",
  year: {
    epoch: 2700,
    currentYear: 4710,
    startDay: 6
  },
  leapYear: {
    rule: "custom",
    interval: 4,
    month: "Calistril",
    extraDays: 1
  },
  months: [
    { name: "Abadius", abbreviation: "Aba", days: 31 },
    { name: "Calistril", abbreviation: "Cal", days: 28 },
    { name: "Pharast", abbreviation: "Pha", days: 31 },
    { name: "Gozran", abbreviation: "Goz", days: 30 },
    { name: "Desnus", abbreviation: "Des", days: 31 },
    { name: "Sarenith", abbreviation: "Sar", days: 30 },
    { name: "Erastus", abbreviation: "Era", days: 31 },
    { name: "Arodus", abbreviation: "Aro", days: 31 },
    { name: "Rova", abbreviation: "Rov", days: 30 },
    { name: "Lamashan", abbreviation: "Lam", days: 31 },
    { name: "Neth", abbreviation: "Net", days: 30 },
    { name: "Kuthona", abbreviation: "Kut", days: 31 }
  ],
  weekdays: [
    { name: "Moonday" }, { name: "Toilday" }, { name: "Wealday" },
    { name: "Oathday" }, { name: "Fireday" }, { name: "Starday" }, { name: "Sunday" }
  ],
  intercalary: [],
  time: {
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60
  }
};

describe('Isolated Calendar Engine Bug Investigation', () => {
  test('Step by step worldTimeToDate debugging', () => {
    const engine = new CalendarEngine(golarionCalendar);
    
    // Test case: One year worth of seconds (should advance to year 2701)
    const oneYearInSeconds = 31536000; // 365 * 24 * 60 * 60
    
    console.log('\n=== STEP BY STEP DEBUGGING ===');
    console.log('Input worldTime:', oneYearInSeconds);
    
    // Manual calculation of what worldTimeToDate should do
    const totalSeconds = Math.floor(oneYearInSeconds);
    const secondsPerDay = golarionCalendar.time.hoursInDay * 
                         golarionCalendar.time.minutesInHour * 
                         golarionCalendar.time.secondsInMinute;
    const totalDays = Math.floor(totalSeconds / secondsPerDay);
    
    console.log('Manual calculation:');
    console.log('- totalSeconds:', totalSeconds);
    console.log('- secondsPerDay:', secondsPerDay);
    console.log('- totalDays:', totalDays);
    console.log('- Expected: totalDays should be 365');
    
    // Now test the actual method
    const result = engine.worldTimeToDate(oneYearInSeconds);
    console.log('\nActual result from worldTimeToDate:');
    console.log('- year:', result.year);
    console.log('- month:', result.month);
    console.log('- day:', result.day);
    console.log('- Expected: year should be 2701, got:', result.year);
    
    // Test if daysToDate works correctly with 365 days
    // @ts-ignore - accessing private method for debugging
    const daysToDateResult = engine.daysToDate(365);
    console.log('\nTesting daysToDate(365) directly:');
    console.log('- year:', daysToDateResult.year);
    console.log('- month:', daysToDateResult.month);
    console.log('- day:', daysToDateResult.day);
    console.log('- Expected: year should be 2701 for 365 days from epoch');
    
    // Check if the issue is in year length calculation
    // @ts-ignore - accessing private method
    const yearLength2700 = engine.getYearLength(2700);
    console.log('\nYear length for epoch year 2700:', yearLength2700);
    console.log('- Expected: should be 365 or 366');
    console.log('- If totalDays (365) >= yearLength (365), should advance to 2701');
    
    // The bug should be visible here
    expect(result.year).toBe(2701); // This should pass if engine works correctly
  });
  
  test('Test different day counts to isolate year advancement bug', () => {
    const engine = new CalendarEngine(golarionCalendar);
    
    const testCases = [
      { days: 364, expectedYear: 2700, description: 'One day before year end' },
      { days: 365, expectedYear: 2701, description: 'Exactly one year' },
      { days: 366, expectedYear: 2701, description: 'One day past year' },
      { days: 730, expectedYear: 2702, description: 'Two years' }
    ];
    
    console.log('\n=== YEAR ADVANCEMENT TEST ===');
    
    testCases.forEach(({ days, expectedYear, description }) => {
      // @ts-ignore - accessing private method
      const result = engine.daysToDate(days);
      console.log(`${description} (${days} days): year=${result.year}, expected=${expectedYear}`);
      
      if (result.year !== expectedYear) {
        console.log(`❌ FAILED: Expected year ${expectedYear}, got ${result.year}`);
      } else {
        console.log(`✅ PASSED: Year ${result.year} matches expected`);
      }
    });
  });
  
  test('Test getYearLength method for potential issues', () => {
    const engine = new CalendarEngine(golarionCalendar);
    
    console.log('\n=== YEAR LENGTH CALCULATION TEST ===');
    
    // Test year lengths around epoch
    for (let year = 2700; year <= 2705; year++) {
      // @ts-ignore - accessing private method
      const yearLength = engine.getYearLength(year);
      // @ts-ignore - accessing private method  
      const isLeapYear = engine.isLeapYear(year);
      
      console.log(`Year ${year}: ${yearLength} days (leap: ${isLeapYear})`);
      
      // Standard years should be 365, leap years 366
      const expectedLength = isLeapYear ? 366 : 365;
      if (yearLength !== expectedLength) {
        console.log(`❌ FAILED: Expected ${expectedLength} days, got ${yearLength}`);
      }
    }
  });
});