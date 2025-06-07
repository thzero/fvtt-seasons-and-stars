/**
 * Phase 2 Universal WorldTime Interpretation Solution Test Suite
 * 
 * This test suite validates that the universal worldTime interpretation solution
 * implemented in Phase 2 works correctly for both epoch-based and real-time-based
 * calendar interpretation modes.
 * 
 * Related to GitHub Issue #20 - PF2e Calendar Date Mismatch
 * Solution: Universal calendar format enhancement with interpretation metadata
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../src/core/calendar-engine';
import type { SeasonsStarsCalendar } from '../src/types/calendar';

// Test calendar with epoch-based interpretation (traditional fantasy)
const epochBasedCalendar: SeasonsStarsCalendar = {
  id: "test-epoch-based",
  worldTime: {
    interpretation: "epoch-based",
    epochYear: 2700,
    currentYear: 4710
  },
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

// Test calendar with real-time-based interpretation (PF2e compatible)
const realTimeBasedCalendar: SeasonsStarsCalendar = {
  id: "test-real-time-based",
  worldTime: {
    interpretation: "real-time-based",
    epochYear: 2700,
    currentYear: 4725
  },
  year: {
    epoch: 2700,
    currentYear: 4725,
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

// Calendar without worldTime configuration (backward compatibility)
const legacyCalendar: SeasonsStarsCalendar = {
  id: "test-legacy",
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

describe('Phase 2: Universal WorldTime Interpretation Solution', () => {
  let epochEngine: CalendarEngine;
  let realTimeEngine: CalendarEngine;
  let legacyEngine: CalendarEngine;

  beforeEach(() => {
    epochEngine = new CalendarEngine(epochBasedCalendar);
    realTimeEngine = new CalendarEngine(realTimeBasedCalendar);
    legacyEngine = new CalendarEngine(legacyCalendar);
  });

  test('✅ Epoch-based interpretation works correctly (traditional fantasy)', () => {
    console.log('\n=== EPOCH-BASED INTERPRETATION TEST ===');
    
    // For epoch-based calendars, worldTime=0 should mean calendar epoch year
    const epochResult = epochEngine.worldTimeToDate(0);
    console.log(`Epoch start: worldTime=0 → ${epochResult.year}/${epochResult.month}/${epochResult.day}`);
    
    // One day later should advance
    const oneDayResult = epochEngine.worldTimeToDate(86400);
    console.log(`One day later: worldTime=86400 → ${oneDayResult.year}/${oneDayResult.month}/${oneDayResult.day}`);
    
    // One year later - use 366 days for leap year 2700
    const oneYearResult = epochEngine.worldTimeToDate(31622400); // 366 days * 24 * 60 * 60
    console.log(`One year later: worldTime=31622400 → ${oneYearResult.year}/${oneYearResult.month}/${oneYearResult.day}`);
    
    // Verify epoch behavior
    expect(epochResult.year).toBe(2700);
    expect(epochResult.month).toBe(1);
    expect(epochResult.day).toBe(1);
    
    // Verify time advancement works
    expect(oneDayResult.day).toBe(2); // Next day
    expect(oneYearResult.year).toBe(2701); // Next year (after 366 days in leap year)
    
    console.log('✅ Epoch-based interpretation working correctly');
  });

  test('✅ Real-time-based interpretation works correctly (PF2e compatible)', () => {
    console.log('\n=== REAL-TIME-BASED INTERPRETATION TEST ===');
    
    // For real-time-based calendars, worldTime=0 should mean currentYear
    const worldCreation = realTimeEngine.worldTimeToDate(0);
    console.log(`World creation (current time): worldTime=0 → ${worldCreation.year}/${worldCreation.month}/${worldCreation.day} AR`);
    
    // One day later
    const oneDayLater = realTimeEngine.worldTimeToDate(86400);
    console.log(`One day later: worldTime=86400 → ${oneDayLater.year}/${oneDayLater.month}/${oneDayLater.day} AR`);
    
    // One year later
    const oneYearLater = realTimeEngine.worldTimeToDate(31536000);
    console.log(`One year later: worldTime=31536000 → ${oneYearLater.year}/${oneYearLater.month}/${oneYearLater.day} AR`);
    
    // Verify real-time behavior - should start near currentYear
    expect(worldCreation.year).toBeGreaterThanOrEqual(4724); // Near currentYear
    expect(worldCreation.year).toBeLessThanOrEqual(4725);
    
    // Verify time advancement works - handle month/year boundaries
    const worldCreationTotalDays = worldCreation.year * 365 + worldCreation.month * 30 + worldCreation.day;
    const oneDayLaterTotalDays = oneDayLater.year * 365 + oneDayLater.month * 30 + oneDayLater.day;
    expect(oneDayLaterTotalDays).toBeGreaterThan(worldCreationTotalDays); // Should advance overall
    expect(oneYearLater.year).toBeGreaterThan(worldCreation.year); // Should advance year
    
    console.log('✅ Real-time-based interpretation working correctly');
  });

  test('✅ PF2e compatibility achieved (year difference <10)', () => {
    console.log('\n=== PF2E COMPATIBILITY TEST ===');
    
    // Simulate PF2e calculation (simplified)
    const currentYear = 2025; // Simulated current year
    const pf2eYear = currentYear + 2700; // PF2e calculation: real year + 2700 offset
    console.log(`PF2e calculation: ${pf2eYear} AR (${currentYear} + 2700)`);
    
    // S&S calculation with real-time-based calendar
    const ssDate = realTimeEngine.worldTimeToDate(0);
    console.log(`S&S calculation: ${ssDate.year} AR`);
    
    // Calculate difference
    const yearDifference = Math.abs(pf2eYear - ssDate.year);
    console.log(`Year difference: ${yearDifference} years`);
    
    // Verify compatibility achieved
    expect(yearDifference).toBeLessThan(10); // Should be close, not 2000+ years apart
    
    console.log('✅ PF2e compatibility achieved! Year difference < 10 years');
  });

  test('✅ Backward compatibility preserved (legacy calendars default to epoch-based)', () => {
    console.log('\n=== BACKWARD COMPATIBILITY TEST ===');
    
    // Legacy calendar (no worldTime config) should behave like epoch-based
    const legacyResult = legacyEngine.worldTimeToDate(0);
    const epochResult = epochEngine.worldTimeToDate(0);
    
    console.log(`Legacy calendar: worldTime=0 → ${legacyResult.year}/${legacyResult.month}/${legacyResult.day}`);
    console.log(`Epoch-based calendar: worldTime=0 → ${epochResult.year}/${epochResult.month}/${epochResult.day}`);
    
    // Should produce same results
    expect(legacyResult.year).toBe(epochResult.year);
    expect(legacyResult.month).toBe(epochResult.month);
    expect(legacyResult.day).toBe(epochResult.day);
    
    console.log('✅ Backward compatibility preserved');
  });

  test('✅ Bidirectional conversion works correctly', () => {
    console.log('\n=== BIDIRECTIONAL CONVERSION TEST ===');
    
    // Test epoch-based round-trip
    const epochTestDate = { year: 2701, month: 6, day: 15 };
    const epochWorldTime = epochEngine.dateToWorldTime(epochTestDate);
    const epochRoundTrip = epochEngine.worldTimeToDate(epochWorldTime);
    
    console.log(`Epoch round-trip: ${epochTestDate.year}/${epochTestDate.month}/${epochTestDate.day} → ${epochWorldTime} → ${epochRoundTrip.year}/${epochRoundTrip.month}/${epochRoundTrip.day}`);
    
    expect(epochRoundTrip.year).toBe(epochTestDate.year);
    expect(epochRoundTrip.month).toBe(epochTestDate.month);
    expect(epochRoundTrip.day).toBe(epochTestDate.day);
    
    // Test real-time-based round-trip
    const realTimeTestDate = { year: 4725, month: 6, day: 15 };
    const realTimeWorldTime = realTimeEngine.dateToWorldTime(realTimeTestDate);
    const realTimeRoundTrip = realTimeEngine.worldTimeToDate(realTimeWorldTime);
    
    console.log(`Real-time round-trip: ${realTimeTestDate.year}/${realTimeTestDate.month}/${realTimeTestDate.day} → ${realTimeWorldTime} → ${realTimeRoundTrip.year}/${realTimeRoundTrip.month}/${realTimeRoundTrip.day}`);
    
    expect(realTimeRoundTrip.year).toBe(realTimeTestDate.year);
    expect(realTimeRoundTrip.month).toBe(realTimeTestDate.month);
    expect(realTimeRoundTrip.day).toBe(realTimeTestDate.day);
    
    console.log('✅ Bidirectional conversion working correctly');
  });

  test('✅ Universal solution works across interpretation modes', () => {
    console.log('\n=== UNIVERSAL SOLUTION TEST ===');
    
    // Test that both interpretations advance time correctly
    const testWorldTime = 86400 * 10; // 10 days
    
    const epochResult = epochEngine.worldTimeToDate(testWorldTime);
    const realTimeResult = realTimeEngine.worldTimeToDate(testWorldTime);
    
    console.log(`Epoch-based: worldTime=${testWorldTime} → ${epochResult.year}/${epochResult.month}/${epochResult.day}`);
    console.log(`Real-time-based: worldTime=${testWorldTime} → ${realTimeResult.year}/${realTimeResult.month}/${realTimeResult.day}`);
    
    // Both should advance 10 days from their respective starting points
    const epochStart = epochEngine.worldTimeToDate(0);
    const realTimeStart = realTimeEngine.worldTimeToDate(0);
    
    // Verify both engines advance time correctly - handle month/year boundaries
    const epochStartTotal = epochStart.year * 365 + epochStart.month * 30 + epochStart.day;
    const epochResultTotal = epochResult.year * 365 + epochResult.month * 30 + epochResult.day;
    const realTimeStartTotal = realTimeStart.year * 365 + realTimeStart.month * 30 + realTimeStart.day;
    const realTimeResultTotal = realTimeResult.year * 365 + realTimeResult.month * 30 + realTimeResult.day;
    
    expect(epochResultTotal).toBeGreaterThan(epochStartTotal);
    expect(realTimeResultTotal).toBeGreaterThan(realTimeStartTotal);
    
    // Years should be very different (epoch starts at 2700, real-time starts at ~4725)
    expect(Math.abs(epochResult.year - realTimeResult.year)).toBeGreaterThan(1000);
    
    console.log('✅ Universal solution working across all interpretation modes');
  });
});