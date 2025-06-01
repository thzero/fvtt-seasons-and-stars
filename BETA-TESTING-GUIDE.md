# Seasons & Stars Beta Testing Guide

## Welcome Beta Testers! 🎉

Thank you for helping us prepare Seasons & Stars for public release. Your feedback is crucial for ensuring a smooth launch and great user experience.

## Overview

**Seasons & Stars** is a modern calendar and timekeeping module for Foundry VTT v13+ designed as an alternative to Simple Calendar. This beta focuses on core functionality, migration compatibility, and integration with popular modules.

**Testing Period**: January 8-14, 2025  
**Target Release**: January 15, 2025

## Pre-Testing Setup

### Installation Instructions

#### Option 1: Direct Download (Recommended for Beta)
1. Download the latest beta build from: [GitHub Releases](https://github.com/rayners/fvtt-seasons-and-stars/releases)
2. Extract to your Foundry `Data/modules/` directory
3. Enable "Seasons & Stars" in Module Management

#### Option 2: Manifest URL
1. In Foundry, go to Module Management → Install Module
2. Paste manifest URL: `https://github.com/rayners/fvtt-seasons-and-stars/releases/latest/download/module.json`
3. Click Install

### Simple Calendar Migration (If Applicable)
If you're currently using Simple Calendar and want to test migration:

1. **Install Simple Calendar Compatibility Bridge** (separate module):
   - Download from: [GitHub Releases](https://github.com/rayners/simple-calendar-compat/releases)
   - This provides seamless migration with zero disruption

2. **Migration Steps**:
   - Keep Simple Calendar enabled initially
   - Install and enable Seasons & Stars
   - Install and enable Simple Calendar Compatibility Bridge
   - Test that existing functionality works
   - When satisfied, disable Simple Calendar (keep bridge enabled)

## Core Testing Scenarios

### Scenario 1: Fresh Installation ⭐ PRIORITY
**Objective**: Verify clean installation on new world

**Steps**:
1. Create a new test world (any game system)
2. Install Seasons & Stars (no other calendar modules)
3. Enable module and reload
4. Open calendar widget from scene controls
5. Test basic date navigation (prev/next month, year)
6. Test "Today" button functionality
7. Try mini widget positioning with/without SmallTime

**Expected Results**:
- ✅ Module loads without errors
- ✅ Calendar displays with correct current date
- ✅ Navigation works smoothly
- ✅ Mini widget positions appropriately
- ✅ No console errors during basic usage

**Report**: Rate 1-5 and note any issues

---

### Scenario 2: Simple Calendar Migration ⭐ PRIORITY
**Objective**: Test migration from Simple Calendar setup

**Prerequisites**: Existing world with Simple Calendar and notes/settings

**Steps**:
1. Note current Simple Calendar date and any existing notes
2. Install Simple Calendar Compatibility Bridge
3. Install Seasons & Stars
4. Enable both new modules (keep Simple Calendar enabled)
5. Verify date matches exactly
6. Test that existing notes still appear
7. Test creating new notes through S&S interface
8. Disable Simple Calendar, verify bridge maintains functionality

**Expected Results**:
- ✅ Date matches perfectly between calendars
- ✅ Existing notes preserved and accessible
- ✅ New notes can be created and edited
- ✅ No functionality lost when disabling Simple Calendar
- ✅ Simple Weather (if installed) continues working

**Report**: Document any discrepancies or data loss

---

### Scenario 3: Simple Weather Integration ⭐ PRIORITY
**Objective**: Verify Simple Weather module continues working

**Prerequisites**: Simple Weather module installed

**Steps**:
1. Install S&S with Simple Calendar Compatibility Bridge
2. Open Simple Weather interface
3. Generate weather for current day
4. Verify weather data appears in calendar notes
5. Navigate to different dates and check weather persistence
6. Test weather generation for multiple days
7. Check weather data survives Foundry restart

**Expected Results**:
- ✅ Simple Weather interface opens without errors
- ✅ Weather generation works normally
- ✅ Weather data appears as calendar notes
- ✅ Data persists across dates and sessions
- ✅ No conflicts between S&S and Simple Weather

**Report**: Note any weather data issues or UI conflicts

---

### Scenario 4: SmallTime Compatibility
**Objective**: Test integration with SmallTime module

**Prerequisites**: SmallTime module installed and configured

**Steps**:
1. Enable SmallTime and position it normally
2. Install and enable S&S mini widget
3. Verify mini widget positions near SmallTime
4. Test SmallTime functionality (time advancement, etc.)
5. Test S&S date changes reflect in SmallTime display
6. Test with SmallTime in different UI positions
7. Test with player list expanded/collapsed

**Expected Results**:
- ✅ Mini widget positions appropriately near SmallTime
- ✅ Both widgets function independently
- ✅ Date changes sync between widgets
- ✅ No visual overlaps or conflicts
- ✅ Positioning adapts to SmallTime movement

**Report**: Note positioning issues or functionality conflicts

---

### Scenario 5: Multiple Calendars
**Objective**: Test calendar switching and management

**Steps**:
1. Open calendar widget
2. Test default Gregorian calendar functionality
3. Switch to Vale Reckoning calendar
4. Test date conversions between calendars
5. Create notes in different calendar systems
6. Switch back to Gregorian, verify notes persist
7. Test "Today" button with different calendars

**Expected Results**:
- ✅ Calendar selection dialog opens and works
- ✅ Date calculations accurate for each calendar
- ✅ Notes preserved across calendar switches
- ✅ UI updates correctly for different calendar systems
- ✅ No confusion or data loss during switches

**Report**: Note any calculation errors or data issues

---

### Scenario 6: Permission System
**Objective**: Test GM vs Player access controls

**Steps**:
1. **As GM**: 
   - Create calendar notes (test all visibility options)
   - Change dates using calendar widget
   - Modify calendar settings
2. **As Player**:
   - Verify appropriate notes are visible
   - Test that date changes are disabled
   - Verify read-only access to calendars
3. **Permission Testing**:
   - Test player-visible vs GM-only notes
   - Test note editing permissions

**Expected Results**:
- ✅ GM has full control over dates and settings
- ✅ Players see only appropriate notes
- ✅ Players cannot change dates or access GM content
- ✅ Permission errors handled gracefully
- ✅ UI adapts appropriately for different users

**Report**: Note any permission bypasses or access issues

## Additional Testing Areas

### Browser Compatibility
Test in your primary browser and note any issues:
- [ ] Chrome (latest)
- [ ] Firefox (latest) 
- [ ] Safari (latest)
- [ ] Edge (latest)

### Game System Testing
If possible, test with different game systems:
- [ ] D&D 5e
- [ ] Pathfinder 2e
- [ ] Any other system you use

### Performance Testing
For established worlds with lots of data:
- [ ] Test with 100+ journal entries
- [ ] Test with large party sizes
- [ ] Note any slowdowns or memory issues

## Reporting Issues

### Bug Reports
**Use**: [GitHub Issues](https://github.com/rayners/fvtt-seasons-and-stars/issues)

**Include**:
- Foundry version
- Game system
- Other active modules
- Steps to reproduce
- Expected vs actual behavior
- Browser console errors (F12 → Console)
- Screenshots if relevant

### General Feedback
**Discord Channel**: `#seasons-stars-beta` (invite link provided separately)

**Feedback Form**: [Google Form Link] (provided via Discord)

### Priority Issue Examples
🔥 **Critical**: Data loss, crashes, module conflicts  
⚠️ **High**: Feature not working, major UI issues  
💡 **Medium**: Minor UI glitches, suggestions  
📝 **Low**: Documentation, polish items

## What We're Looking For

### Functionality
- [ ] Does everything work as expected?
- [ ] Are there any crashes or errors?
- [ ] Do integrations with other modules work?

### User Experience
- [ ] Is the interface intuitive?
- [ ] Are there confusing or unclear elements?
- [ ] Does the migration process feel smooth?

### Performance
- [ ] Are there any slowdowns or lag?
- [ ] Does memory usage seem reasonable?
- [ ] How does it perform with large datasets?

### Compatibility
- [ ] Works with your game systems?
- [ ] Integrates well with your module setup?
- [ ] No conflicts with other modules?

## Feedback Timeline

**Daily Check-ins**: January 8-12 (Discord channel)  
**Consolidated Feedback**: January 13 (via form)  
**Final Issues**: January 14 morning (GitHub issues)

## Beta Tester Recognition

Beta testers will be:
- Listed in module credits (with permission)
- Given early access to future features
- Invited to future beta programs
- Provided with direct developer communication

## Questions?

**Discord**: @rayners78  
**GitHub**: @rayners  
**Email**: Available via Discord DM

## Thank You!

Your testing and feedback are essential for making Seasons & Stars a great addition to the Foundry community. Every bug found and suggestion made helps create a better experience for all users.

**Happy Testing!** 🗓️✨

---

## Quick Reference Links

- **GitHub Repository**: https://github.com/rayners/fvtt-seasons-and-stars
- **Documentation**: https://docs.rayners.dev/seasons-and-stars/
- **Issues**: https://github.com/rayners/fvtt-seasons-and-stars/issues
- **Discord**: `#seasons-stars-beta` channel
- **Release Plan**: [PUBLIC-RELEASE-PLAN.md](PUBLIC-RELEASE-PLAN.md)