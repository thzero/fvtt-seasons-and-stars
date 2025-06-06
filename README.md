# Seasons & Stars

A calendar and timekeeping module for Foundry VTT v13+ with clean integration APIs and extensible architecture.

## 🌟 Features

### ✅ **Available Now (Alpha)**

- **Modern UI**: Clean, responsive calendar interface with ApplicationV2 architecture
- **Multiple Calendar Views**: Full calendar widget, compact mini widget, and monthly grid view
- **Smart Year Navigation**: Click year to jump instantly instead of clicking arrows repeatedly
- **Convenient Defaults**: Gregorian calendars can initialize with current date/time
- **Module Integration**: Clean APIs for weather modules and other integrations via compatibility bridges
- **SmallTime Integration**: Seamless positioning and visual consistency
- **Multiple Calendar Support**: Switch between Gregorian, Vale Reckoning, and custom calendars

### 🚧 **Coming Soon**

- **Notes System**: Full calendar event and note management with Journal integration
- **Weather Module Support**: Comprehensive notes API for weather modules and other integrations
- **Advanced Configuration**: In-app calendar editor and migration tools
- **Extended Integrations**: Enhanced module compatibility and hook system

## 🚀 Quick Start

### Installation

**Option 1: Foundry Module Browser**

1. Install from Foundry VTT module browser: "Seasons & Stars"
2. Enable the module in your world
3. Configure your preferred calendar in module settings

**Option 2: Manual Installation (Pre-Registry)**

1. In Foundry VTT, go to Add-on Modules → Install Module
2. Use manifest URL: `https://github.com/rayners/fvtt-seasons-and-stars/releases/latest/download/module.json`
3. Enable the module in your world

### Basic Usage

- **Open Calendar**: Click the calendar button in scene controls
- **Change Date**: GMs can click on calendar dates to set world time
- **Quick Time Controls**: Use the mini widget for rapid time advancement
- **Calendar Selection**: Switch between different calendar systems anytime

## 📖 Documentation

- **[User Guide](./docs/USER-GUIDE.md)** - Complete usage instructions
- **[Developer Guide](./docs/DEVELOPER-GUIDE.md)** - API reference and integration guide
- **[Migration Guide](./docs/MIGRATION-GUIDE.md)** - Moving from Simple Calendar
- **[Roadmap](./docs/ROADMAP.md)** - Development timeline and planned features
- **[Known Issues](./KNOWN-ISSUES.md)** - Current limitations and workarounds

## 🎯 Who Should Use This

### **Beta Testers**

- Module developers wanting to integrate calendar functionality
- GMs who need reliable timekeeping with clean UI
- Communities wanting to test cutting-edge calendar features

### **Migration Candidates**

- Users seeking a modern calendar solution for Foundry v13+
- Users wanting better SmallTime integration
- Communities needing custom calendar support

⚠️ **Migration Note**: Simple Calendar users should review [Known Issues](./KNOWN-ISSUES.md) for current migration limitations including calendar import and note synchronization.

## 🤝 Module Integration

Seasons & Stars provides **clean integration APIs** for calendar-aware modules:

```javascript
// Direct API access
const currentDate = game.seasonsStars.api.getCurrentDate();
const worldTime = game.seasonsStars.api.dateToWorldTime(currentDate);
const formatted = game.seasonsStars.api.formatDate(currentDate);

// Hook integration for module updates
Hooks.on('seasons-stars:dateChanged', data => {
  // Respond to date changes in your module
  console.log('Date changed:', data.newDate);
});
```

**Compatibility bridges available** for seamless migration from other calendar systems.

## 📋 Requirements

- **Foundry VTT**: v13 or higher
- **Compatibility**: Intended for all game systems (system-agnostic design)
- **Permissions**: GM required for time changes

## 🔧 Development

### For Module Developers

```javascript
// Access the Seasons & Stars API
const currentDate = game.seasonsStars.api.getCurrentDate();
await game.seasonsStars.api.advanceDays(1);

// Listen for date changes
Hooks.on('seasons-stars:dateChanged', data => {
  console.log('Date changed:', data.newDate);
});
```

See the [Developer Guide](./docs/DEVELOPER-GUIDE.md) for complete API reference.

### Build from Source

```bash
git clone https://github.com/rayners/fvtt-seasons-and-stars
cd fvtt-seasons-and-stars
npm install
npm run build
```

## 🗺️ Roadmap

### **Phase 1: Core Foundation** ✅ _Complete_

- Basic calendar system and UI
- Simple Calendar compatibility layer
- Essential user features

### **Phase 2: Notes & Integration** 🚧 _Next (Q1 2025)_

- Full notes system with Journal integration
- Complete weather module support
- Advanced hook system

### **Phase 3: Advanced Features** 📅 _Q2 2025_

- Calendar editor and creation tools
- Migration assistant from Simple Calendar
- Enhanced theming and customization

See the complete [Roadmap](./docs/ROADMAP.md) for detailed timelines.

## 📄 License

[MIT License](./LICENSE) - Free for personal and commercial use.

## 🐛 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/rayners/fvtt-seasons-and-stars/issues)
- **Documentation**: [Complete Guides](https://docs.rayners.dev/seasons-and-stars)
- **Discord**: [Foundry VTT Community](https://discord.gg/foundryvtt) - `#modules` channel

---

**Ready to try a calendar system built for Foundry v13+?** Install Seasons & Stars today and experience the difference!
