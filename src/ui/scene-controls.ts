/**
 * Scene controls integration for Seasons & Stars
 */

import { CalendarWidget } from './calendar-widget';
import { CalendarMiniWidget } from './calendar-mini-widget';
import { Logger } from '../core/logger';

export class SeasonsStarsSceneControls {
  /**
   * Register scene controls
   */
  static registerControls(): void {
    Logger.info('SeasonsStarsSceneControls.registerControls() called - registering getSceneControlButtons hook');
    
    Hooks.on('getSceneControlButtons', (controls: Record<string, any>) => {
      Logger.debug('getSceneControlButtons hook fired', {
        userExists: !!game.user,
        isGM: game.user?.isGM,
        controlsType: typeof controls,
        controlsKeys: Object.keys(controls),
        notesExists: !!controls.notes,
        notesToolsExists: !!controls.notes?.tools,
        notesToolsType: typeof controls.notes?.tools,
        notesToolsKeys: controls.notes?.tools ? Object.keys(controls.notes.tools) : null
      });

      if (!game.user?.isGM) {
        Logger.debug('User is not GM, skipping scene control registration');
        return;
      }

      // Access notes controls directly (controls is an object, not array)
      if (controls.notes?.tools) {
        Logger.debug('Adding S&S scene control to notes.tools');
        
        // Use SmallTime's pattern of direct property assignment
        controls.notes.tools['seasons-stars-widget'] = {
          name: 'seasons-stars-widget',
          title: 'SEASONS_STARS.calendar.current_date',
          icon: 'fas fa-calendar-alt',
          onChange: () => CalendarWidget.toggle(),
          //toggle: true,
          //active: false,
          button: true,
        };
        
        Logger.debug('Added S&S scene control button, updated tools:', Object.keys(controls.notes.tools));
      } else {
        Logger.warn('Notes controls not available for scene button', {
          notesExists: !!controls.notes,
          notesToolsExists: !!controls.notes?.tools,
          fullControlsStructure: controls
        });
      }
    });

    // Update button state when widget is shown/hidden
    Hooks.on('renderApplication', (app: any) => {
      if (app instanceof CalendarWidget) {
        SeasonsStarsSceneControls.updateControlState(true);
      }
    });

    Hooks.on('closeApplication', (app: any) => {
      if (app instanceof CalendarWidget) {
        SeasonsStarsSceneControls.updateControlState(false);
      }
    });
  }

  /**
   * Update the control button state
   */
  private static updateControlState(active: boolean): void {
    // Look for our tool button in the scene controls
    const control = document.querySelector('[data-tool="seasons-stars-widget"]');
    if (control) {
      control.classList.toggle('active', active);
    }
  }

  /**
   * Add macro support for calendar widget
   */
  static registerMacros(): void {
    // Extend the existing SeasonsStars object with macro functions
    if (!(window as any).SeasonsStars) {
      (window as any).SeasonsStars = {};
    }

    // Add macro functions to the existing object
    Object.assign((window as any).SeasonsStars, {
      // Widget controls
      showWidget: () => CalendarWidget.show(),
      hideWidget: () => CalendarWidget.hide(),
      toggleWidget: () => CalendarWidget.toggle(),
      showMiniWidget: () => CalendarMiniWidget.show(),
      hideMiniWidget: () => CalendarMiniWidget.hide(),
      toggleMiniWidget: () => CalendarMiniWidget.toggle(),
      positionMiniAboveSmallTime: () => CalendarMiniWidget.positionAboveSmallTime(),
      positionMiniBelowSmallTime: () => CalendarMiniWidget.positionBelowSmallTime(),
      positionMiniBesideSmallTime: () => CalendarMiniWidget.positionBesideSmallTime(),

      // Time advancement functions for macros
      advanceMinutes: async (minutes: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceMinutes(minutes);
      },
      advanceHours: async (hours: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceHours(hours);
      },
      advanceDays: async (days: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceDays(days);
      },
      advanceWeeks: async (weeks: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceWeeks(weeks);
      },
      advanceMonths: async (months: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceMonths(months);
      },
      advanceYears: async (years: number) => {
        const manager = game.seasonsStars?.manager;
        if (manager) await manager.advanceYears(years);
      },
    });

    Logger.info('Macro functions registered');
  }
}
