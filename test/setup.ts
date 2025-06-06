/**
 * Test setup for Seasons & Stars
 */

// Mock Foundry globals
(globalThis as any).game = {
  settings: undefined,
  time: undefined,
  user: undefined,
  i18n: {
    lang: 'en',
  },
};

(globalThis as any).ui = {
  notifications: undefined,
};

(globalThis as any).Hooks = {
  once: () => {},
  on: () => 1,
  off: () => {},
  callAll: () => {},
};

// Mock Foundry application framework
(globalThis as any).foundry = {
  applications: {
    api: {
      ApplicationV2: class MockApplicationV2 {
        static DEFAULT_OPTIONS = {};
        static PARTS = {};
        constructor() {}
        render() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
      HandlebarsApplicationMixin: (base: any) =>
        class extends base {
          _prepareContext() {
            return {};
          }
          _onRender() {
            return Promise.resolve();
          }
        },
    },
  },
};

// Mock ApplicationV2 directly for imports
(globalThis as any).ApplicationV2 = (globalThis as any).foundry.applications.api.ApplicationV2;
