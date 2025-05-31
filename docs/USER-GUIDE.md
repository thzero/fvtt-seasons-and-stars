# User Guide - Seasons & Stars

A comprehensive guide to using Seasons & Stars for calendar and time management in Foundry VTT.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Calendar Views](#calendar-views)
- [Time Management](#time-management)
- [Calendar Selection](#calendar-selection)
- [Settings & Configuration](#settings--configuration)
- [SmallTime Integration](#smalltime-integration)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Installation
1. Open Foundry VTT and navigate to **Add-on Modules**
2. Search for "Seasons & Stars" in the module browser
3. Click **Install** and enable the module in your world
4. Refresh your browser and the calendar will be available

### First Launch
When you first enable Seasons & Stars:
- The module defaults to the **Gregorian calendar**
- If starting a new world, it automatically sets to today's real-world date
- The time widget appears in the UI (can be disabled in settings)

### Permissions
- **Players**: Can view calendar and current date/time
- **GMs**: Can change dates, advance time, and configure calendars
- **Assistant GMs**: Same permissions as GMs

## 📅 Calendar Views

Seasons & Stars provides multiple ways to view and interact with your calendar:

### 1. Full Calendar Widget
The main calendar interface with complete controls.

**Features:**
- Current date display with formatted text
- Quick time advancement buttons (minutes, hours, days, weeks, months)
- Calendar selection dropdown
- "Today" button to jump to current date
- Seasonal and time-of-day indicators

**How to Access:**
- Click the **calendar icon** in Scene Controls (left sidebar)
- Or use the macro: `SeasonsStars.CalendarWidget.show()`

### 2. Mini Widget (SmallTime Integration)
A compact calendar companion that works alongside SmallTime.

**Features:**
- Displays current date in compact format
- Click to open full calendar widget
- Automatically positions relative to SmallTime
- Minimal screen space usage

**Positioning:**
- **With SmallTime**: Appears above SmallTime automatically
- **Without SmallTime**: Positions near player list
- **Responsive**: Adapts to UI changes and window resizing

### 3. Monthly Grid View
Traditional calendar grid for date selection and navigation.

**Features:**
- Full month view with clickable dates
- Previous/next month navigation
- **Year input**: Click the year to jump to any year instantly
- Today indicator with clear "TODAY" label
- Visual distinction for current, selected, and regular dates

**How to Access:**
- Click **"Month Grid"** button in the full calendar widget
- Or use the macro: `SeasonsStars.CalendarGridWidget.show()`

### 4. Calendar Selection Dialog
Browse and switch between available calendars.

**Features:**
- Preview sample dates for each calendar
- Calendar structure information (months, weekdays, leap years)
- Cultural descriptions and settings information
- Easy switching between calendar systems

## ⏰ Time Management

### Advancing Time (GM Only)

#### Quick Time Buttons
Use the buttons in the full calendar widget:
- **+1 Min**: Advance by 1 minute
- **+10 Min**: Advance by 10 minutes  
- **+1 Hour**: Advance by 1 hour
- **+8 Hours**: Advance by 8 hours (rest period)
- **+1 Day**: Advance by 1 day
- **+1 Week**: Advance by 1 week

#### Direct Date Setting
1. Open the **Monthly Grid View**
2. Click on any date to set the world time to that date
3. Confirmation notification shows the new date

#### Year Navigation
1. In Monthly Grid View, click on the **year display**
2. Enter the desired year in the dialog
3. Calendar jumps immediately to that year

### Time Display Formats
Seasons & Stars shows time in multiple formats:
- **Short**: "25 Dec 2024"
- **Long**: "Wednesday, December 25th, 2024 CE at 2:30 PM"
- **Custom**: Based on calendar configuration

### Real-World Date Initialization
For new worlds using the Gregorian calendar:
- Automatically sets to current real-world date and time
- Only applies to worlds with worldTime = 0 (new worlds)
- Only affects Gregorian calendar (not fantasy calendars)

## 🗓️ Calendar Selection

### Built-in Calendars

#### Gregorian Calendar
- Standard Earth calendar with 12 months
- Leap years every 4 years (with century exceptions)
- 7-day weeks (Sunday through Saturday)
- Suitable for modern or historical Earth settings

#### Vale Reckoning
- Fantasy calendar inspired by Forgotten Realms
- 12 months with 30 days each + special days
- 6-day weeks (different weekday names)
- Includes intercalary days and special festivals

### Switching Calendars
1. Click **"Select Calendar"** in the full calendar widget
2. Browse available calendars with previews
3. Click **"Select"** to switch immediately
4. All existing world time is preserved and converted

### Custom Calendars
*(Coming in Phase 2)*
- Import custom calendar JSON files
- Create calendars with the in-app editor
- Share calendars with your community

## ⚙️ Settings & Configuration

### Module Settings
Access via **Game Settings → Module Settings → Seasons & Stars**:

#### Client Settings
- **Show Time Widget**: Toggle mini widget visibility
- **Widget Position**: Control automatic positioning behavior

#### World Settings (GM Only)
- **Active Calendar**: Choose which calendar system to use
- **Default View**: Set preferred calendar view
- **Time Format**: Configure date/time display options

### Calendar Configuration
Each calendar includes:
- **Year Settings**: Epoch, naming conventions, starting weekday
- **Month Configuration**: Names, lengths, descriptions
- **Weekday Setup**: Names and cultural significance
- **Leap Year Rules**: Gregorian, custom intervals, or none
- **Time Structure**: Hours per day, minutes per hour, seconds per minute

## 🕐 SmallTime Integration

Seasons & Stars works seamlessly with the SmallTime module:

### Automatic Features
- **Smart Positioning**: Mini widget appears above SmallTime
- **Visual Consistency**: Matches SmallTime's styling
- **Responsive Layout**: Adapts to SmallTime movement
- **No Conflicts**: Both modules work together perfectly

### Manual Configuration
If automatic positioning doesn't work:
1. Disable auto-positioning in settings
2. Use CSS to manually position the mini widget
3. Or disable the mini widget and use only the full calendar

### Without SmallTime
- Mini widget positions near the player list
- Standalone mode with consistent styling
- All features work normally

## 🛠️ Troubleshooting

### Common Issues

#### Calendar Not Appearing
**Solution:**
1. Check that the module is enabled
2. Verify you're using Foundry v13 or higher
3. Try refreshing the browser
4. Check browser console for errors

#### Date Changes Not Working
**Possible Causes:**
- User lacks GM permissions
- Simple Calendar is conflicting
- Time is paused in Foundry

**Solution:**
1. Ensure you have GM rights
2. Disable conflicting calendar modules
3. Check Foundry's time controls

#### Mini Widget Positioning Issues
**Solution:**
1. Try refreshing the page
2. Toggle the widget off and on in settings
3. Check for UI module conflicts
4. Use manual positioning if needed

#### SmallTime Integration Problems
**Solution:**
1. Ensure both modules are up to date
2. Check module load order (Seasons & Stars should load after SmallTime)
3. Try disabling other UI modules temporarily

### Performance Tips
- **Large Years**: Using very large year numbers may slow calculations
- **Multiple Widgets**: Only keep necessary widgets open
- **Browser Cache**: Clear cache if experiencing strange behavior

### Getting Help
1. **Check Console**: F12 → Console for error messages
2. **Module Conflicts**: Temporarily disable other modules to test
3. **Report Issues**: Use GitHub Issues with error details and module list
4. **Community Support**: Ask in Foundry Discord #modules channel

## 📋 Keyboard Shortcuts

### Calendar Navigation
- **T**: Toggle calendar widget
- **G**: Open monthly grid view
- **Escape**: Close open calendar dialogs

### Time Controls (GM Only)
- **Ctrl + →**: Advance 1 hour
- **Ctrl + ↓**: Advance 1 day
- **Ctrl + ↑**: Go to today

*(Note: Keyboard shortcuts may be added in future updates)*

## 🎯 Best Practices

### For GMs
1. **Set Expectations**: Tell players which calendar system you're using
2. **Document Important Dates**: Use notes system (when available) for events
3. **Regular Updates**: Advance time consistently during sessions
4. **Calendar Context**: Share calendar descriptions with players

### For Players
1. **Track Time**: Pay attention to date changes during gameplay
2. **Plan Ahead**: Use calendar for scheduling character activities
3. **Seasonal Awareness**: Consider how seasons affect your character
4. **Time-Sensitive Activities**: Remember spell durations and rest requirements

### For Module Developers
1. **Hook Integration**: Use `seasons-stars:dateChanged` for time-sensitive features
2. **API Usage**: Prefer Seasons & Stars API over direct time manipulation
3. **Compatibility**: Test with both Seasons & Stars and Simple Calendar
4. **Error Handling**: Gracefully handle calendar system changes

---

**Need more help?** Check the [Developer Guide](./DEVELOPER-GUIDE.md) for technical details or visit our [GitHub Discussions](https://github.com/your-username/seasons-and-stars/discussions) for community support.