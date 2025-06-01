/**
 * Essential Foundry VTT v13 Type Definitions
 * 
 * This file provides minimal but complete type definitions for Foundry VTT v13
 * to replace the broken official fvtt-types package until it's stable.
 * 
 * Only includes types actually used by Seasons & Stars module.
 */

// =============================================================================
// GLOBAL FOUNDRY OBJECTS
// =============================================================================

declare global {
  const game: Game;
  const ui: UI;
  const Hooks: typeof HooksManager;
  const CONFIG: Config;
  const canvas: Canvas;
  const renderTemplate: (path: string, data?: any) => Promise<string>;
  
  // jQuery globals provided by @types/jquery
}

// =============================================================================
// CORE FOUNDRY VTT INTERFACES
// =============================================================================

interface Game {
  time: GameTime;
  i18n: Localization;
  settings: ClientSettings;
  modules: Map<string, Module>;
  user?: User;
  users: Collection<User>;
  journal: Collection<JournalEntry>;
  
  // Season & Stars specific integration point
  seasonsStars?: {
    manager?: any;
    notes?: any;
    integration?: any;
  };
}

interface GameTime {
  worldTime: number;
  advance(seconds: number): Promise<void>;
}

interface Localization {
  lang: string;
  localize(key: string, data?: Record<string, unknown>): string;
  format(key: string, data?: Record<string, unknown>): string;
}

interface ClientSettings {
  get(module: string, setting: string): any;
  set(module: string, setting: string, value: any): Promise<any>;
  register(module: string, setting: string, config: any): void;
}

interface User {
  id: string;
  name: string;
  isGM: boolean;
}

interface JournalEntry {
  id: string;
  name: string;
  pages: Collection<JournalEntryPage>;
  ownership: Record<string, number>;
  flags: Record<string, any>;
  author?: User;
  
  static create(data: any): Promise<JournalEntry>;
  update(data: any): Promise<JournalEntry>;
  delete(): Promise<void>;
  createEmbeddedDocuments(type: string, data: any[]): Promise<any[]>;
  setFlag(scope: string, key: string, value: any): Promise<void>;
  getFlag(scope: string, key: string): any;
}

interface JournalEntryPage {
  id: string;
  name: string;
  type: string;
  text?: {
    content: string;
  };
}

interface Module {
  id: string;
  title: string;
  active: boolean;
  version?: string;
}

interface UI {
  notifications: Notifications;
}

interface Notifications {
  notify(message: string, type?: 'info' | 'warning' | 'error'): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

interface Canvas {
  ready: boolean;
}

interface Config {
  debug: {
    hooks: boolean;
  };
}

// =============================================================================
// HOOKS SYSTEM
// =============================================================================

declare class HooksManager {
  static on(hook: string, callback: Function): number;
  static once(hook: string, callback: Function): number;
  static off(hook: string, id: number): void;
  static call(hook: string, ...args: any[]): boolean;
  static callAll(hook: string, ...args: any[]): void;
}

// =============================================================================
// APPLICATION V2 FRAMEWORK
// =============================================================================

/**
 * ApplicationV2 base class for Foundry v13
 * Provides essential methods used by Calendar widgets
 */
declare class ApplicationV2<RenderContext = Record<string, unknown>, Configuration = ApplicationV2.Configuration, RenderOptions = ApplicationV2.RenderOptions> {
  constructor(options?: Partial<Configuration>);
  
  // Core lifecycle methods
  render(force?: boolean, options?: Partial<RenderOptions>): Promise<this>;
  close(options?: ApplicationV2.CloseOptions): Promise<this>;
  
  // Element and DOM access
  readonly element: HTMLElement | null;
  readonly window: ApplicationV2.ApplicationWindow | null;
  
  // Position management
  setPosition(position?: Partial<ApplicationV2.Position>): void;
  
  // Tab management (for tabbed applications)
  changeTab(tab: string, group?: string): void;
  
  // Static configuration
  static DEFAULT_OPTIONS: ApplicationV2.Configuration;
  static PARTS: Record<string, ApplicationV2.ApplicationPart>;
  
  // Protected methods that subclasses implement
  protected _prepareContext(options: RenderOptions): Promise<RenderContext>;
  protected _onRender(context: RenderContext, options: RenderOptions): Promise<void>;
  protected _attachPartListeners(partId: string, htmlElement: HTMLElement, options: RenderOptions): void;
  protected _onClose(options: ApplicationV2.CloseOptions): Promise<void>;
}

namespace ApplicationV2 {
  interface Configuration {
    id?: string;
    classes?: string[];
    tag?: string;
    window?: {
      title?: string;
      icon?: string;
      positioned?: boolean;
      minimizable?: boolean;
      resizable?: boolean;
    };
    position?: Partial<Position>;
    actions?: Record<string, ApplicationAction>;
  }
  
  interface Position {
    top: number;
    left: number;
    width: number | 'auto';
    height: number | 'auto';
    scale: number;
  }
  
  interface RenderOptions {
    force?: boolean;
    position?: Partial<Position>;
    window?: Partial<ApplicationWindow>;
    parts?: string[];
  }
  
  interface CloseOptions {
    animate?: boolean;
  }
  
  interface ApplicationWindow {
    title: string;
    icon: string;
    controls: ApplicationHeaderButton[];
  }
  
  interface ApplicationHeaderButton {
    icon: string;
    label: string;
    action: string;
  }
  
  interface ApplicationPart {
    id: string;
    template: string;
    classes?: string[];
    scrollable?: string[];
  }
  
  interface ApplicationAction {
    handler: Function;
    buttons?: number[];
  }
}

// =============================================================================
// HANDLEBARS APPLICATION MIXIN
// =============================================================================

/**
 * Mixin for ApplicationV2 that provides Handlebars template support
 */
declare class HandlebarsApplicationMixin {
  // Template rendering
  protected _renderHTML(context: any, options: any): Promise<Record<string, string>>;
  
  // Template utilities
  protected _replaceHTML(result: Record<string, string>, content: HTMLElement, options: any): void;
}

// =============================================================================
// DIALOG SYSTEM (For Calendar Selection Dialog)
// =============================================================================

declare class DialogV2<Configuration = DialogV2.Configuration, RenderContext = Record<string, unknown>> extends ApplicationV2<RenderContext, Configuration> {
  constructor(options?: Partial<Configuration>);
  
  static wait<T = any>(config: DialogV2.WaitOptions<T>): Promise<T | null>;
  static confirm(options: DialogV2.ConfirmOptions): Promise<boolean>;
  static prompt(options: DialogV2.PromptOptions): Promise<string | null>;
}

namespace DialogV2 {
  interface Configuration extends ApplicationV2.Configuration {
    content?: string;
    buttons?: DialogButton[];
    modal?: boolean;
    rejectClose?: boolean;
  }
  
  interface DialogButton {
    action: string;
    label: string;
    icon?: string;
    default?: boolean;
    callback?: Function;
  }
  
  interface WaitOptions<T> {
    title?: string;
    content?: string;
    buttons?: DialogButton[];
    modal?: boolean;
    default?: string;
    rejectClose?: boolean;
    render?: Function;
    close?: Function;
  }
  
  interface ConfirmOptions {
    title?: string;
    content?: string;
    yes?: Function;
    no?: Function;
    modal?: boolean;
    rejectClose?: boolean;
  }
  
  interface PromptOptions {
    title?: string;
    content?: string;
    label?: string;
    default?: string;
    callback?: Function;
    modal?: boolean;
    rejectClose?: boolean;
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Collection utility class used by Foundry
 */
declare class Collection<T> extends Map<string, T> {
  get(key: string): T | undefined;
  set(key: string, value: T): this;
  find(predicate: (value: T) => boolean): T | undefined;
  filter(predicate: (value: T) => boolean): T[];
  map<U>(transform: (value: T) => U): U[];
}

// =============================================================================
// FOUNDRY CONSTANTS
// =============================================================================

declare global {
  const CONST: {
    DOCUMENT_OWNERSHIP_LEVELS: {
      NONE: 0;
      LIMITED: 1;
      OBSERVER: 2;
      OWNER: 3;
    };
  };
}

// =============================================================================
// MODULE DECLARATION
// =============================================================================

export {};