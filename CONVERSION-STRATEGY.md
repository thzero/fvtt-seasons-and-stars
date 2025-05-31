# Simple Calendar to Seasons & Stars Conversion Strategy

> **Technical strategy for converting Simple Calendar format to S&S format**

This document outlines the conversion process for migrating Simple Calendar JSON definitions to the cleaner Seasons & Stars format.

## Conversion Overview

### Goals
- Convert all Simple Calendar preset calendars to S&S format
- Preserve calendar accuracy and behavior
- Enhance with cultural descriptions and context
- Maintain compatibility with existing date references

### Approach
1. **Automated conversion**: Script to handle bulk transformation
2. **Manual enhancement**: Add descriptions and cultural context
3. **Validation**: Verify date calculations match original
4. **Testing**: Cross-check against known calendar dates

## Field Mapping Reference

### Direct Mappings
| Simple Calendar Path | S&S Path | Notes |
|---------------------|----------|-------|
| `calendar.months[].name` | `months[].name` | Direct copy |
| `calendar.months[].numberOfDays` | `months[].days` | Direct copy |
| `calendar.months[].abbreviation` | `months[].abbreviation` | Direct copy |
| `calendar.weekdays[].name` | `weekdays[].name` | Direct copy |
| `calendar.weekdays[].abbreviation` | `weekdays[].abbreviation` | Direct copy |
| `calendar.year.numericRepresentation` | `year.currentYear` | Direct copy |
| `calendar.year.prefix` | `year.prefix` | Direct copy |
| `calendar.year.postfix` | `year.suffix` | Direct copy |
| `calendar.year.yearZero` | `year.epoch` | Direct copy |
| `calendar.year.firstWeekday` | `year.startDay` | Direct copy |

### Leap Year Conversion
| Simple Calendar Rule | S&S Rule | Conversion Logic |
|---------------------|----------|------------------|
| `"gregorian"` | `"gregorian"` | Direct mapping |
| `"none"` | `"none"` | Direct mapping |
| `"custom"` with `customMod: N` | `"custom"` with `interval: N` | Copy mod value to interval |

### Complex Conversions

#### Intercalary Days
Simple Calendar stores intercalary days as special months within the months array:

**Simple Calendar Format:**
```json
{
  "months": [
    {"name": "Hammer", "numberOfDays": 30, "intercalary": false},
    {"name": "Midwinter", "numberOfDays": 1, "intercalary": true, "intercalaryInclude": false},
    {"name": "Alturiak", "numberOfDays": 30, "intercalary": false}
  ]
}
```

**S&S Format:**
```json
{
  "months": [
    {"name": "Hammer", "days": 30},
    {"name": "Alturiak", "days": 30}
  ],
  "intercalary": [
    {"name": "Midwinter", "after": "Hammer", "countsForWeekdays": false}
  ]
}
```

**Conversion Logic:**
1. Extract months where `intercalary: true`
2. Determine which month they come after based on array position
3. Map `intercalaryInclude` to `countsForWeekdays`
4. Move to separate `intercalary` array

## Conversion Script Structure

```typescript
interface SimpleCalendarData {
  calendar: {
    months: Array<{
      name: string;
      abbreviation?: string;
      numberOfDays: number;
      numberOfLeapYearDays: number;
      intercalary: boolean;
      intercalaryInclude: boolean;
    }>;
    weekdays: Array<{
      name: string;
      abbreviation: string;
    }>;
    year: {
      numericRepresentation: number;
      prefix: string;
      postfix: string;
      yearZero: number;
      firstWeekday: number;
    };
    leapYear: {
      rule: string;
      customMod: number;
    };
    time: {
      hoursInDay: number;
      minutesInHour: number;
      secondsInMinute: number;
    };
  };
}

interface SeasonsStarsCalendar {
  id: string;
  label: string;
  description?: string;
  setting?: string;
  year: {
    epoch: number;
    currentYear: number;
    prefix: string;
    suffix: string;
    startDay: number;
  };
  leapYear: {
    rule: string;
    interval?: number;
    month?: string;
    extraDays?: number;
  };
  months: Array<{
    name: string;
    abbreviation?: string;
    days: number;
    description?: string;
  }>;
  weekdays: Array<{
    name: string;
    abbreviation?: string;
    description?: string;
  }>;
  intercalary: Array<{
    name: string;
    after: string;
    leapYearOnly: boolean;
    countsForWeekdays: boolean;
    description?: string;
  }>;
  time: {
    hoursInDay: number;
    minutesInHour: number;
    secondsInMinute: number;
  };
}

function convertSimpleCalendarToSS(
  scData: SimpleCalendarData,
  metadata: {
    id: string;
    label: string;
    description?: string;
    setting?: string;
  }
): SeasonsStarsCalendar {
  const { calendar } = scData;
  
  // Extract regular months and intercalary days
  const regularMonths = calendar.months.filter(m => !m.intercalary);
  const intercalaryMonths = calendar.months.filter(m => m.intercalary);
  
  // Convert intercalary days
  const intercalary = intercalaryMonths.map((im, index) => {
    // Find the previous regular month
    const position = calendar.months.indexOf(im);
    const previousMonth = calendar.months
      .slice(0, position)
      .reverse()
      .find(m => !m.intercalary);
    
    return {
      name: im.name,
      after: previousMonth?.name || regularMonths[regularMonths.length - 1].name,
      leapYearOnly: im.numberOfDays === 0 && im.numberOfLeapYearDays > 0,
      countsForWeekdays: im.intercalaryInclude,
      description: getIntercalaryDescription(im.name, metadata.setting)
    };
  });
  
  // Convert leap year rules
  const leapYear = convertLeapYearRules(calendar.leapYear, regularMonths);
  
  return {
    id: metadata.id,
    label: metadata.label,
    description: metadata.description,
    setting: metadata.setting,
    
    year: {
      epoch: calendar.year.yearZero,
      currentYear: calendar.year.numericRepresentation,
      prefix: calendar.year.prefix,
      suffix: calendar.year.postfix,
      startDay: calendar.year.firstWeekday
    },
    
    leapYear,
    
    months: regularMonths.map(m => ({
      name: m.name,
      abbreviation: m.abbreviation,
      days: m.numberOfDays,
      description: getMonthDescription(m.name, metadata.setting)
    })),
    
    weekdays: calendar.weekdays.map(w => ({
      name: w.name,
      abbreviation: w.abbreviation,
      description: getWeekdayDescription(w.name, metadata.setting)
    })),
    
    intercalary,
    
    time: {
      hoursInDay: calendar.time.hoursInDay,
      minutesInHour: calendar.time.minutesInHour,
      secondsInMinute: calendar.time.secondsInMinute
    }
  };
}

function convertLeapYearRules(
  scLeapYear: { rule: string; customMod: number },
  months: Array<{ name: string; numberOfDays: number; numberOfLeapYearDays: number }>
): { rule: string; interval?: number; month?: string; extraDays?: number } {
  const { rule, customMod } = scLeapYear;
  
  if (rule === "none") {
    return { rule: "none" };
  }
  
  if (rule === "gregorian") {
    return {
      rule: "gregorian",
      month: "February", // Standard Gregorian leap month
      extraDays: 1
    };
  }
  
  if (rule === "custom") {
    // Find which month has different leap year days
    const leapMonth = months.find(m => m.numberOfDays !== m.numberOfLeapYearDays);
    
    return {
      rule: "custom",
      interval: customMod,
      month: leapMonth?.name,
      extraDays: leapMonth ? leapMonth.numberOfLeapYearDays - leapMonth.numberOfDays : 1
    };
  }
  
  return { rule: "none" };
}
```

## Enhancement Strategy

### Adding Cultural Context

After automated conversion, manually enhance calendars with:

#### Month Descriptions
```typescript
const monthDescriptions = {
  // Gregorian
  "January": "The coldest month of winter in the northern hemisphere",
  "February": "The shortest month, known for love and renewal",
  
  // Harptos (Forgotten Realms)
  "Hammer": "The coldest month of winter, named for the sound of ice cracking",
  "Alturiak": "The month of winter's end, when storms rage fiercely",
  
  // Golarion (Pathfinder)
  "Abadius": "Named after Abadar, god of cities and wealth",
  "Calistril": "Named after Calistria, goddess of trickery and lust"
};
```

#### Weekday Descriptions  
```typescript
const weekdayDescriptions = {
  // Standard
  "Sunday": "Day of rest and worship in many cultures",
  "Monday": "Beginning of the work week",
  
  // Fantasy
  "Brightday": "Auspicious day for new beginnings and important endeavors",
  "Bitterday": "Day of ill omens when wise folk avoid taking risks"
};
```

#### Intercalary Day Descriptions
```typescript
const intercalaryDescriptions = {
  "Midwinter": "Festival marking the deepest cold of winter",
  "Greengrass": "Celebration of spring's arrival and new growth",
  "Shieldmeet": "Quadrennial festival of great celebration and unity"
};
```

## Validation Process

### Date Calculation Verification
```typescript
function validateConversion(
  originalSC: SimpleCalendarData,
  convertedSS: SeasonsStarsCalendar
): ValidationResult {
  const testDates = [
    { year: 1400, month: 1, day: 1 },    // Start of calendar
    { year: 1400, month: 12, day: 31 },  // End of year
    { year: 1404, month: 2, day: 29 },   // Leap year test
    { year: 1405, month: 2, day: 28 }    // Non-leap year test
  ];
  
  const results = testDates.map(date => {
    const scWeekday = calculateWeekdaySimpleCalendar(originalSC, date);
    const ssWeekday = calculateWeekdaySeasonsStars(convertedSS, date);
    
    return {
      date,
      scWeekday,
      ssWeekday,
      matches: scWeekday === ssWeekday
    };
  });
  
  return {
    allMatch: results.every(r => r.matches),
    results
  };
}
```

### Cross-Reference Validation
```typescript
function validateAgainstKnownDates(calendar: SeasonsStarsCalendar): ValidationResult {
  const knownDates = {
    "gregorian": [
      { date: "2000-01-01", weekday: "Saturday" },
      { date: "2024-02-29", weekday: "Thursday" }, // Leap year
    ],
    "harptos": [
      { date: "1495-01-01", weekday: "1st" },       // Campaign start
      { date: "1495-06-20", weekday: "5th" }       // Midsummer
    ]
  };
  
  // Validate against known historical dates
  return validateDates(calendar, knownDates[calendar.id] || []);
}
```

## Conversion Pipeline

### Batch Conversion Process
1. **Load Simple Calendar presets** from `predefined-calendars/` directory
2. **Apply metadata** for each calendar (setting, descriptions)
3. **Run conversion script** to generate S&S format
4. **Manual enhancement** for cultural context
5. **Validation testing** against known dates
6. **Quality review** for consistency and completeness

### Calendar Priority List
**High Priority (Core RPG calendars):**
- Gregorian (Earth standard)
- Harptos (D&D Forgotten Realms)
- Golarion PF2e (Pathfinder)
- Exandrian (Critical Role)

**Medium Priority (Popular settings):**
- Eberron (D&D)
- Greyhawk (D&D)
- Warhammer Fantasy
- Forbidden Lands

**Low Priority (Niche systems):**
- Dark Sun
- Exalted
- Traveller
- DSA/TDE5e
- Symbaroum

## Testing Strategy

### Automated Tests
```typescript
describe("Simple Calendar Conversion", () => {
  test("converts Gregorian calendar correctly", () => {
    const sc = loadSimpleCalendar("gregorian");
    const ss = convertSimpleCalendarToSS(sc, gregorianMetadata);
    
    expect(ss.months).toHaveLength(12);
    expect(ss.weekdays).toHaveLength(7);
    expect(ss.leapYear.rule).toBe("gregorian");
    
    // Validate specific dates
    const validation = validateConversion(sc, ss);
    expect(validation.allMatch).toBe(true);
  });
  
  test("handles intercalary days correctly", () => {
    const sc = loadSimpleCalendar("harptos");
    const ss = convertSimpleCalendarToSS(sc, harptosMetadata);
    
    expect(ss.intercalary).toHaveLength(6);
    expect(ss.intercalary.find(i => i.name === "Shieldmeet")).toMatchObject({
      leapYearOnly: true,
      after: "Midsummer"
    });
  });
});
```

### Manual Verification
- **Cultural accuracy**: Verify descriptions match lore
- **Date consistency**: Cross-check important campaign dates
- **Edge cases**: Test leap years, intercalary days, year boundaries
- **Module compatibility**: Test with J&J travel calculations

## Error Handling

### Common Conversion Issues
1. **Missing intercalary month references**: When `after` field can't be determined
2. **Ambiguous leap year rules**: Complex rules that don't map cleanly
3. **Invalid weekday counts**: Weekday arrays that don't make sense
4. **Negative year handling**: Calendar epochs and negative years

### Fallback Strategies
```typescript
function safeConversion(scData: SimpleCalendarData): ConversionResult {
  try {
    const converted = convertSimpleCalendarToSS(scData, metadata);
    const validation = validateConversion(scData, converted);
    
    if (!validation.allMatch) {
      return {
        success: false,
        error: "Date calculations don't match original",
        details: validation.results
      };
    }
    
    return { success: true, calendar: converted };
    
  } catch (error) {
    return {
      success: false,
      error: `Conversion failed: ${error.message}`,
      fallback: createSimpleCalendarFallback(scData)
    };
  }
}
```

## Success Metrics

### Conversion Completeness
- ✅ **95%+ of Simple Calendar presets** converted successfully
- ✅ **100% date accuracy** on validation test suite
- ✅ **Enhanced descriptions** for all major calendars
- ✅ **Cultural context** added where appropriate

### Quality Standards
- All converted calendars pass automated validation
- Manual review confirms cultural accuracy
- Test suite covers edge cases (leap years, intercalary days)
- Documentation explains any limitations or approximations

---

**Related Issues**: FOU-86 (Calendar Conversion), FOU-83 (Format Specification)  
**Implementation**: Run conversion script as part of FOU-86 development