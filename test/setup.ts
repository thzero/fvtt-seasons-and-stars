/**
 * Test setup for Seasons & Stars
 */

// Mock Foundry globals
(globalThis as any).game = {
  settings: undefined,
  time: undefined,
  user: undefined,
  i18n: {
    lang: 'en'
  }
};

(globalThis as any).ui = {
  notifications: undefined
};

(globalThis as any).Hooks = {
  once: () => {},
  on: () => 1,
  off: () => {},
  callAll: () => {}
};