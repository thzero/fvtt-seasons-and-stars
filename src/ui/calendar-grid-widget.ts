/**
 * Calendar Grid Widget - Monthly calendar view for Seasons & Stars
 */

import { CalendarLocalization } from '../core/calendar-localization';
import type { CalendarDate as ICalendarDate } from '../types/calendar';

export class CalendarGridWidget extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  private viewDate: ICalendarDate;
  private static activeInstance: CalendarGridWidget | null = null;

  constructor(initialDate?: ICalendarDate) {
    super();
    
    // Use provided date or current date
    const manager = game.seasonsStars?.manager;
    this.viewDate = initialDate || manager?.getCurrentDate() || {
      year: 2024,
      month: 1,
      day: 1,
      weekday: 0,
      time: { hour: 0, minute: 0, second: 0 }
    };
  }

  static DEFAULT_OPTIONS = {
    id: 'seasons-stars-grid-widget',
    classes: ['seasons-stars', 'calendar-grid-widget'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'SEASONS_STARS.calendar.monthly_view',
      icon: 'fa-solid fa-calendar',
      minimizable: false,
      resizable: false
    },
    position: {
      width: 400,
      height: 'auto'
    },
    actions: {
      previousMonth: CalendarGridWidget.prototype._onPreviousMonth,
      nextMonth: CalendarGridWidget.prototype._onNextMonth,
      previousYear: CalendarGridWidget.prototype._onPreviousYear,
      nextYear: CalendarGridWidget.prototype._onNextYear,
      selectDate: CalendarGridWidget.prototype._onSelectDate,
      goToToday: CalendarGridWidget.prototype._onGoToToday,
      setYear: CalendarGridWidget.prototype._onSetYear
    }
  };

  static PARTS = {
    main: {
      template: 'modules/seasons-and-stars/templates/calendar-grid-widget.hbs'
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
        error: 'Calendar manager not initialized'
      });
    }

    const activeCalendar = manager.getActiveCalendar();
    const currentDate = manager.getCurrentDate();
    
    if (!activeCalendar || !currentDate) {
      return Object.assign(context, {
        error: 'No active calendar'
      });
    }

    const calendarInfo = CalendarLocalization.getLocalizedCalendarInfo(activeCalendar);
    const monthData = this.generateMonthData(activeCalendar, this.viewDate, currentDate);
    
    return Object.assign(context, {
      calendar: calendarInfo,
      viewDate: this.viewDate,
      currentDate: currentDate.toObject(),
      monthData: monthData,
      monthName: activeCalendar.months[this.viewDate.month - 1]?.name || 'Unknown',
      monthDescription: activeCalendar.months[this.viewDate.month - 1]?.description,
      yearDisplay: `${activeCalendar.year?.prefix || ''}${this.viewDate.year}${activeCalendar.year?.suffix || ''}`,
      isGM: game.user?.isGM || false,
      weekdays: activeCalendar.weekdays.map(wd => ({
        name: wd.name,
        abbreviation: wd.abbreviation,
        description: wd.description
      }))
    });
  }

  /**
   * Generate calendar month data with day grid
   */
  private generateMonthData(calendar: any, viewDate: ICalendarDate, currentDate: ICalendarDate) {
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return { weeks: [], totalDays: 0 };

    // Get month information
    const monthInfo = calendar.months[viewDate.month - 1];
    if (!monthInfo) return { weeks: [], totalDays: 0 };

    // Calculate month length (considering leap years)
    const monthLength = engine.getMonthLength(viewDate.month, viewDate.year);
    
    // Find the first day of the month and its weekday
    const firstDay: ICalendarDate = {
      year: viewDate.year,
      month: viewDate.month,
      day: 1,
      weekday: engine.calculateWeekday(viewDate.year, viewDate.month, 1),
      time: { hour: 0, minute: 0, second: 0 }
    };

    // Build calendar grid
    const weeks: Array<Array<any>> = [];
    let currentWeek: Array<any> = [];
    
    // Fill in empty cells before month starts
    const startWeekday = firstDay.weekday || 0;
    for (let i = 0; i < startWeekday; i++) {
      currentWeek.push({ isEmpty: true });
    }

    // Fill in the days of the month
    for (let day = 1; day <= monthLength; day++) {
      const dayDate: ICalendarDate = {
        year: viewDate.year,
        month: viewDate.month,
        day: day,
        weekday: engine.calculateWeekday(viewDate.year, viewDate.month, day),
        time: { hour: 0, minute: 0, second: 0 }
      };

      const isToday = this.isSameDate(dayDate, currentDate);
      const isViewDate = this.isSameDate(dayDate, viewDate);

      currentWeek.push({
        day: day,
        date: dayDate,
        isToday: isToday,
        isSelected: isViewDate,
        isClickable: game.user?.isGM || false,
        weekday: dayDate.weekday,
        fullDate: `${viewDate.year}-${viewDate.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });

      // Start new week on last day of week
      if (currentWeek.length === calendar.weekdays.length) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in empty cells after month ends
    if (currentWeek.length > 0) {
      while (currentWeek.length < calendar.weekdays.length) {
        currentWeek.push({ isEmpty: true });
      }
      weeks.push(currentWeek);
    }

    return {
      weeks: weeks,
      totalDays: monthLength,
      monthName: monthInfo.name,
      monthDescription: monthInfo.description
    };
  }

  /**
   * Check if two dates are the same (ignoring time)
   */
  private isSameDate(date1: ICalendarDate, date2: ICalendarDate): boolean {
    return date1.year === date2.year && 
           date1.month === date2.month && 
           date1.day === date2.day;
  }

  /**
   * Navigate to previous month
   */
  async _onPreviousMonth(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return;

    this.viewDate = engine.addMonths(this.viewDate, -1);
    this.render();
  }

  /**
   * Navigate to next month
   */
  async _onNextMonth(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return;

    this.viewDate = engine.addMonths(this.viewDate, 1);
    this.render();
  }

  /**
   * Navigate to previous year
   */
  async _onPreviousYear(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return;

    this.viewDate = engine.addYears(this.viewDate, -1);
    this.render();
  }

  /**
   * Navigate to next year
   */
  async _onNextYear(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return;

    this.viewDate = engine.addYears(this.viewDate, 1);
    this.render();
  }

  /**
   * Select a specific date (GM only - sets world time)
   */
  async _onSelectDate(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    if (!game.user?.isGM) {
      ui.notifications?.warn('Only GMs can change the current date');
      return;
    }

    const day = parseInt(target.dataset.day || '0');
    if (day < 1) return;

    const manager = game.seasonsStars?.manager;
    const engine = manager?.getActiveEngine();
    if (!manager || !engine) return;

    try {
      // Create target date maintaining current time
      const currentDate = manager.getCurrentDate();
      const targetDate: ICalendarDate = {
        year: this.viewDate.year,
        month: this.viewDate.month,
        day: day,
        weekday: engine.calculateWeekday(this.viewDate.year, this.viewDate.month, day),
        time: currentDate.time || { hour: 0, minute: 0, second: 0 }
      };

      // Set the target date
      await manager.setCurrentDate(targetDate);

      ui.notifications?.info(`Date set to ${targetDate.year}-${targetDate.month.toString().padStart(2, '0')}-${targetDate.day.toString().padStart(2, '0')}`);
      
      // Update view date to selected date
      this.viewDate = targetDate;
      this.render();
      
    } catch (error) {
      console.error('Failed to set date:', error);
      ui.notifications?.error('Failed to set date');
    }
  }

  /**
   * Go to current date
   */
  async _onGoToToday(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const manager = game.seasonsStars?.manager;
    if (!manager) return;

    const currentDate = manager.getCurrentDate();
    this.viewDate = { ...currentDate };
    this.render();
  }

  /**
   * Set year via input dialog
   */
  async _onSetYear(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const engine = game.seasonsStars?.manager?.getActiveEngine();
    if (!engine) return;

    // Create a simple input dialog
    const currentYear = this.viewDate.year;
    const newYear = await new Promise<number | null>((resolve) => {
      new Dialog({
        title: "Set Year",
        content: `
          <form>
            <div class="form-group">
              <label>Enter Year:</label>
              <input type="number" name="year" value="${currentYear}" min="1" max="99999" step="1" autofocus />
            </div>
          </form>
        `,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: "Set Year",
            callback: (html: JQuery) => {
              const yearInput = html.find('input[name="year"]').val() as string;
              const year = parseInt(yearInput);
              if (!isNaN(year) && year > 0) {
                resolve(year);
              } else {
                ui.notifications?.error("Please enter a valid year");
                resolve(null);
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "ok"
      }).render(true);
    });

    if (newYear !== null) {
      this.viewDate = { ...this.viewDate, year: newYear };
      this.render();
    }
  }

  /**
   * Attach event listeners
   */
  _attachPartListeners(partId: string, htmlElement: HTMLElement, options: any): void {
    super._attachPartListeners(partId, htmlElement, options);

    // Register this as the active instance
    CalendarGridWidget.activeInstance = this;
  }

  /**
   * Handle closing the widget
   */
  async close(options: any = {}): Promise<void> {
    // Clear active instance if this is it
    if (CalendarGridWidget.activeInstance === this) {
      CalendarGridWidget.activeInstance = null;
    }
    
    return super.close(options);
  }

  /**
   * Handle Foundry hooks for real-time updates
   */
  static registerHooks(): void {
    // Update widget when time changes
    Hooks.on('seasons-stars:dateChanged', () => {
      if (CalendarGridWidget.activeInstance?.rendered) {
        CalendarGridWidget.activeInstance.render();
      }
    });

    // Update widget when calendar changes
    Hooks.on('seasons-stars:calendarChanged', () => {
      if (CalendarGridWidget.activeInstance?.rendered) {
        // Reset to current date when calendar changes
        const manager = game.seasonsStars?.manager;
        if (manager) {
          CalendarGridWidget.activeInstance!.viewDate = manager.getCurrentDate();
        }
        CalendarGridWidget.activeInstance.render();
      }
    });
  }

  /**
   * Show the widget
   */
  static show(initialDate?: ICalendarDate): void {
    if (CalendarGridWidget.activeInstance) {
      if (!CalendarGridWidget.activeInstance.rendered) {
        CalendarGridWidget.activeInstance.render(true);
      }
    } else {
      new CalendarGridWidget(initialDate).render(true);
    }
  }

  /**
   * Toggle widget visibility
   */
  static toggle(initialDate?: ICalendarDate): void {
    if (CalendarGridWidget.activeInstance) {
      if (CalendarGridWidget.activeInstance.rendered) {
        CalendarGridWidget.activeInstance.close();
      } else {
        CalendarGridWidget.activeInstance.render(true);
      }
    } else {
      new CalendarGridWidget(initialDate).render(true);
    }
  }

  /**
   * Hide the widget
   */
  static hide(): void {
    if (CalendarGridWidget.activeInstance?.rendered) {
      CalendarGridWidget.activeInstance.close();
    }
  }

  /**
   * Get the current widget instance
   */
  static getInstance(): CalendarGridWidget | null {
    return CalendarGridWidget.activeInstance;
  }
}