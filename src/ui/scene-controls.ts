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
    Hooks.on('getSceneControlButtons', (controls: any[]) => {
      // Find the token controls group to add our button
      const tokenControls = controls.find(c => c.name === 'token');
      
      if (tokenControls) {
        tokenControls.tools.push({
          name: 'seasons-stars-widget',
          title: 'SEASONS_STARS.calendar.current_date',
          icon: 'fas fa-calendar-alt',
          onClick: () => CalendarWidget.toggle(),
          toggle: true,
          active: false,
          button: true
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
      }
    });

    Logger.info('Macro functions registered');
  }
}