# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

💖 **Love this module?** Consider [supporting development on Patreon](https://patreon.com/rayners) to help fund new features and faster updates!

## [0.2.1] - 2025-06-05

### Added

- **Security Policy**: Added comprehensive SECURITY.md with vulnerability reporting guidelines
- **Repository Infrastructure**: Enhanced repository with proper description, topics, and branch protection

### Changed

- **Memory Management**: Removed memory size checking in favor of dedicated Memory Mage module in development
- **Performance Monitoring**: Simplified note performance optimizer to focus on core functionality

### Enhanced

- **Code Quality**: Improved TypeScript definitions and cleaned up dependencies
- **UI Polish**: Minor styling improvements and template refinements
- **Localization**: Updated language strings for better user experience

### Fixed

- **Performance**: Optimized note storage systems and reduced memory overhead
- **Styling**: Enhanced calendar widget responsive design and visual consistency

## [0.2.0] - 2025-06-05

### Added

- **Multi-Day Intercalary Support**: Calendar format now supports multi-day festivals and intercalary periods
  - Enhanced TypeScript interface with `days?: number` field for intercalary periods
  - Backward compatibility maintained - single-day periods work unchanged
  - Updated calendar engine to handle complex festivals like Greyhawk's 7-day celebrations
  - Added 8 new built-in calendars: Dark Sun, Eberron, Exandrian, Forbidden Lands, Forgotten Realms, Golarion PF2e, Greyhawk, Symbaroum, Traveller Imperial, Warhammer
- **Errors & Echoes Integration**: Optional error reporting module integration
  - Graceful handling when Errors & Echoes not installed
  - Rich context provider with calendar state and system information
  - Smart error filtering for calendar-related issues only
- **Enhanced Documentation Organization**: Professional public/private documentation separation
  - Universal documentation standards for clean repositories
  - Private development documentation moved to local-docs with Obsidian integration
  - Clear public-facing documentation focused on user value

### Enhanced

- **Calendar Format**: Multi-day intercalary periods for complex festival systems
- **Test Coverage**: Expanded to 38 automated tests including multi-day intercalary validation
- **Real Calendar Support**: Comprehensive testing with actual fantasy calendar systems
- **TypeScript Definitions**: Enhanced calendar type definitions with multi-day support

### Fixed

- **Calendar Engine**: Accurate date arithmetic across multi-day intercalary periods
- **Year Length Calculation**: Correct handling of variable-length intercalary periods
- **Date Conversion**: Proper world time conversion with complex calendar structures

## [0.1.0] - 2025-01-15

### Added

- **Complete Calendar System**: Modern calendar interface with native Foundry v13+ integration
- **Calendar Widget**: Main calendar interface with full date navigation and time controls
- **Calendar Mini Widget**: Compact companion widget with SmallTime integration
- **Calendar Selection Dialog**: Multi-calendar support with built-in calendar library
- **Bridge Integration**: Generic integration interface for external module compatibility
- **Time Management**: Comprehensive time advancement with hours, days, weeks, months, years
- **Calendar Engine**: Robust date calculation system with leap year support
- **Built-in Calendars**: Gregorian and Vale Reckoning calendars included
- **JSON Calendar Format**: Human-readable calendar definitions with cultural descriptions
- **Notes System**: Complete calendar notes with CRUD operations, categories, and search
- **Recurring Events**: Advanced recurring note patterns with exception handling
- **Note Categories**: 8 default categories with custom category support
- **Search & Filtering**: Multi-criteria note search with performance optimization
- **Permission System**: Comprehensive GM/player access control for notes
- **Simple Weather Integration**: Flag-based weather data storage compatibility
- **SmallTime Integration**: Enhanced positioning and visual consistency
- **Performance Optimization**: Memory management, caching, and large collection support
- **Production Logging**: Centralized logging system with debug mode toggle
- **Error Handling**: Graceful degradation with user notifications
- **Input Validation**: Comprehensive validation for all public APIs
- **TypeScript Support**: Complete type definitions for Foundry v13
- **Module Settings**: Configurable debug mode, notifications, and note permissions
- **Hook System**: Event handling for module integration and extensibility

### Technical Features

- **ApplicationV2 Architecture**: Modern Foundry v13+ application framework
- **HandlebarsApplicationMixin**: Template-driven UI with proper data binding
- **Semantic Versioning**: Future-proof versioning with compatibility detection
- **Module Flag Support**: Secure storage for external module integration
- **Capability Detection**: Runtime feature probing for robust integration
- **Clean Build System**: Zero TypeScript errors, production-ready compilation
- **Comprehensive Testing**: 100% test pass rate with widget API coverage
- **Documentation**: Complete API reference, user guide, and developer documentation

### Migration Support

- **Simple Calendar Compatibility**: Separate compatibility bridge for zero-migration transition
- **API Compatibility**: Complete Simple Calendar API emulation for existing modules
- **Data Format Conversion**: Seamless conversion between calendar formats
- **Bridge Architecture**: Clean separation between core module and compatibility layer

### Performance

- **Sub-100ms Search**: Optimized search performance for large note collections
- **Memory Management**: Intelligent caching with pressure relief mechanisms
- **Efficient Storage**: Date-based indexing for fast note retrieval
- **Lazy Loading**: Calendar definitions loaded on demand
- **Real-time Updates**: Synchronous operations for immediate UI feedback

### Developer Experience

- **Complete API Documentation**: 780-line developer reference guide
- **Integration Examples**: Real-world usage patterns and code samples
- **Error Handling Guide**: Comprehensive error scenarios and recovery strategies
- **Version Compatibility**: Multi-version support documentation
- **TypeScript Definitions**: Full type safety with IntelliSense support

### User Experience

- **Intuitive Interface**: Clean, modern UI following Foundry design patterns
- **Quick Time Controls**: One-click time advancement buttons
- **Visual Feedback**: Clear indicators, animations, and state changes
- **Responsive Design**: Works across different screen sizes and UI configurations
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## [Unreleased]

### Planned Features

- **Calendar Editor**: In-app calendar creation and modification tools
- **Community Calendar Library**: User-submitted calendar collection
- **Advanced Time Zones**: Multi-region time tracking capabilities
- **Enhanced Integrations**: Deep system-specific features and optimizations
- **Import/Export Tools**: Migration utilities for other calendar systems
- **Festival/Event System**: Calendar-based recurring cultural events
- **Weather Integration**: Enhanced seasonal weather pattern support

---

**Note**: This is the initial public release of Seasons & Stars. The module has been extensively tested and optimized for production use in Foundry VTT v11+ environments with full compatibility for v13+ features.
