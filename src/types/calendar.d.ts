/**
 * Seasons & Stars Calendar Type Definitions
 */

export interface SeasonsStarsCalendar {
  id: string;
  translations: {
    [languageCode: string]: {
      label: string;
      description?: string;
      setting?: string;
    };
  };
  
  year: {
    epoch: number;
    currentYear: number;
    prefix: string;
    suffix: string;
    startDay: number;
  };
  
  leapYear: {
    rule: 'none' | 'gregorian' | 'custom';
    interval?: number;
    month?: string;
    extraDays?: number;
  };
  
  months: CalendarMonth[];
  weekdays: CalendarWeekday[];
  intercalary: CalendarIntercalary[];
  
  time: {
    hoursInDay: number;
    minutesInHour: number;
    secondsInMinute: number;
  };
}

export interface CalendarMonth {
  name: string;
  abbreviation?: string;
  days: number;
  description?: string;
  translations?: {
    [languageCode: string]: {
      description?: string;
    };
  };
}

export interface CalendarWeekday {
  name: string;
  abbreviation?: string;
  description?: string;
  translations?: {
    [languageCode: string]: {
      description?: string;
    };
  };
}

export interface CalendarIntercalary {
  name: string;
  after: string;
  leapYearOnly: boolean;
  countsForWeekdays: boolean;
  description?: string;
  translations?: {
    [languageCode: string]: {
      description?: string;
    };
  };
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  weekday: number;
  intercalary?: string;
  time?: {
    hour: number;
    minute: number;
    second: number;
  };
}

export interface CalendarCalculation {
  totalDays: number;
  weekdayIndex: number;
  yearLength: number;
  monthLengths: number[];
  intercalaryDays: CalendarIntercalary[];
}

export interface DateFormatOptions {
  includeTime?: boolean;
  includeWeekday?: boolean;
  includeYear?: boolean;
  format?: 'short' | 'long' | 'numeric';
}