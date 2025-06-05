/**
 * Core calendar calculation engine for Seasons & Stars
 */

import type { 
  SeasonsStarsCalendar, 
  CalendarDate, 
  CalendarCalculation,
  CalendarIntercalary 
} from '../types/calendar';

export class CalendarEngine {
  private calendar: SeasonsStarsCalendar;
  private calculationCache: Map<string, CalendarCalculation> = new Map();

  constructor(calendar: SeasonsStarsCalendar) {
    this.calendar = calendar;
    this.precomputeYearData();
  }

  /**
   * Convert Foundry world time (seconds) to calendar date
   */
  worldTimeToDate(worldTime: number): CalendarDate {
    const totalSeconds = Math.floor(worldTime);
    const secondsPerDay = this.calendar.time.hoursInDay * 
                         this.calendar.time.minutesInHour * 
                         this.calendar.time.secondsInMinute;
    
    const totalDays = Math.floor(totalSeconds / secondsPerDay);
    const secondsInDay = totalSeconds % secondsPerDay;
    
    // Calculate time of day
    const secondsPerHour = this.calendar.time.minutesInHour * this.calendar.time.secondsInMinute;
    const hour = Math.floor(secondsInDay / secondsPerHour);
    const minute = Math.floor((secondsInDay % secondsPerHour) / this.calendar.time.secondsInMinute);
    const second = secondsInDay % this.calendar.time.secondsInMinute;
    
    // Convert days to calendar date
    const dateInfo = this.daysToDate(totalDays);
    
    return {
      year: dateInfo.year,
      month: dateInfo.month,
      day: dateInfo.day,
      weekday: dateInfo.weekday,
      intercalary: dateInfo.intercalary,
      time: { hour, minute, second }
    };
  }

  /**
   * Convert calendar date to Foundry world time (seconds)
   */
  dateToWorldTime(date: CalendarDate): number {
    const totalDays = this.dateToDays(date);
    const secondsPerDay = this.calendar.time.hoursInDay * 
                         this.calendar.time.minutesInHour * 
                         this.calendar.time.secondsInMinute;
    
    let totalSeconds = totalDays * secondsPerDay;
    
    // Add time of day if provided
    if (date.time) {
      const secondsPerHour = this.calendar.time.minutesInHour * this.calendar.time.secondsInMinute;
      totalSeconds += date.time.hour * secondsPerHour;
      totalSeconds += date.time.minute * this.calendar.time.secondsInMinute;
      totalSeconds += date.time.second;
    }
    
    return totalSeconds;
  }

  /**
   * Add days to a calendar date
   */
  addDays(date: CalendarDate, days: number): CalendarDate {
    const totalDays = this.dateToDays(date) + days;
    const newDate = this.daysToDate(totalDays);
    
    // Preserve time if it exists
    if (date.time) {
      newDate.time = { ...date.time };
    }
    
    return newDate;
  }

  /**
   * Add months to a calendar date
   */
  addMonths(date: CalendarDate, months: number): CalendarDate {
    let targetYear = date.year;
    let targetMonth = date.month + months;
    
    // Handle month overflow/underflow
    while (targetMonth > this.calendar.months.length) {
      targetMonth -= this.calendar.months.length;
      targetYear++;
    }
    while (targetMonth < 1) {
      targetMonth += this.calendar.months.length;
      targetYear--;
    }
    
    // Adjust day if target month is shorter
    const targetMonthDays = this.getMonthLength(targetMonth, targetYear);
    const targetDay = Math.min(date.day, targetMonthDays);
    
    return {
      year: targetYear,
      month: targetMonth,
      day: targetDay,
      weekday: this.calculateWeekday(targetYear, targetMonth, targetDay),
      time: date.time ? { ...date.time } : undefined
    };
  }

  /**
   * Add years to a calendar date
   */
  addYears(date: CalendarDate, years: number): CalendarDate {
    const targetYear = date.year + years;
    
    // Handle leap year day adjustments
    const targetMonthDays = this.getMonthLength(date.month, targetYear);
    const targetDay = Math.min(date.day, targetMonthDays);
    
    return {
      year: targetYear,
      month: date.month,
      day: targetDay,
      weekday: this.calculateWeekday(targetYear, date.month, targetDay),
      time: date.time ? { ...date.time } : undefined
    };
  }

  /**
   * Add hours to a calendar date
   */
  addHours(date: CalendarDate, hours: number): CalendarDate {
    const currentTime = date.time || { hour: 0, minute: 0, second: 0 };
    const totalHours = currentTime.hour + hours;
    
    const hoursPerDay = this.calendar.time.hoursInDay;
    let extraDays = Math.floor(totalHours / hoursPerDay);
    let newHour = totalHours % hoursPerDay;
    
    // Handle negative hours
    if (newHour < 0) {
      newHour += hoursPerDay;
      extraDays -= 1;
    }
    
    let result: CalendarDate = {
      ...date,
      time: {
        hour: newHour,
        minute: currentTime.minute,
        second: currentTime.second
      }
    };
    
    // Add extra days if needed
    if (extraDays !== 0) {
      result = this.addDays(result, extraDays);
    }
    
    return result;
  }

  /**
   * Add minutes to a calendar date
   */
  addMinutes(date: CalendarDate, minutes: number): CalendarDate {
    const currentTime = date.time || { hour: 0, minute: 0, second: 0 };
    const totalMinutes = currentTime.minute + minutes;
    
    const minutesPerHour = this.calendar.time.minutesInHour;
    let extraHours = Math.floor(totalMinutes / minutesPerHour);
    let newMinute = totalMinutes % minutesPerHour;
    
    // Handle negative minutes
    if (newMinute < 0) {
      newMinute += minutesPerHour;
      extraHours -= 1;
    }
    
    let result: CalendarDate = {
      ...date,
      time: {
        hour: currentTime.hour,
        minute: newMinute,
        second: currentTime.second
      }
    };
    
    // Add extra hours if needed
    if (extraHours !== 0) {
      result = this.addHours(result, extraHours);
    }
    
    return result;
  }

  /**
   * Convert days since epoch to calendar date
   */
  private daysToDate(totalDays: number): CalendarDate {
    let year = this.calendar.year.epoch;
    let remainingDays = totalDays;
    
    // Find the correct year
    while (remainingDays >= this.getYearLength(year)) {
      remainingDays -= this.getYearLength(year);
      year++;
    }
    
    // Handle negative days (before epoch)
    while (remainingDays < 0) {
      year--;
      remainingDays += this.getYearLength(year);
    }
    
    // Find month and day within the year
    let month = 1;
    const monthLengths = this.getMonthLengths(year);
    const intercalaryDays = this.getIntercalaryDays(year);
    
    for (month = 1; month <= this.calendar.months.length; month++) {
      const monthLength = monthLengths[month - 1];
      
      if (remainingDays < monthLength) {
        break;
      }
      
      remainingDays -= monthLength;
      
      // Check for intercalary days after this month
      const intercalaryAfterMonth = intercalaryDays.filter(i => 
        i.after === this.calendar.months[month - 1].name
      );
      
      for (const intercalary of intercalaryAfterMonth) {
        const intercalaryDayCount = intercalary.days || 1;
        
        if (remainingDays < intercalaryDayCount) {
          // We're within this intercalary period
          return {
            year,
            month,
            day: this.calendar.months[month - 1].days + remainingDays + 1,
            weekday: this.calculateWeekday(year, month, this.calendar.months[month - 1].days + remainingDays + 1),
            intercalary: intercalary.name
          };
        }
        
        remainingDays -= intercalaryDayCount;
      }
    }
    
    const day = remainingDays + 1;
    
    return {
      year,
      month,
      day,
      weekday: this.calculateWeekday(year, month, day)
    };
  }

  /**
   * Convert calendar date to days since epoch
   */
  private dateToDays(date: CalendarDate): number {
    let totalDays = 0;
    
    // Handle years before or after epoch
    if (date.year >= this.calendar.year.epoch) {
      // Add days for complete years after epoch
      for (let year = this.calendar.year.epoch; year < date.year; year++) {
        totalDays += this.getYearLength(year);
      }
    } else {
      // Subtract days for complete years before epoch
      for (let year = date.year; year < this.calendar.year.epoch; year++) {
        totalDays -= this.getYearLength(year);
      }
    }
    
    // Add days for complete months in the target year
    const monthLengths = this.getMonthLengths(date.year);
    const intercalaryDays = this.getIntercalaryDays(date.year);
    
    for (let month = 1; month < date.month; month++) {
      totalDays += monthLengths[month - 1];
      
      // Add intercalary days after this month
      const intercalaryAfterMonth = intercalaryDays.filter(i => 
        i.after === this.calendar.months[month - 1].name
      );
      // Sum up all days from intercalary periods (using days field, defaulting to 1)
      totalDays += intercalaryAfterMonth.reduce((sum, intercalary) => {
        return sum + (intercalary.days || 1);
      }, 0);
    }
    
    // Add days in the target month
    totalDays += date.day - 1;
    
    // Handle intercalary days
    if (date.intercalary) {
      totalDays += 1; // Intercalary day comes after the regular month
    }
    
    return totalDays;
  }

  /**
   * Calculate weekday for a given date
   */
  calculateWeekday(year: number, month: number, day: number): number {
    const totalDays = this.dateToDays({ year, month, day, weekday: 0 });
    const weekdayCount = this.calendar.weekdays.length;
    const startDay = this.calendar.year.startDay;
    
    return (totalDays + startDay) % weekdayCount;
  }

  /**
   * Get the length of a specific year in days
   */
  private getYearLength(year: number): number {
    const monthLengths = this.getMonthLengths(year);
    const baseLength = monthLengths.reduce((sum, length) => sum + length, 0);
    const intercalaryDays = this.getIntercalaryDays(year);
    
    // Sum up all intercalary days, using the days field (defaulting to 1 for backward compatibility)
    const totalIntercalaryDays = intercalaryDays.reduce((sum, intercalary) => {
      return sum + (intercalary.days || 1);
    }, 0);
    
    return baseLength + totalIntercalaryDays;
  }

  /**
   * Get month lengths for a specific year (accounting for leap years)
   */
  private getMonthLengths(year: number): number[] {
    const monthLengths = this.calendar.months.map(month => month.days);
    
    // Add leap year days if applicable
    if (this.isLeapYear(year) && this.calendar.leapYear.month) {
      const leapMonthIndex = this.calendar.months.findIndex(
        month => month.name === this.calendar.leapYear.month
      );
      
      if (leapMonthIndex >= 0) {
        monthLengths[leapMonthIndex] += this.calendar.leapYear.extraDays || 1;
      }
    }
    
    return monthLengths;
  }

  /**
   * Get length of a specific month in a specific year
   */
  getMonthLength(month: number, year: number): number {
    const monthLengths = this.getMonthLengths(year);
    return monthLengths[month - 1] || 0;
  }

  /**
   * Get intercalary days for a specific year
   */
  private getIntercalaryDays(year: number): CalendarIntercalary[] {
    return this.calendar.intercalary.filter(intercalary => {
      if (intercalary.leapYearOnly) {
        return this.isLeapYear(year);
      }
      return true;
    });
  }

  /**
   * Check if a year is a leap year
   */
  private isLeapYear(year: number): boolean {
    const { rule, interval } = this.calendar.leapYear;
    
    switch (rule) {
      case 'none':
        return false;
        
      case 'gregorian':
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
      case 'custom':
        return interval ? year % interval === 0 : false;
        
      default:
        return false;
    }
  }

  /**
   * Precompute year data for performance
   */
  private precomputeYearData(): void {
    const currentYear = this.calendar.year.currentYear;
    
    // Cache calculations for nearby years
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      const cacheKey = `year-${year}`;
      
      if (!this.calculationCache.has(cacheKey)) {
        const calculation: CalendarCalculation = {
          totalDays: this.getYearLength(year),
          weekdayIndex: 0, // Will be calculated when needed
          yearLength: this.getYearLength(year),
          monthLengths: this.getMonthLengths(year),
          intercalaryDays: this.getIntercalaryDays(year)
        };
        
        this.calculationCache.set(cacheKey, calculation);
      }
    }
  }

  /**
   * Update the calendar configuration
   */
  updateCalendar(calendar: SeasonsStarsCalendar): void {
    this.calendar = calendar;
    this.calculationCache.clear();
    this.precomputeYearData();
  }

  /**
   * Get the current calendar configuration
   */
  getCalendar(): SeasonsStarsCalendar {
    return { ...this.calendar };
  }
}