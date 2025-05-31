📦 Project Overview: Seasons & Stars

Type: Foundry VTT v13+ Module
Purpose: A flexible calendar and timekeeping interface built on Foundry’s native time system. It provides a clear UI for tracking the current in-game date and time, supports custom calendars, and includes optional presets like the Misty Vale Reckoning for fantasy worlds.

⸻

✨ Core Features (Initial Scope)
	1.	Default Calendar: Earth-Like (Gregorian)
	•	12 months, 7-day week, leap year logic (optional)
	•	Aligns with Foundry’s internal game.time.worldTime
	•	Displays current weekday, date, and year
	2.	Custom Calendar Support
	•	Users can define alternative calendars using JSON (or via UI later)
	•	Custom formats support:
	•	Month names & lengths
	•	Weekday names
	•	Intercalary days
	•	Year start day, epoch shift, etc.
	3.	Calendar Presets
	•	Ships with at least one preset: Misty Vale Reckoning (Dragonbane-inspired)
	•	When the module is first enabled, user is prompted to:
	•	Stick with Earth-style
	•	Apply a preset (e.g. Misty Vale)
	•	Or define their own
	4.	Simple UI Widget
	•	Displays the current in-world date and time
	•	Can be added to the scene UI or popout panel
	•	Includes stylized formatting for flavor (e.g., “Wyrdday, 14th Greenspire, 1542 MVR”)
	5.	API + Hook Integration
	•	Exposes calendar utilities:
	•	getCurrentDate() returns structured date object
	•	advanceDays(n) adjusts worldTime accordingly
	•	Emits hook events like seasonsStars:dateChanged for integration

⸻

📚 File Structure (Suggested)

seasons-and-stars/
├── calendar.js          # Core calendar model, handles conversion and formatting
├── settings.js          # Calendar selection, default behavior, preset import
├── ui/calendar-ui.js    # Minimal display widget
├── data/
│   ├── earth.json       # Default Gregorian-like calendar
│   └── misty-vale.json  # Misty Vale Reckoning preset
├── hooks.js             # Registers hooks and API exposure
├── module.json
└── README.md


⸻

🧠 Agent Instructions
	•	Build a v13+ Foundry module named seasons-and-stars
	•	Start with a basic Earth-style calendar that tracks months, days, and weekdays using Foundry’s native game.time.worldTime
	•	On module init, if no calendar is configured:
	•	Prompt user to keep Earth, apply a preset (like Misty Vale), or define a custom one
	•	Load the selected calendar definition and apply it to all formatting and conversions
	•	Create a small UI element showing the current in-world date
	•	Emit hooks and expose a lightweight API to allow other modules to consume the current date

⸻

Let me know if you’d like me to generate:
	•	A sample earth.json config (Gregorian structure)
	•	A properly formatted misty-vale.json preset
	•	A minimal working calendar.js with stub methods and worldTime support

We could even create an extension registration pattern so that other modules (like Journeys & Jamborees) can register their own calendars or time-bound behaviors.

⸻

🎯 Recent Development Progress (Current Session)

**UI Positioning & SmallTime Integration**

✅ **Fixed Mini Widget Positioning**
	•	Resolved "jarring" position jumping between sidebar and scene controls
	•	Mini widget now consistently targets player list location (where SmallTime would be)
	•	Implemented intelligent fallback positioning when SmallTime not available
	•	Added robust element detection with multiple selector strategies

✅ **Enhanced SmallTime Integration**
	•	Detects SmallTime module presence and UI elements dynamically
	•	Positions above SmallTime by default (instead of below) for better visibility
	•	Matches SmallTime background styling for visual consistency
	•	Listens for SmallTime movement and player list changes for responsive positioning

✅ **Main Calendar Widget Improvements**
	•	Converted Quick Time buttons to horizontal layout for better space utilization
	•	Buttons now use flex layout with proper wrapping and spacing
	•	Maintained existing gradient styling and hover effects
	•	Optimized button sizing for compact horizontal arrangement

**Technical Implementation Details**

```typescript
// Multi-fallback positioning strategy
const selectors = [
  '#smalltime-app',
  '.smalltime-app', 
  '#timeDisplay',
  '#slideContainer',
  '[id*="smalltime"]',
  '.form:has(#timeDisplay)'
];

// Smart standalone positioning targets player list location
const players = document.querySelector('#players');
if (players) {
  const playersRect = players.getBoundingClientRect();
  position = {
    top: playersRect.top - estimatedMiniHeight - 12,
    left: playersRect.left
  };
}
```

```scss
// Horizontal Quick Time button layout
&.horizontal {
  .time-buttons {
    display: flex;
    flex-direction: row;
    gap: 6px;
    flex-wrap: wrap;
    
    button {
      flex: 1;
      min-width: 60px;
      padding: 6px 8px;
      font-size: 0.75em;
    }
  }
}
```
