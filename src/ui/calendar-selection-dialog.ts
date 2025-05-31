/**
 * Calendar Selection Dialog for Seasons & Stars
 * Allows users to browse and switch between available calendars
 */

import { CalendarLocalization } from '../core/calendar-localization';
import type { Calendar } from '../types/calendar';

export class CalendarSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  private selectedCalendarId: string | null = null;
  private calendars: Map<string, Calendar>;
  private currentCalendarId: string;

  constructor(calendars: any, currentCalendarId: string) {
    super();
    
    console.log('CalendarSelectionDialog constructor - calendars type:', typeof calendars, 'is Map:', calendars instanceof Map, 'calendars:', calendars);
    
    // Convert array to Map if needed
    if (Array.isArray(calendars)) {
      console.log('Converting array to Map');
      this.calendars = new Map();
      calendars.forEach((calendar, index) => {
        const id = calendar.id || String(index);
        this.calendars.set(id, calendar);
      });
      console.log('Converted calendars Map:', this.calendars);
    } else if (calendars instanceof Map) {
      this.calendars = calendars;
    } else {
      console.error('Unsupported calendars type:', typeof calendars, calendars);
      this.calendars = new Map();
    }
    
    this.currentCalendarId = currentCalendarId;
    this.selectedCalendarId = currentCalendarId;
  }

  static DEFAULT_OPTIONS = {
    id: 'seasons-stars-calendar-selection',
    classes: ['seasons-stars', 'calendar-selection-dialog'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'SEASONS_STARS.dialog.calendar_selection.title',
      icon: 'fa-solid fa-calendar-alt',
      minimizable: false,
      resizable: true
    },
    position: {
      width: 600,
      height: 600
    },
    actions: {
      selectCalendar: CalendarSelectionDialog.prototype._onSelectCalendar,
      previewCalendar: CalendarSelectionDialog.prototype._onPreviewCalendar,
      chooseCalendar: CalendarSelectionDialog.prototype._onChooseCalendar,
      cancel: CalendarSelectionDialog.prototype._onCancel
    }
  };

  static PARTS = {
    main: {
      template: 'modules/seasons-and-stars/templates/calendar-selection-dialog.hbs',
      scrollable: ['.calendar-selection-grid']
    }
  };

  /** @override */
  async _prepareContext(options = {}): Promise<any> {
    const context = await super._prepareContext(options);
    
    const calendarsData = Array.from(this.calendars.entries()).map(([id, calendar]) => {
      const label = CalendarLocalization.getCalendarLabel(calendar);
      const description = CalendarLocalization.getCalendarDescription(calendar);
      const setting = CalendarLocalization.getCalendarSetting(calendar);
      
      // Generate sample date for preview
      const sampleDate = this.generateSampleDate(calendar);
      
      return {
        id,
        label,
        description,
        setting,
        sampleDate,
        isCurrent: id === this.currentCalendarId,
        isSelected: id === this.selectedCalendarId
      };
    });

    return Object.assign(context, {
      calendars: calendarsData,
      selectedCalendar: this.selectedCalendarId,
      currentCalendar: this.currentCalendarId
    });
  }

  /** @override */
  _attachPartListeners(partId: string, htmlElement: HTMLElement, options: any): void {
    super._attachPartListeners(partId, htmlElement, options);

    console.log('Attaching part listeners for:', partId, 'element:', htmlElement);
    console.log('Scrollable elements:', htmlElement.querySelectorAll('.calendar-selection-grid'));

    // Add action buttons to window and update button state after rendering
    this.addActionButtons($(htmlElement));
    this.updateSelectButton($(htmlElement));
    
    // Debug: Check if scrolling is working
    const scrollableGrid = htmlElement.querySelector('.calendar-selection-grid');
    if (scrollableGrid) {
      console.log('Found scrollable grid, overflow style:', getComputedStyle(scrollableGrid).overflow);
      console.log('Grid height vs scrollHeight:', scrollableGrid.clientHeight, 'vs', scrollableGrid.scrollHeight);
    }
  }

  /**
   * Add action buttons to the dialog
   */
  private addActionButtons(html: JQuery): void {
    const footer = $(`
      <div class="dialog-buttons flexrow">
        <button data-action="cancel" type="button">
          <i class="fas fa-times"></i>
          ${game.i18n.localize('SEASONS_STARS.dialog.calendar_selection.cancel')}
        </button>
        <button data-action="chooseCalendar" type="button" class="ss-button primary" id="select-calendar">
          <i class="fas fa-check"></i>
          ${game.i18n.localize('SEASONS_STARS.dialog.calendar_selection.select')}
        </button>
      </div>
    `);
    
    html.append(footer);
  }

  /**
   * Select a calendar card
   */
  private selectCalendarCard(calendarId: string): void {
    this.selectedCalendarId = calendarId;
    
    // Re-render to update UI state
    this.render({ parts: ['main'] });
  }

  /**
   * Update the select button state
   */
  private updateSelectButton(html?: JQuery): void {
    const $html = html || $(this.element);
    const selectButton = $html.find('#select-calendar');
    const isDifferent = this.selectedCalendarId !== this.currentCalendarId;
    
    selectButton.prop('disabled', !isDifferent);
    selectButton.toggleClass('disabled', !isDifferent);
    
    if (isDifferent) {
      const calendar = this.calendars.get(this.selectedCalendarId!);
      const label = calendar ? CalendarLocalization.getCalendarLabel(calendar) : this.selectedCalendarId;
      selectButton.html(`<i class="fas fa-check"></i> Switch to ${label}`);
    } else {
      selectButton.html(`<i class="fas fa-check"></i> Select Calendar`);
    }
  }

  /**
   * Show preview for a calendar
   */
  private showPreview(calendarId: string): void {
    const calendar = this.calendars.get(calendarId);
    if (!calendar) return;

    const label = CalendarLocalization.getCalendarLabel(calendar);
    const description = CalendarLocalization.getCalendarDescription(calendar);
    const setting = CalendarLocalization.getCalendarSetting(calendar);
    
    // Generate multiple sample dates
    const samples = [
      this.generateSampleDate(calendar, 1),
      this.generateSampleDate(calendar, 100),
      this.generateSampleDate(calendar, 365)
    ];

    const content = `
      <div class="calendar-preview">
        <div class="preview-header">
          <h3>${label}</h3>
          <div class="preview-setting">${setting}</div>
        </div>
        <div class="preview-description">${description}</div>
        <div class="preview-samples">
          <h4>${game.i18n.localize('SEASONS_STARS.dialog.calendar_selection.sample_dates')}</h4>
          ${samples.map(sample => `<div class="sample-date">${sample}</div>`).join('')}
        </div>
        <div class="preview-structure">
          <h4>${game.i18n.localize('SEASONS_STARS.dialog.calendar_selection.structure')}</h4>
          <div class="structure-info">
            <div><strong>${game.i18n.localize('SEASONS_STARS.calendar.months')}:</strong> ${calendar.months.length}</div>
            <div><strong>${game.i18n.localize('SEASONS_STARS.calendar.days_per_week')}:</strong> ${calendar.weekdays.length}</div>
            ${calendar.leapYear ? `<div><strong>${game.i18n.localize('SEASONS_STARS.calendar.leap_year')}:</strong> ${game.i18n.localize('SEASONS_STARS.calendar.enabled')}</div>` : ''}
          </div>
        </div>
      </div>
    `;

    new Dialog({
      title: game.i18n.format('SEASONS_STARS.dialog.calendar_preview.title', { calendar: label }),
      content,
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('SEASONS_STARS.dialog.close'),
          callback: () => {}
        }
      },
      default: 'close'
    }, {
      classes: ['seasons-stars', 'calendar-preview-dialog'],
      width: 400,
      height: 'auto'
    }).render(true);
  }

  /**
   * Generate a sample date for preview
   */
  private generateSampleDate(calendar: Calendar, dayOffset: number = 1): string {
    // Use current world time if no offset, otherwise use offset from a reasonable base
    let totalDays: number;
    
    if (dayOffset === 1) {
      // Use current world time for default sample
      const currentTime = game.time?.worldTime || 0;
      console.log('Using current world time for sample:', currentTime, 'seconds');
      const secondsPerDay = 86400; // 24 * 60 * 60
      totalDays = Math.floor(currentTime / secondsPerDay);
      console.log('Converted to total days:', totalDays);
    } else {
      // Use offset for other samples
      totalDays = dayOffset;
      console.log('Using offset days for sample:', totalDays);
    }
    
    const year = 1000 + Math.floor(totalDays / 365);
    const dayInYear = totalDays % 365;
    console.log('Calculated year and day in year:', year, dayInYear);
    
    let remainingDays = dayInYear;
    let monthIndex = 0;
    
    // Find the month
    for (let i = 0; i < calendar.months.length; i++) {
      const monthDays = calendar.months[i].days;
      if (remainingDays <= monthDays) {
        monthIndex = i;
        break;
      }
      remainingDays -= monthDays;
    }
    
    const month = calendar.months[monthIndex];
    const day = Math.max(1, remainingDays);
    const weekdayIndex = (dayOffset - 1) % calendar.weekdays.length;
    const weekday = calendar.weekdays[weekdayIndex];
    
    // Format using calendar's translation
    const monthLabel = CalendarLocalization.getCalendarTranslation(calendar, `months.${month.id}`, month.name);
    const weekdayLabel = CalendarLocalization.getCalendarTranslation(calendar, `weekdays.${weekday.id}`, weekday.name);
    
    return `${weekdayLabel}, ${monthLabel} ${day}, ${year}`;
  }

  /**
   * Handle calendar selection
   */
  private async selectCalendar(): Promise<void> {
    if (this.selectedCalendarId && this.selectedCalendarId !== this.currentCalendarId) {
      // Switch to the selected calendar
      await game.settings?.set('seasons-and-stars', 'activeCalendar', this.selectedCalendarId);
      
      // Notify user
      const calendar = this.calendars.get(this.selectedCalendarId);
      const label = calendar ? CalendarLocalization.getCalendarLabel(calendar) : this.selectedCalendarId;
      
      ui.notifications?.info(
        game.i18n.format('SEASONS_STARS.notifications.calendar_changed', { calendar: label })
      );
    }
  }

  /**
   * Instance action handler for calendar card selection
   */
  async _onSelectCalendar(event: Event, target: HTMLElement): Promise<void> {
    console.log('Calendar card clicked', { event, target, this: this });
    
    const calendarId = target.getAttribute('data-calendar-id');
    console.log('Found calendar ID for selection:', calendarId);
    
    if (calendarId) {
      console.log('Calling selectCalendarCard with ID:', calendarId);
      this.selectCalendarCard(calendarId);
    } else {
      console.warn('Selection action failed - no calendar ID found');
    }
  }

  /**
   * Instance action handler for calendar preview
   */
  async _onPreviewCalendar(event: Event, target: HTMLElement): Promise<void> {
    console.log('Preview button clicked', { event, target, this: this });
    console.log('this.calendars type:', typeof this.calendars, 'is Map:', this.calendars instanceof Map, 'this.calendars:', this.calendars);
    event.stopPropagation();
    
    const calendarId = target.closest('[data-calendar-id]')?.getAttribute('data-calendar-id');
    console.log('Found calendar ID:', calendarId);
    
    if (calendarId) {
      console.log('Calling showPreview with ID:', calendarId);
      this.showPreview(calendarId);
    } else {
      console.warn('Preview action failed - no calendar ID found');
    }
  }

  /**
   * Instance action handler for choosing calendar
   */
  async _onChooseCalendar(event: Event, target: HTMLElement): Promise<void> {
    console.log('Choose calendar clicked', { event, target, this: this });
    await this.selectCalendar();
    this.close();
  }

  /**
   * Instance action handler for cancel
   */
  async _onCancel(event: Event, target: HTMLElement): Promise<void> {
    console.log('Cancel clicked', { event, target, this: this });
    this.close();
  }

  /**
   * Static method to show the calendar selection dialog
   */
  static async show(): Promise<void> {
    if (!game.seasonsStars?.manager) {
      ui.notifications?.error(game.i18n.localize('SEASONS_STARS.errors.manager_not_ready'));
      return;
    }

    const calendars = game.seasonsStars.manager.getAllCalendars();
    console.log('CalendarSelectionDialog.show() - calendars from manager:', typeof calendars, 'is Map:', calendars instanceof Map, 'calendars:', calendars);
    const currentCalendarId = game.settings?.get('seasons-and-stars', 'activeCalendar') as string;
    
    if (calendars.size === 0) {
      ui.notifications?.warn(game.i18n.localize('SEASONS_STARS.warnings.no_calendars_available'));
      return;
    }

    const dialog = new CalendarSelectionDialog(calendars, currentCalendarId);
    dialog.render(true);
  }
}