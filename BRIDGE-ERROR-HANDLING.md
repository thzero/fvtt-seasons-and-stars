# Bridge Error Handling & Fallback Strategies

## Overview
Comprehensive error handling and fallback strategies for robust bridge integration with Seasons & Stars, ensuring compatibility modules continue to function even when S&S is unavailable, outdated, or experiencing issues.

---

## Error Categories & Handling

### 1. Module Availability Errors

#### 1.1 S&S Module Not Installed
```typescript
class SeasonsStarsIntegration {
  static detect(): SeasonsStarsIntegration | null {
    const module = game.modules.get('seasons-and-stars');
    if (!module) {
      console.log('Seasons & Stars module not found');
      return null;
    }
    
    if (!module.active) {
      console.log('Seasons & Stars module not active');
      return null;
    }
    
    return new SeasonsStarsIntegration();
  }
}

// Bridge handling
const integration = SeasonsStarsIntegration.detect();
if (!integration) {
  // Fall back to Foundry native time or disable calendar features
  this.useFoundryTimeOnly();
  this.disableCalendarFeatures();
  return;
}
```

#### 1.2 S&S API Not Ready
```typescript
class SeasonsStarsIntegration {
  constructor() {
    this.apiReady = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    
    this.waitForAPI();
  }
  
  private async waitForAPI(): Promise<void> {
    while (this.retryCount < this.maxRetries) {
      if (game.seasonsStars?.api) {
        this.apiReady = true;
        this.api = game.seasonsStars.api;
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      this.retryCount++;
    }
    
    if (!this.apiReady) {
      throw new Error('S&S API not available after timeout');
    }
  }
}
```

### 2. Version Compatibility Errors

#### 2.1 Version Detection
```typescript
interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

class VersionManager {
  static parseVersion(versionString: string): VersionInfo {
    const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }
    
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]), 
      patch: parseInt(match[3]),
      raw: versionString
    };
  }
  
  static compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);
    
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }
  
  static isCompatible(currentVersion: string, minVersion: string): boolean {
    return this.compareVersions(currentVersion, minVersion) >= 0;
  }
}
```

#### 2.2 Feature Compatibility Matrix
```typescript
interface FeatureCompatibility {
  [feature: string]: {
    minVersion: string;
    fallback?: () => any;
    required: boolean;
  };
}

const FEATURE_MATRIX: FeatureCompatibility = {
  'basic-api': {
    minVersion: '1.0.0',
    required: true
  },
  'widget-buttons': {
    minVersion: '1.1.0',
    fallback: () => this.useDOMManipulation(),
    required: false
  },
  'time-advancement': {
    minVersion: '1.2.0',
    fallback: () => this.useFoundryTimeAdvancement(),
    required: false
  },
  'multiple-calendars': {
    minVersion: '1.3.0',
    fallback: () => this.useSingleCalendarMode(),
    required: false
  }
};

class FeatureManager {
  constructor(private integration: SeasonsStarsIntegration) {
    this.checkFeatureCompatibility();
  }
  
  private checkFeatureCompatibility(): void {
    const version = this.integration.version;
    
    for (const [feature, config] of Object.entries(FEATURE_MATRIX)) {
      const compatible = VersionManager.isCompatible(version, config.minVersion);
      
      if (!compatible && config.required) {
        throw new Error(`Required feature '${feature}' not available in S&S ${version}`);
      }
      
      if (!compatible && config.fallback) {
        console.warn(`Feature '${feature}' not available, using fallback`);
        config.fallback();
      }
    }
  }
}
```

### 3. API Operation Errors

#### 3.1 Date Conversion Failures
```typescript
class SafeDateConverter {
  worldTimeToDate(timestamp: number): CalendarDate {
    try {
      return this.integration.api.worldTimeToDate(timestamp);
    } catch (error) {
      console.error('S&S date conversion failed:', error);
      return this.fallbackWorldTimeToDate(timestamp);
    }
  }
  
  private fallbackWorldTimeToDate(timestamp: number): CalendarDate {
    // Use Foundry's built-in date handling
    const date = new Date(timestamp * 1000);
    
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,  // Convert to 1-based
      day: date.getDate(),
      weekday: date.getDay() + 1,   // Convert to 1-based
      time: {
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
      }
    };
  }
  
  dateToWorldTime(date: CalendarDate): number {
    try {
      return this.integration.api.dateToWorldTime(date);
    } catch (error) {
      console.error('S&S time conversion failed:', error);
      return this.fallbackDateToWorldTime(date);
    }
  }
  
  private fallbackDateToWorldTime(date: CalendarDate): number {
    // Create JavaScript Date and convert to timestamp
    const jsDate = new Date(
      date.year,
      date.month - 1,  // Convert from 1-based
      date.day,
      date.time?.hour || 0,
      date.time?.minute || 0,
      date.time?.second || 0
    );
    
    return Math.floor(jsDate.getTime() / 1000);
  }
}
```

#### 3.2 Widget Integration Failures
```typescript
class SafeWidgetManager {
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    try {
      const widget = this.integration.widgets.getPreferredWidget('mini');
      if (widget && widget.addSidebarButton) {
        widget.addSidebarButton(name, icon, tooltip, callback);
        return;
      }
    } catch (error) {
      console.error('Widget button integration failed:', error);
    }
    
    // Fallback to DOM manipulation
    this.fallbackAddSidebarButton(name, icon, tooltip, callback);
  }
  
  private fallbackAddSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    // Wait for widget to be rendered
    Hooks.on('renderApplication', (app, html) => {
      if (this.isCalendarWidget(app)) {
        this.injectButtonToDOM(html, name, icon, tooltip, callback);
      }
    });
  }
  
  private injectButtonToDOM($html: JQuery, name: string, icon: string, tooltip: string, callback: Function): void {
    const button = $(`
      <button type="button" class="bridge-sidebar-button" data-button="${name}" title="${tooltip}">
        <i class="${icon}"></i>
      </button>
    `);
    
    button.on('click', callback);
    
    // Try multiple insertion points for robustness
    const insertionPoints = [
      $html.find('.calendar-sidebar'),
      $html.find('.window-header .window-controls'),
      $html.find('.form-group').last()
    ];
    
    for (const $target of insertionPoints) {
      if ($target.length > 0) {
        $target.append(button);
        return;
      }
    }
    
    console.warn(`Could not inject button '${name}' - no suitable insertion point found`);
  }
}
```

### 4. Hook System Failures

#### 4.1 Hook Registration Errors
```typescript
class SafeHookManager {
  private registeredHooks: Map<string, Function[]> = new Map();
  
  onDateChanged(callback: (event: DateChangeEvent) => void): void {
    try {
      this.integration.hooks.onDateChanged(callback);
      this.trackHook('dateChanged', callback);
    } catch (error) {
      console.error('S&S hook registration failed:', error);
      this.fallbackDateChangeHook(callback);
    }
  }
  
  private fallbackDateChangeHook(callback: (event: DateChangeEvent) => void): void {
    // Listen to Foundry's native time hooks
    const foundryCallback = (worldTime: number) => {
      const oldDate = this.lastKnownDate;
      const newDate = this.safeConverter.worldTimeToDate(worldTime);
      
      callback({
        newDate,
        oldDate: oldDate || newDate,
        worldTime,
        calendarId: 'foundry-default'
      });
      
      this.lastKnownDate = newDate;
    };
    
    Hooks.on('updateWorldTime', foundryCallback);
    this.trackHook('updateWorldTime', foundryCallback);
  }
  
  cleanup(): void {
    // Clean up all registered hooks on module disable
    for (const [hookName, callbacks] of this.registeredHooks) {
      for (const callback of callbacks) {
        Hooks.off(hookName, callback);
      }
    }
    this.registeredHooks.clear();
  }
}
```

### 5. Calendar Data Errors

#### 5.1 Missing Calendar Information
```typescript
class SafeCalendarDataProvider {
  getMonthNames(): string[] {
    try {
      return this.integration.api.getMonthNames();
    } catch (error) {
      console.error('Failed to get month names from S&S:', error);
      return this.getDefaultMonthNames();
    }
  }
  
  private getDefaultMonthNames(): string[] {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }
  
  getWeekdayNames(): string[] {
    try {
      return this.integration.api.getWeekdayNames();
    } catch (error) {
      console.error('Failed to get weekday names from S&S:', error);
      return this.getDefaultWeekdayNames();
    }
  }
  
  private getDefaultWeekdayNames(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
  
  getCurrentDate(): CalendarDate {
    try {
      const date = this.integration.api.getCurrentDate();
      if (!this.validateDate(date)) {
        throw new Error('Invalid date from S&S API');
      }
      return date;
    } catch (error) {
      console.error('Failed to get current date from S&S:', error);
      return this.createFallbackDate();
    }
  }
  
  private validateDate(date: CalendarDate): boolean {
    return !!(
      date &&
      typeof date.year === 'number' &&
      typeof date.month === 'number' &&
      typeof date.day === 'number' &&
      date.month >= 1 && date.month <= 12 &&
      date.day >= 1 && date.day <= 31
    );
  }
  
  private createFallbackDate(): CalendarDate {
    const timestamp = game.time?.worldTime || Date.now() / 1000;
    return this.safeConverter.worldTimeToDate(timestamp);
  }
}
```

---

## Comprehensive Fallback Strategies

### 1. Progressive Degradation
```typescript
class BridgeInitializer {
  async initialize(): Promise<void> {
    // Level 1: Full S&S integration
    try {
      this.integration = SeasonsStarsIntegration.detect();
      if (this.integration && this.integration.isAvailable) {
        await this.initializeFullIntegration();
        return;
      }
    } catch (error) {
      console.warn('Full S&S integration failed:', error);
    }
    
    // Level 2: Basic calendar simulation
    try {
      await this.initializeBasicCalendar();
      return;
    } catch (error) {
      console.warn('Basic calendar initialization failed:', error);
    }
    
    // Level 3: Foundry time only
    this.initializeFoundryTimeOnly();
  }
  
  private async initializeFullIntegration(): Promise<void> {
    this.mode = 'full';
    this.dataProvider = new SafeCalendarDataProvider(this.integration);
    this.widgetManager = new SafeWidgetManager(this.integration);
    this.hookManager = new SafeHookManager(this.integration);
    
    console.log('Bridge initialized with full S&S integration');
  }
  
  private async initializeBasicCalendar(): Promise<void> {
    this.mode = 'basic';
    this.dataProvider = new FallbackCalendarDataProvider();
    this.widgetManager = new DisabledWidgetManager();
    this.hookManager = new BasicHookManager();
    
    console.log('Bridge initialized with basic calendar simulation');
  }
  
  private initializeFoundryTimeOnly(): void {
    this.mode = 'foundry';
    this.dataProvider = new FoundryTimeDataProvider();
    this.widgetManager = new DisabledWidgetManager();
    this.hookManager = new FoundryHookManager();
    
    console.log('Bridge initialized with Foundry time only');
  }
}
```

### 2. Graceful Feature Disabling
```typescript
class FeatureToggleManager {
  private enabledFeatures: Set<string> = new Set();
  
  constructor(integration: SeasonsStarsIntegration | null) {
    this.detectAvailableFeatures(integration);
  }
  
  private detectAvailableFeatures(integration: SeasonsStarsIntegration | null): void {
    if (!integration) {
      console.log('No S&S integration - all calendar features disabled');
      return;
    }
    
    // Check each feature individually
    this.checkFeature('date-conversion', () => integration.api.getCurrentDate());
    this.checkFeature('widget-buttons', () => integration.widgets.getPreferredWidget());
    this.checkFeature('time-advancement', () => integration.api.advanceDays);
    this.checkFeature('calendar-switching', () => integration.api.setActiveCalendar);
  }
  
  private checkFeature(featureName: string, testFunction: () => any): void {
    try {
      const result = testFunction();
      if (result !== undefined && result !== null) {
        this.enabledFeatures.add(featureName);
        console.log(`Feature '${featureName}' available`);
      }
    } catch (error) {
      console.warn(`Feature '${featureName}' not available:`, error.message);
    }
  }
  
  isFeatureEnabled(featureName: string): boolean {
    return this.enabledFeatures.has(featureName);
  }
  
  requireFeature(featureName: string): void {
    if (!this.isFeatureEnabled(featureName)) {
      throw new Error(`Required feature '${featureName}' is not available`);
    }
  }
}
```

### 3. User Communication Strategy
```typescript
class UserNotificationManager {
  private notificationQueue: Set<string> = new Set();
  
  notifyFeatureUnavailable(featureName: string, reason: string): void {
    const key = `feature-${featureName}`;
    if (this.notificationQueue.has(key)) return;
    
    this.notificationQueue.add(key);
    
    ui.notifications?.warn(
      `Calendar feature "${featureName}" unavailable: ${reason}. Some functionality may be limited.`,
      { permanent: false }
    );
    
    // Clear notification after 5 minutes
    setTimeout(() => this.notificationQueue.delete(key), 5 * 60 * 1000);
  }
  
  notifyFallbackMode(mode: string): void {
    const message = this.getFallbackModeMessage(mode);
    
    ui.notifications?.info(message, { permanent: false });
    
    console.log(`Bridge operating in ${mode} mode`);
  }
  
  private getFallbackModeMessage(mode: string): string {
    switch (mode) {
      case 'basic':
        return 'Calendar bridge using basic mode - some advanced features unavailable';
      case 'foundry':
        return 'Calendar bridge using Foundry time only - calendar features disabled';
      default:
        return `Calendar bridge operating in ${mode} mode`;
    }
  }
}
```

---

## Testing Error Conditions

### Unit Tests for Error Handling
```typescript
describe('Bridge Error Handling', () => {
  describe('Module Availability', () => {
    it('should handle missing S&S module gracefully', () => {
      // Mock missing module
      game.modules.get = jest.fn().mockReturnValue(null);
      
      const integration = SeasonsStarsIntegration.detect();
      expect(integration).toBeNull();
    });
    
    it('should handle inactive S&S module', () => {
      game.modules.get = jest.fn().mockReturnValue({ active: false });
      
      const integration = SeasonsStarsIntegration.detect();
      expect(integration).toBeNull();
    });
  });
  
  describe('API Failures', () => {
    it('should fallback on date conversion errors', () => {
      const mockIntegration = createMockIntegration();
      mockIntegration.api.worldTimeToDate = jest.fn().mockImplementation(() => {
        throw new Error('Conversion failed');
      });
      
      const converter = new SafeDateConverter(mockIntegration);
      const result = converter.worldTimeToDate(1234567890);
      
      expect(result).toBeDefined();
      expect(result.year).toBeGreaterThan(1970);
    });
    
    it('should handle widget button failures gracefully', () => {
      const mockIntegration = createMockIntegration();
      mockIntegration.widgets.getPreferredWidget = jest.fn().mockReturnValue(null);
      
      const widgetManager = new SafeWidgetManager(mockIntegration);
      
      expect(() => {
        widgetManager.addSidebarButton('test', 'fa-test', 'Test', () => {});
      }).not.toThrow();
    });
  });
});
```

This comprehensive error handling strategy ensures the bridge remains functional and user-friendly even when S&S is unavailable or experiencing issues.