/**
 * CRITICAL: Universal Calendar Engine Failure Test Suite
 * 
 * This test suite documents the complete failure of the Seasons & Stars calendar engine
 * where worldTimeToDate() always returns epoch dates regardless of worldTime value.
 * 
 * Related to GitHub Issue #20 - PF2e Calendar Date Mismatch
 * Root Cause: S&S core calendar engine completely broken for ALL calendars
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../src/core/calendar-engine';
import type { SeasonsStarsCalendar } from '../src/types/calendar';

// Load the actual Golarion calendar used in PF2e
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
    { name: "Moonday" },
    { name: "Toilday" }, 
    { name: "Wealday" },
    { name: "Oathday" },
    { name: "Fireday" },
    { name: "Starday" },
    { name: "Sunday" }
  ],
  intercalary: [],
  time: {
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60
  }
};

// Basic Gregorian calendar for testing universality 
const gregorianCalendar: SeasonsStarsCalendar = {
  id: "gregorian",
  year: {
    epoch: 0,
    currentYear: 2025,
    startDay: 0
  },
  leapYear: {
    rule: "gregorian",
    month: "February",
    extraDays: 1
  },
  months: [
    { name: "January", days: 31 },
    { name: "February", days: 28 },
    { name: "March", days: 31 },
    { name: "April", days: 30 },
    { name: "May", days: 31 },
    { name: "June", days: 30 },
    { name: "July", days: 31 },
    { name: "August", days: 31 },
    { name: "September", days: 30 },
    { name: "October", days: 31 },
    { name: "November", days: 30 },
    { name: "December", days: 31 }
  ],
  weekdays: [
    { name: "Sunday" },
    { name: "Monday" },
    { name: "Tuesday" },
    { name: "Wednesday" },
    { name: "Thursday" },
    { name: "Friday" },
    { name: "Saturday" }
  ],
  intercalary: [],
  time: {
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60
  }
};

describe('CRITICAL: Universal Calendar Engine Failure - Issue #20', () => {
  let golarionEngine: CalendarEngine;
  let gregorianEngine: CalendarEngine;

  beforeEach(() => {
    golarionEngine = new CalendarEngine(golarionCalendar);
    gregorianEngine = new CalendarEngine(gregorianCalendar);
  });

  test('FAILING: Golarion calendar worldTimeToDate should advance from epoch, not stay frozen', () => {
    console.log('\n=== GOLARION CALENDAR ENGINE FAILURE TEST ===');
    
    // Test that worldTime advancement should change the calculated date
    const testCases = [
      { worldTime: 0, description: 'Epoch (worldTime = 0)' },
      { worldTime: 86400, description: 'One day later (86400 seconds)' },
      { worldTime: 86400 * 7, description: 'One week later' },
      { worldTime: 86400 * 30, description: 'One month later' },
      { worldTime: 86400 * 365, description: 'One year later' }
    ];
    
    const results = testCases.map(({ worldTime, description }) => {
      const ssDate = golarionEngine.worldTimeToDate(worldTime);
      console.log(`${description}: worldTime=${worldTime} → S&S date=${ssDate.year}-${ssDate.month}-${ssDate.day}`);
      return ssDate;
    });
    
    // THESE TESTS WILL FAIL - documenting the bug
    // S&S currently returns 2700/1/1 for ALL worldTime values
    
    // Test 1: Date should advance with worldTime
    expect(results[1].day).not.toBe(results[0].day); // One day later should be different day
    expect(results[2].day).not.toBe(results[0].day); // One week later should be different day  
    expect(results[3].month).not.toBe(results[0].month); // One month later should be different month
    expect(results[4].year).not.toBe(results[0].year); // One year later should be different year
    
    // Test 2: Epoch should be 2700 AR (this might pass)
    expect(results[0].year).toBe(2700);
    expect(results[0].month).toBe(1);
    expect(results[0].day).toBe(1);
    
    // Test 3: Time advancement should work (these will fail)
    expect(results[1]).not.toEqual(results[0]); // Different worldTime = different date
    expect(results[2]).not.toEqual(results[0]); // Different worldTime = different date
    expect(results[3]).not.toEqual(results[0]); // Different worldTime = different date
    expect(results[4]).not.toEqual(results[0]); // Different worldTime = different date
  });

  test('FAILING: Gregorian calendar also stuck at epoch - universal engine failure', () => {
    console.log('\n=== GREGORIAN CALENDAR ENGINE FAILURE TEST ===');
    
    // Test the same pattern with Gregorian calendar to prove universality
    const testCases = [
      { worldTime: 0, description: 'Epoch (worldTime = 0)' },
      { worldTime: 86400, description: 'One day later (86400 seconds)' },
      { worldTime: 86400 * 365, description: 'One year later' }
    ];
    
    const results = testCases.map(({ worldTime, description }) => {
      const ssDate = gregorianEngine.worldTimeToDate(worldTime);
      console.log(`${description}: worldTime=${worldTime} → S&S date=${ssDate.year}-${ssDate.month}-${ssDate.day}`);
      return ssDate;
    });
    
    // Test: Gregorian calendar should also be broken
    expect(results[1]).not.toEqual(results[0]); // Should advance, but won't
    expect(results[2]).not.toEqual(results[0]); // Should advance, but won't
    
    // Epoch should be year 0 for Gregorian
    expect(results[0].year).toBe(0);
    expect(results[0].month).toBe(1);
    expect(results[0].day).toBe(1);
  });
  
  test('FAILING: Calendar engine should calculate correct year progression', () => {
    // Test year progression specifically for Golarion
    const oneYearInSeconds = 365.25 * 24 * 60 * 60; // Including leap years
    
    const testYears = [
      { worldTime: 0, expectedYear: 2700 }, // Epoch
      { worldTime: oneYearInSeconds, expectedYear: 2701 }, // One year later
      { worldTime: oneYearInSeconds * 10, expectedYear: 2710 }, // Ten years later
      { worldTime: oneYearInSeconds * 100, expectedYear: 2800 }, // Century later
      { worldTime: oneYearInSeconds * 2025, expectedYear: 4725 } // Match PF2e test result
    ];
    
    testYears.forEach(({ worldTime, expectedYear }) => {
      const ssDate = golarionEngine.worldTimeToDate(worldTime);
      console.log(`WorldTime ${worldTime} (${Math.round(worldTime/oneYearInSeconds)} years): Expected ${expectedYear}, Got ${ssDate.year}`);
      
      // THIS WILL FAIL - S&S returns 2700 for all inputs
      expect(ssDate.year).toBe(expectedYear);
    });
  });
  
  test('FAILING: PF2e compatibility - S&S should match reasonable timeframes', () => {
    // Simulate the exact scenario from Phase 0 testing
    const worldTime = 0; // Fresh world
    
    // Calculate what a reasonable PF2e date might be
    // PF2e often uses dates around 4710-4720 AR for campaigns
    const reasonableGolarionYear = 4710; // From calendar definition
    
    // Calculate S&S date (this is broken)
    const ssDate = golarionEngine.worldTimeToDate(worldTime);
    
    console.log('Expected reasonable Golarion year:', reasonableGolarionYear);
    console.log('S&S calculated year:', ssDate.year);
    console.log('Year difference:', Math.abs(reasonableGolarionYear - ssDate.year));
    
    // THIS WILL FAIL - showing the massive year difference
    expect(Math.abs(reasonableGolarionYear - ssDate.year)).toBeLessThan(100); // Should be reasonable, not 2000+ years apart
    
    // For worldTime = 0, S&S should start at a reasonable Golarion date
    // Not stuck at the epoch year 2700
    expect(ssDate.year).toBeGreaterThan(4000); // Should be in reasonable Golarion timeframe
  });
  
  test('FAILING: Round-trip conversion should work (dateToWorldTime ↔ worldTimeToDate)', () => {
    // Test round-trip conversion with reasonable Golarion date
    const testDate = { year: 4725, month: 6, day: 7 }; // From Phase 0 PF2e result
    
    // Convert date to worldTime
    const calculatedWorldTime = golarionEngine.dateToWorldTime(testDate);
    console.log(`Date ${testDate.year}/${testDate.month}/${testDate.day} → WorldTime: ${calculatedWorldTime}`);
    
    // Convert back to date
    const reconvertedDate = golarionEngine.worldTimeToDate(calculatedWorldTime);
    console.log(`WorldTime ${calculatedWorldTime} → Date: ${reconvertedDate.year}/${reconvertedDate.month}/${reconvertedDate.day}`);
    
    // THIS WILL FAIL - S&S will return 2700/1/1 regardless of calculatedWorldTime
    expect(reconvertedDate.year).toBe(testDate.year);
    expect(reconvertedDate.month).toBe(testDate.month);
    expect(reconvertedDate.day).toBe(testDate.day);
  });

  test('DEBUG: Investigate daysToDate method behavior', () => {
    console.log('\n=== DEBUGGING daysToDate METHOD ===');
    
    // Test the internal daysToDate method with various day counts
    const testDays = [0, 1, 365, 365*10, 365*2025];
    
    testDays.forEach(days => {
      // @ts-ignore - accessing private method for debugging
      const result = golarionEngine.daysToDate(days);
      console.log(`Days ${days}: Year ${result.year}, Month ${result.month}, Day ${result.day}`);
    });
    
    // Check if daysToDate is working correctly
    // @ts-ignore - accessing private method for debugging
    const epochDate = golarionEngine.daysToDate(0);
    expect(epochDate.year).toBe(2700); // Should be epoch
    
    // @ts-ignore - accessing private method for debugging  
    const oneDayLater = golarionEngine.daysToDate(1);
    expect(oneDayLater.day).toBe(2); // Should advance by one day
    expect(oneDayLater.year).toBe(2700); // Should still be epoch year
    expect(oneDayLater.month).toBe(1); // Should still be first month
  });

  test('DEBUG: Check calendar epoch and currentYear values', () => {
    console.log('\n=== DEBUGGING CALENDAR CONFIGURATION ===');
    
    const calendar = golarionEngine.getCalendar();
    
    console.log('Calendar epoch:', calendar.year?.epoch);
    console.log('Calendar currentYear:', calendar.year?.currentYear);
    
    // Check if worldTimeToDate is using currentYear instead of epoch
    const epochResult = golarionEngine.worldTimeToDate(0);
    console.log('WorldTime 0 result:', epochResult);
    
    // Expected: Should use epoch (2700) + time calculation
    // Actual: Might be using currentYear or some other default
    
    // This test documents what S&S is actually doing wrong
    expect(epochResult.year).toBe(calendar.year?.epoch || 2700);
  });
});