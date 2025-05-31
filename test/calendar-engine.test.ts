/**
 * Tests for CalendarEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarEngine } from '../src/core/calendar-engine';
import { CalendarValidator } from '../src/core/calendar-validator';
import type { SeasonsStarsCalendar } from '../src/types/calendar';

// Mock Gregorian calendar for testing
const gregorianCalendar: SeasonsStarsCalendar = {
  id: 'test-gregorian',
  translations: {
    en: {
      label: 'Test Gregorian',
      description: 'Test calendar',
      setting: 'Test'
    }
  },
  year: {
    epoch: 2024,
    currentYear: 2024,
    prefix: '',
    suffix: ' CE',
    startDay: 1 // Monday
  },
  leapYear: {
    rule: 'gregorian',
    month: 'February',
    extraDays: 1
  },
  months: [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 }
  ],
  weekdays: [
    { name: 'Sunday' },
    { name: 'Monday' },
    { name: 'Tuesday' },
    { name: 'Wednesday' },
    { name: 'Thursday' },
    { name: 'Friday' },
    { name: 'Saturday' }
  ],
  intercalary: [],
  time: {
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60
  }
};

// Simple test calendar
const simpleCalendar: SeasonsStarsCalendar = {
  id: 'test-simple',
  translations: {
    en: {
      label: 'Test Simple',
      description: 'Simple test calendar',
      setting: 'Test'
    }
  },
  year: {
    epoch: 0,
    currentYear: 1,
    prefix: '',
    suffix: '',
    startDay: 0
  },
  leapYear: {
    rule: 'none'
  },
  months: [
    { name: 'Month1', days: 30 },
    { name: 'Month2', days: 30 }
  ],
  weekdays: [
    { name: 'Day1' },
    { name: 'Day2' },
    { name: 'Day3' }
  ],
  intercalary: [],
  time: {
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60
  }
};

describe('CalendarValidator', () => {
  it('should validate gregorian calendar', () => {
    const result = CalendarValidator.validate(gregorianCalendar);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate simple calendar', () => {
    const result = CalendarValidator.validate(simpleCalendar);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid calendar', () => {
    const invalid = { id: 'test' }; // Missing required fields
    const result = CalendarValidator.validate(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('CalendarEngine - Basic Operations', () => {
  let engine: CalendarEngine;

  beforeEach(() => {
    engine = new CalendarEngine(simpleCalendar);
  });

  it('should create engine with calendar', () => {
    expect(engine).toBeDefined();
    expect(engine.getCalendar().id).toBe('test-simple');
  });

  it('should convert world time to date', () => {
    // Test epoch (time 0)
    const date = engine.worldTimeToDate(0);
    expect(date.year).toBe(0); // epoch is 0
    expect(date.month).toBe(1); // 1-based months
    expect(date.day).toBe(1);   // 1-based days
    expect(date.weekday).toBe(0); // startDay is 0
  });

  it('should convert date to world time', () => {
    const date = {
      year: 0, // Use epoch year
      month: 1,
      day: 1,
      weekday: 0
    };
    
    const worldTime = engine.dateToWorldTime(date);
    expect(worldTime).toBe(0); // Should be epoch
  });

  it('should add days correctly', () => {
    const startDate = {
      year: 1,
      month: 1,
      day: 1,
      weekday: 0
    };

    const newDate = engine.addDays(startDate, 5);
    expect(newDate.year).toBe(1);
    expect(newDate.month).toBe(1);
    expect(newDate.day).toBe(6);
    expect(newDate.weekday).toBe(2); // (0 + 5) % 3 = 2
  });

  it('should handle month overflow when adding days', () => {
    const startDate = {
      year: 1,
      month: 1,
      day: 25,
      weekday: 0
    };

    const newDate = engine.addDays(startDate, 10); // Should go into next month
    expect(newDate.year).toBe(1);
    expect(newDate.month).toBe(2);
    expect(newDate.day).toBe(5); // 25 + 10 - 30 = 5
  });

  it('should handle year overflow when adding days', () => {
    const startDate = {
      year: 1,
      month: 2,
      day: 25,
      weekday: 0
    };

    const newDate = engine.addDays(startDate, 10); // Should go into next year
    expect(newDate.year).toBe(2);
    expect(newDate.month).toBe(1);
    expect(newDate.day).toBe(5); // 25 + 10 - 30 = 5
  });

  it('should add months correctly', () => {
    const startDate = {
      year: 1,
      month: 1,
      day: 15,
      weekday: 0
    };

    const newDate = engine.addMonths(startDate, 1);
    expect(newDate.year).toBe(1);
    expect(newDate.month).toBe(2);
    expect(newDate.day).toBe(15);
  });

  it('should add years correctly', () => {
    const startDate = {
      year: 1,
      month: 1,
      day: 15,
      weekday: 0
    };

    const newDate = engine.addYears(startDate, 1);
    expect(newDate.year).toBe(2);
    expect(newDate.month).toBe(1);
    expect(newDate.day).toBe(15);
  });
});

describe('CalendarEngine - Gregorian Calendar', () => {
  let engine: CalendarEngine;

  beforeEach(() => {
    engine = new CalendarEngine(gregorianCalendar);
  });

  it('should handle leap years correctly', () => {
    // Test leap year date
    const leapYearDate = {
      year: 2024, // 2024 is a leap year
      month: 2,   // February
      day: 29,    // 29th day
      weekday: 0
    };

    const worldTime = engine.dateToWorldTime(leapYearDate);
    const convertedBack = engine.worldTimeToDate(worldTime);
    
    expect(convertedBack.year).toBe(2024);
    expect(convertedBack.month).toBe(2);
    expect(convertedBack.day).toBe(29);
  });

  it('should handle non-leap years correctly', () => {
    // Test that February 29 doesn't exist in non-leap years
    const nonLeapYearDate = {
      year: 2023, // 2023 is not a leap year
      month: 3,   // March
      day: 1,     // 1st day
      weekday: 0
    };

    const worldTime = engine.dateToWorldTime(nonLeapYearDate);
    const convertedBack = engine.worldTimeToDate(worldTime);
    
    expect(convertedBack.year).toBe(2023);
    expect(convertedBack.month).toBe(3);
    expect(convertedBack.day).toBe(1);
  });

  it('should roundtrip dates correctly', () => {
    const testDates = [
      { year: 2024, month: 1, day: 1, weekday: 0 },    // New Year
      { year: 2024, month: 2, day: 29, weekday: 0 },   // Leap day
      { year: 2024, month: 12, day: 31, weekday: 0 },  // End of year
      { year: 2025, month: 6, day: 15, weekday: 0 }    // Mid-year
    ];

    for (const date of testDates) {
      const worldTime = engine.dateToWorldTime(date);
      const converted = engine.worldTimeToDate(worldTime);
      
      expect(converted.year).toBe(date.year);
      expect(converted.month).toBe(date.month);
      expect(converted.day).toBe(date.day);
    }
  });
});