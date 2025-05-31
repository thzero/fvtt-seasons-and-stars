/**
 * Calendar Widget - Compact date/time display for Seasons & Stars
 */

import { CalendarLocalization } from '../core/calendar-localization';
import { CalendarSelectionDialog } from './calendar-selection-dialog';
import type { CalendarDate as ICalendarDate } from '../types/calendar';

export class CalendarWidget extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  private updateInterval: number | null = null;
  private static activeInstance: CalendarWidget | null = null;

  static DEFAULT_OPTIONS = {
    id: 'seasons-stars-widget',
    classes: ['seasons-stars', 'calendar-widget'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'SEASONS_STARS.calendar.current_date',
      icon: 'fa-solid fa-calendar-alt',
      minimizable: false,
      resizable: false
    },
    position: {
      width: 280,
      height: 'auto'
    },
    actions: {
      openCalendarSelection: CalendarWidget.prototype._onOpenCalendarSelection,
      openDetailedView: CalendarWidget.prototype._onOpenDetailedView,
      advanceDate: CalendarWidget.prototype._onAdvanceDate,
      openBulkAdvance: CalendarWidget.prototype._onOpenBulkAdvance
    }
  };

  static PARTS = {
    main: {
      template: 'modules/seasons-and-stars/templates/calendar-widget.hbs'
    }
  };

  /**
   * Prepare rendering context for template
   */
  async _prepareContext(options = {}): Promise<any> {
    const context = await super._prepareContext(options);
    
    const manager = game.seasonsStars?.manager;
    
    if (!manager) {
      return Object.assign(context, {
        error: 'Calendar manager not initialized',
        calendar: null,
        currentDate: null,
        formattedDate: 'Not Available'
      });
    }

    const activeCalendar = manager.getActiveCalendar();
    const currentDate = manager.getCurrentDate();
    
    if (!activeCalendar || !currentDate) {
      return Object.assign(context, {
        error: 'No active calendar',
        calendar: null,
        currentDate: null,
        formattedDate: 'No Calendar Active'
      });
    }

    const calendarInfo = CalendarLocalization.getLocalizedCalendarInfo(activeCalendar);
    
    // Check if SmallTime is available and active
    const hasSmallTime = this.detectSmallTime();
    
    return Object.assign(context, {
      calendar: calendarInfo,
      currentDate: currentDate.toObject(),
      formattedDate: currentDate.toLongString(),
      shortDate: currentDate.toDateString(),
      timeString: currentDate.toTimeString(),
      isGM: game.user?.isGM || false,
      canAdvanceTime: game.user?.isGM || false,
      hasSmallTime: hasSmallTime,
      showTimeControls: !hasSmallTime // Only show time controls if SmallTime is not available
    });
  }


  /**
   * Attach event listeners to rendered parts
   */
  _attachPartListeners(partId: string, htmlElement: HTMLElement, options: any): void {
    super._attachPartListeners(partId, htmlElement, options);

    // Register this as the active instance
    CalendarWidget.activeInstance = this;
    
    // Start auto-update after rendering
    this.startAutoUpdate();
  }

  /**
   * Instance action handler for opening calendar selection dialog
   */
  async _onOpenCalendarSelection(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    CalendarSelectionDialog.show();
  }

  /**
   * Instance action handler for opening detailed view dialog
   */
  async _onOpenDetailedView(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    // TODO: Open detailed calendar view
    console.log('Seasons & Stars | Opening detailed view (TODO)');
    ui.notifications?.info('Detailed calendar view coming soon!');
  }

  /**
   * Instance action handler for date advancement
   */
  async _onAdvanceDate(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const amount = parseInt(target.dataset.amount || '0');
    const unit = target.dataset.unit || 'days';
    
    const manager = game.seasonsStars?.manager;
    if (!manager) return;

    console.log(`Seasons & Stars | Advancing date: ${amount} ${unit}`);

    try {
      switch (unit) {
        case 'minutes':
          await manager.advanceMinutes(amount);
          break;
        case 'hours':
          await manager.advanceHours(amount);
          break;
        case 'days':
          await manager.advanceDays(amount);
          break;
        case 'weeks':
          await manager.advanceWeeks(amount);
          break;
        case 'months':
          await manager.advanceMonths(amount);
          break;
        case 'years':
          await manager.advanceYears(amount);
          break;
        default:
          console.warn(`Unknown date unit: ${unit}`);
          return;
      }

      // Show success notification for larger advances
      if ((unit === 'weeks' && amount >= 2) || 
          (unit === 'months' && amount >= 1) || 
          (unit === 'years' && amount >= 1)) {
        ui.notifications?.info(`Advanced time by ${amount} ${unit}`);
      }
      
    } catch (error) {
      console.error('Seasons & Stars | Error advancing date:', error);
      ui.notifications?.error('Failed to advance date');
    }
  }

  /**
   * Instance action handler for opening bulk advance dialog
   */
  async _onOpenBulkAdvance(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    // Show placeholder for now - will implement proper dialog later
    ui.notifications?.info('Bulk time advancement coming soon!');
  }

  /**
   * Detect if SmallTime module is available and active
   */
  private detectSmallTime(): boolean {
    // Check if SmallTime module is installed and enabled
    const smallTimeModule = game.modules?.get('smalltime');
    if (!smallTimeModule?.active) {
      return false;
    }

    // Check if SmallTime UI elements are present in the DOM
    const selectors = [
      '#smalltime-app',
      '.smalltime-app', 
      '#timeDisplay',
      '#slideContainer',
      '[id*="smalltime"]',
      '.form:has(#timeDisplay)'
    ];

    for (const selector of selectors) {
      try {
        if (document.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    return false;
  }

  /**
   * Start automatic updates
   */
  private startAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update every 30 seconds
    this.updateInterval = window.setInterval(() => {
      if (this.rendered) {
        this.render();
      }
    }, 30000);
  }

  /**
   * Stop automatic updates
   */
  private stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Handle closing the widget
   */
  async close(options: any = {}): Promise<void> {
    this.stopAutoUpdate();
    
    // Clear active instance if this is it
    if (CalendarWidget.activeInstance === this) {
      CalendarWidget.activeInstance = null;
    }
    
    return super.close(options);
  }

  /**
   * Handle Foundry hooks for real-time updates
   */
  static registerHooks(): void {
    // Update widget when time changes
    Hooks.on('seasons-stars:dateChanged', () => {
      if (CalendarWidget.activeInstance?.rendered) {
        CalendarWidget.activeInstance.render();
      }
    });

    // Update widget when calendar changes
    Hooks.on('seasons-stars:calendarChanged', () => {
      if (CalendarWidget.activeInstance?.rendered) {
        CalendarWidget.activeInstance.render();
      }
    });
  }

  /**
   * Toggle widget visibility
   */
  static toggle(): void {
    if (CalendarWidget.activeInstance) {
      if (CalendarWidget.activeInstance.rendered) {
        CalendarWidget.activeInstance.close();
      } else {
        CalendarWidget.activeInstance.render(true);
      }
    } else {
      new CalendarWidget().render(true);
    }
  }

  /**
   * Show the widget
   */
  static show(): void {
    if (CalendarWidget.activeInstance) {
      if (!CalendarWidget.activeInstance.rendered) {
        CalendarWidget.activeInstance.render(true);
      }
    } else {
      new CalendarWidget().render(true);
    }
  }

  /**
   * Hide the widget
   */
  static hide(): void {
    if (CalendarWidget.activeInstance?.rendered) {
      CalendarWidget.activeInstance.close();
    }
  }
}