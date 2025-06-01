# Bridge Version Compatibility Plan

## Overview
Comprehensive version compatibility strategy for Seasons & Stars bridge integration, ensuring compatibility modules can work with multiple S&S versions while gracefully handling API changes and deprecated features.

---

## Version Compatibility Matrix

### S&S Version Roadmap
```typescript
interface VersionInfo {
  version: string;
  released: string;
  features: string[];
  breaking?: string[];
  deprecated?: string[];
}

const SS_VERSION_HISTORY: VersionInfo[] = [
  {
    version: '1.0.0',
    released: '2024-12-01',
    features: [
      'basic-calendar-api',
      'date-conversion',
      'foundry-time-sync'
    ]
  },
  {
    version: '1.1.0', 
    released: '2024-12-15',
    features: [
      'widget-system',
      'calendar-widget',
      'basic-hooks'
    ]
  },
  {
    version: '1.2.0',
    released: '2025-01-01', 
    features: [
      'mini-widget',
      'sidebar-buttons',
      'time-advancement',
      'enhanced-hooks'
    ]
  },
  {
    version: '1.3.0',
    released: '2025-01-15',
    features: [
      'multiple-calendars',
      'calendar-switching',
      'grid-widget',
      'advanced-positioning'
    ]
  },
  {
    version: '2.0.0',
    released: '2025-02-01',
    features: [
      'bridge-integration-interface',
      'feature-detection',
      'version-reporting'
    ],
    breaking: [
      'removed-simple-calendar-compatibility',
      'refactored-widget-api',
      'changed-hook-names'
    ],
    deprecated: [
      'direct-dom-manipulation',
      'legacy-api-methods'
    ]
  }
];
```

### Feature Compatibility Map
```typescript
interface FeatureRequirement {
  minVersion: string;
  maxVersion?: string;
  alternatives?: string[];
  fallback: 'required' | 'optional' | 'graceful';
}

const FEATURE_REQUIREMENTS: Record<string, FeatureRequirement> = {
  // Core API features
  'basic-api': {
    minVersion: '1.0.0',
    fallback: 'required'
  },
  'date-conversion': {
    minVersion: '1.0.0', 
    fallback: 'required'
  },
  
  // Widget features
  'widget-buttons': {
    minVersion: '1.2.0',
    alternatives: ['dom-manipulation'],
    fallback: 'graceful'
  },
  'mini-widget': {
    minVersion: '1.2.0',
    alternatives: ['main-widget'],
    fallback: 'optional'
  },
  'grid-widget': {
    minVersion: '1.3.0',
    alternatives: ['main-widget', 'mini-widget'],
    fallback: 'optional'
  },
  
  // Advanced features
  'time-advancement': {
    minVersion: '1.2.0',
    alternatives: ['foundry-time-advancement'],
    fallback: 'graceful'
  },
  'multiple-calendars': {
    minVersion: '1.3.0',
    alternatives: ['single-calendar'],
    fallback: 'optional'
  },
  
  // Version 2.0+ features
  'bridge-interface': {
    minVersion: '2.0.0',
    alternatives: ['legacy-integration'],
    fallback: 'graceful'
  }
};
```

---

## Version Detection System

### Semantic Version Parser
```typescript
class SemanticVersion {
  constructor(
    public major: number,
    public minor: number,
    public patch: number,
    public prerelease?: string,
    public build?: string
  ) {}
  
  static parse(versionString: string): SemanticVersion {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/;
    const match = versionString.match(regex);
    
    if (!match) {
      throw new Error(`Invalid semantic version: ${versionString}`);
    }
    
    return new SemanticVersion(
      parseInt(match[1]),
      parseInt(match[2]),
      parseInt(match[3]),
      match[4],
      match[5]
    );
  }
  
  toString(): string {
    let version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease) version += `-${this.prerelease}`;
    if (this.build) version += `+${this.build}`;
    return version;
  }
  
  compare(other: SemanticVersion): number {
    // Compare major.minor.patch
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    if (this.patch !== other.patch) return this.patch - other.patch;
    
    // Handle prerelease
    if (!this.prerelease && !other.prerelease) return 0;
    if (!this.prerelease && other.prerelease) return 1;
    if (this.prerelease && !other.prerelease) return -1;
    
    return this.prerelease!.localeCompare(other.prerelease!);
  }
  
  isCompatibleWith(requirement: string): boolean {
    return VersionCompatibility.checkCompatibility(this.toString(), requirement);
  }
}
```

### Version Compatibility Checker
```typescript
class VersionCompatibility {
  private static cache = new Map<string, boolean>();
  
  static checkCompatibility(currentVersion: string, requirement: string): boolean {
    const cacheKey = `${currentVersion}:${requirement}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const result = this.evaluateCompatibility(currentVersion, requirement);
    this.cache.set(cacheKey, result);
    return result;
  }
  
  private static evaluateCompatibility(currentVersion: string, requirement: string): boolean {
    const current = SemanticVersion.parse(currentVersion);
    
    // Handle different requirement formats
    if (requirement.startsWith('>=')) {
      const min = SemanticVersion.parse(requirement.slice(2));
      return current.compare(min) >= 0;
    }
    
    if (requirement.startsWith('>')) {
      const min = SemanticVersion.parse(requirement.slice(1));
      return current.compare(min) > 0;
    }
    
    if (requirement.startsWith('<=')) {
      const max = SemanticVersion.parse(requirement.slice(2));
      return current.compare(max) <= 0;
    }
    
    if (requirement.startsWith('<')) {
      const max = SemanticVersion.parse(requirement.slice(1));
      return current.compare(max) < 0;
    }
    
    if (requirement.startsWith('~')) {
      // Compatible within patch versions
      const target = SemanticVersion.parse(requirement.slice(1));
      return current.major === target.major && 
             current.minor === target.minor &&
             current.compare(target) >= 0;
    }
    
    if (requirement.startsWith('^')) {
      // Compatible within minor versions
      const target = SemanticVersion.parse(requirement.slice(1));
      return current.major === target.major &&
             current.compare(target) >= 0;
    }
    
    // Exact match
    const target = SemanticVersion.parse(requirement);
    return current.compare(target) === 0;
  }
}
```

### Multi-Version Support Strategy
```typescript
class VersionAdapter {
  private currentVersion: SemanticVersion;
  private featureSet: Set<string>;
  
  constructor(versionString: string) {
    this.currentVersion = SemanticVersion.parse(versionString);
    this.featureSet = this.detectFeatureSet();
  }
  
  private detectFeatureSet(): Set<string> {
    const features = new Set<string>();
    
    for (const [feature, requirement] of Object.entries(FEATURE_REQUIREMENTS)) {
      if (this.currentVersion.isCompatibleWith(`>=${requirement.minVersion}`)) {
        if (!requirement.maxVersion || 
            this.currentVersion.isCompatibleWith(`<=${requirement.maxVersion}`)) {
          features.add(feature);
        }
      }
    }
    
    return features;
  }
  
  hasFeature(feature: string): boolean {
    return this.featureSet.has(feature);
  }
  
  getAlternatives(feature: string): string[] {
    const requirement = FEATURE_REQUIREMENTS[feature];
    return requirement?.alternatives || [];
  }
  
  requireFeature(feature: string): void {
    if (!this.hasFeature(feature)) {
      const requirement = FEATURE_REQUIREMENTS[feature];
      if (requirement?.fallback === 'required') {
        throw new Error(
          `Required feature '${feature}' not available in S&S ${this.currentVersion}`
        );
      }
    }
  }
  
  canFallback(feature: string): boolean {
    const requirement = FEATURE_REQUIREMENTS[feature];
    return requirement?.fallback !== 'required';
  }
}
```

---

## Migration Strategies

### API Migration Patterns
```typescript
interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  changes: APIChange[];
}

interface APIChange {
  type: 'renamed' | 'moved' | 'removed' | 'parameterChanged';
  oldPath: string;
  newPath?: string;
  migration: (args: any[]) => any;
}

const MIGRATION_RULES: MigrationRule[] = [
  {
    fromVersion: '1.x',
    toVersion: '2.0.0',
    changes: [
      {
        type: 'moved',
        oldPath: 'game.seasonsStars.api.getCurrentDate',
        newPath: 'game.seasonsStars.integration.api.getCurrentDate',
        migration: (args) => args // No parameter changes
      },
      {
        type: 'renamed',
        oldPath: 'seasons-stars:timeChanged',
        newPath: 'seasons-stars:dateChanged',
        migration: (args) => args
      },
      {
        type: 'parameterChanged',
        oldPath: 'addSidebarButton',
        migration: (args) => {
          // V1: (name, icon, callback)
          // V2: (name, icon, tooltip, callback)
          if (args.length === 3) {
            return [args[0], args[1], args[0], args[2]]; // Use name as tooltip
          }
          return args;
        }
      }
    ]
  }
];

class APIMigrator {
  private version: SemanticVersion;
  
  constructor(versionString: string) {
    this.version = SemanticVersion.parse(versionString);
  }
  
  migrateAPICall(apiPath: string, args: any[]): any {
    const applicableRules = MIGRATION_RULES.filter(rule => 
      this.version.isCompatibleWith(rule.fromVersion)
    );
    
    for (const rule of applicableRules) {
      for (const change of rule.changes) {
        if (change.oldPath === apiPath) {
          return change.migration(args);
        }
      }
    }
    
    return args;
  }
}
```

### Backward Compatibility Layer
```typescript
class BackwardCompatibilityLayer {
  private integration: SeasonsStarsIntegration;
  private version: SemanticVersion;
  
  constructor(integration: SeasonsStarsIntegration) {
    this.integration = integration;
    this.version = SemanticVersion.parse(integration.version);
  }
  
  // Provide unified API that works across versions
  async getCurrentDate(calendarId?: string): Promise<CalendarDate> {
    if (this.version.major >= 2) {
      // Use new integration interface
      return this.integration.api.getCurrentDate(calendarId);
    } else if (this.version.minor >= 1) {
      // Use legacy API with adaptation
      return game.seasonsStars.api.getCurrentDate();
    } else {
      // Fallback to basic implementation
      return this.createBasicDate();
    }
  }
  
  async addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): Promise<void> {
    if (this.version.compare(SemanticVersion.parse('1.2.0')) >= 0) {
      // Use widget API
      const widget = await this.getPreferredWidget();
      if (widget?.addSidebarButton) {
        widget.addSidebarButton(name, icon, tooltip, callback);
        return;
      }
    }
    
    // Fallback to DOM manipulation
    this.addButtonViaDom(name, icon, tooltip, callback);
  }
  
  private async getPreferredWidget(): Promise<any> {
    if (this.version.major >= 2) {
      return this.integration.widgets.getPreferredWidget();
    } else {
      // Manual widget detection for older versions
      return this.detectWidgetManually();
    }
  }
  
  private detectWidgetManually(): any {
    // Look for known widget classes in DOM
    const widgetSelectors = [
      '.calendar-mini-widget',
      '.calendar-widget',
      '.seasons-stars-widget'
    ];
    
    for (const selector of widgetSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.wrapElementAsWidget(element);
      }
    }
    
    return null;
  }
}
```

---

## Version-Specific Feature Detection

### Dynamic Feature Probing
```typescript
class FeatureProbe {
  private static probeCache = new Map<string, boolean>();
  
  static async probeFeature(featureName: string, probeFunction: () => Promise<boolean>): Promise<boolean> {
    if (this.probeCache.has(featureName)) {
      return this.probeCache.get(featureName)!;
    }
    
    try {
      const result = await probeFunction();
      this.probeCache.set(featureName, result);
      return result;
    } catch (error) {
      console.debug(`Feature probe failed for '${featureName}':`, error);
      this.probeCache.set(featureName, false);
      return false;
    }
  }
  
  static async probeWidgetButtons(): Promise<boolean> {
    return this.probeFeature('widget-buttons', async () => {
      const widget = game.seasonsStars?.widgets?.main || 
                    CalendarWidget?.getInstance?.();
      
      return typeof widget?.addSidebarButton === 'function';
    });
  }
  
  static async probeTimeAdvancement(): Promise<boolean> {
    return this.probeFeature('time-advancement', async () => {
      const api = game.seasonsStars?.api || game.seasonsStars?.integration?.api;
      return typeof api?.advanceDays === 'function';
    });
  }
  
  static async probeMultipleCalendars(): Promise<boolean> {
    return this.probeFeature('multiple-calendars', async () => {
      const api = game.seasonsStars?.api || game.seasonsStars?.integration?.api;
      
      if (typeof api?.getAvailableCalendars !== 'function') {
        return false;
      }
      
      const calendars = api.getAvailableCalendars();
      return Array.isArray(calendars) && calendars.length > 1;
    });
  }
  
  static clearCache(): void {
    this.probeCache.clear();
  }
}
```

### Runtime Version Adaptation
```typescript
class RuntimeAdapter {
  private compatLayer: BackwardCompatibilityLayer;
  private featureFlags: Map<string, boolean> = new Map();
  
  constructor(integration: SeasonsStarsIntegration) {
    this.compatLayer = new BackwardCompatibilityLayer(integration);
    this.initializeFeatureFlags();
  }
  
  private async initializeFeatureFlags(): Promise<void> {
    // Probe features at runtime
    this.featureFlags.set('widget-buttons', await FeatureProbe.probeWidgetButtons());
    this.featureFlags.set('time-advancement', await FeatureProbe.probeTimeAdvancement());
    this.featureFlags.set('multiple-calendars', await FeatureProbe.probeMultipleCalendars());
    
    console.log('S&S feature flags:', Object.fromEntries(this.featureFlags));
  }
  
  isFeatureAvailable(feature: string): boolean {
    return this.featureFlags.get(feature) ?? false;
  }
  
  async executeWithFallback<T>(
    primaryAction: () => Promise<T>,
    fallbackAction: () => Promise<T>,
    featureRequired?: string
  ): Promise<T> {
    if (featureRequired && !this.isFeatureAvailable(featureRequired)) {
      return fallbackAction();
    }
    
    try {
      return await primaryAction();
    } catch (error) {
      console.warn('Primary action failed, using fallback:', error);
      return fallbackAction();
    }
  }
}
```

---

## Version Compatibility Testing

### Test Matrix
```typescript
interface VersionTestCase {
  version: string;
  features: string[];
  expectedBehavior: 'full' | 'limited' | 'fallback';
  criticalFeatures: string[];
}

const VERSION_TEST_MATRIX: VersionTestCase[] = [
  {
    version: '1.0.0',
    features: ['basic-api'],
    expectedBehavior: 'limited',
    criticalFeatures: ['basic-api']
  },
  {
    version: '1.1.0',
    features: ['basic-api', 'widget-system'],
    expectedBehavior: 'limited',
    criticalFeatures: ['basic-api']
  },
  {
    version: '1.2.0',
    features: ['basic-api', 'widget-system', 'sidebar-buttons', 'mini-widget'],
    expectedBehavior: 'full',
    criticalFeatures: ['basic-api', 'sidebar-buttons']
  },
  {
    version: '2.0.0',
    features: ['bridge-interface', 'feature-detection', 'all-widgets'],
    expectedBehavior: 'full',
    criticalFeatures: ['bridge-interface']
  }
];

describe('Version Compatibility', () => {
  VERSION_TEST_MATRIX.forEach(testCase => {
    describe(`S&S v${testCase.version}`, () => {
      beforeEach(() => {
        mockSeasonsStarsVersion(testCase.version, testCase.features);
      });
      
      it('should detect version correctly', () => {
        const integration = SeasonsStarsIntegration.detect();
        expect(integration?.version).toBe(testCase.version);
      });
      
      it('should have critical features available', async () => {
        const adapter = new RuntimeAdapter(integration);
        
        for (const feature of testCase.criticalFeatures) {
          expect(adapter.isFeatureAvailable(feature)).toBe(true);
        }
      });
      
      it('should handle missing features gracefully', async () => {
        const adapter = new RuntimeAdapter(integration);
        
        // Test feature that's not in this version
        const futureFeature = 'non-existent-feature';
        expect(adapter.isFeatureAvailable(futureFeature)).toBe(false);
        
        // Should not throw when using fallback
        await expect(
          adapter.executeWithFallback(
            () => { throw new Error('Not supported'); },
            () => Promise.resolve('fallback'),
            futureFeature
          )
        ).resolves.toBe('fallback');
      });
    });
  });
});
```

This comprehensive version compatibility plan ensures bridges can work reliably across multiple S&S versions while providing clear upgrade paths and fallback strategies.