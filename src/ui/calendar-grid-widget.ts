/**
 * Calendar Grid Widget - Monthly calendar view for Seasons & Stars
 */

import { CalendarLocalization } from '../core/calendar-localization';
import { Logger } from '../core/logger';
import type { CalendarDate as ICalendarDate } from '../types/calendar';

export class CalendarGridWidget extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  private viewDate: ICalendarDate;
  private static activeInstance: CalendarGridWidget | null = null;
  private sidebarButtons: Array<{
    name: string;
    icon: string;
    tooltip: string;
    callback: Function;
  }> = [];

  constructor(initialDate?: ICalendarDate) {
    super();

    // Use provided date or current date
    const manager = game.seasonsStars?.manager;
    this.viewDate = initialDate ||
      manager?.getCurrentDate() || {
        year: 2024,
        month: 1,
        day: 1,
        weekday: 0,
        time: { hour: 0, minute: 0, second: 0 },
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
      resizable: false,
    },
    position: {
      width: 400,
      height: 'auto' as const,
    },
    actions: {
      previousMonth: CalendarGridWidget.prototype._onPreviousMonth,
      nextMonth: CalendarGridWidget.prototype._onNextMonth,
      previousYear: CalendarGridWidget.prototype._onPreviousYear,
      nextYear: CalendarGridWidget.prototype._onNextYear,
      selectDate: CalendarGridWidget.prototype._onSelectDate,
      goToToday: CalendarGridWidget.prototype._onGoToToday,
      setYear: CalendarGridWidget.prototype._onSetYear,
      createNote: CalendarGridWidget.prototype._onCreateNote,
    },
  };

  static PARTS = {
    main: {
      id: 'main',
      template: 'modules/seasons-and-stars/templates/calendar-grid-widget.hbs',
    },
  };

  /**
   * Handle post-render setup
   */
  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender(context, options);

    // Register as active instance
    CalendarGridWidget.activeInstance = this;

    // Render any existing sidebar buttons
    this.renderExistingSidebarButtons();
  }

  /**
   * Prepare rendering context for template
   */
  async _prepareContext(options = {}): Promise<any> {
    const context = await super._prepareContext(options);

    const manager = game.seasonsStars?.manager;

    if (!manager) {
      return Object.assign(context, {
        error: 'Calendar manager not initialized',
      });
    }

    const activeCalendar = manager.getActiveCalendar();
    const currentDate = manager.getCurrentDate();

    if (!activeCalendar || !currentDate) {
      return Object.assign(context, {
        error: 'No active calendar',
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
        description: wd.description,
      })),
    });
  }

  /**
   * Generate calendar month data with day grid and note indicators
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
      time: { hour: 0, minute: 0, second: 0 },
    };

    // Get notes for this month for note indicators with category information
    const notesManager = game.seasonsStars?.notes;
    const categories = game.seasonsStars?.categories;
    const monthNotes = new Map<
      string,
      { count: number; primaryCategory: string; categories: Set<string> }
    >(); // dateKey -> note data

    if (notesManager) {
      // Get all notes for the month
      const monthStart: ICalendarDate = {
        year: viewDate.year,
        month: viewDate.month,
        day: 1,
        weekday: 0,
        time: { hour: 0, minute: 0, second: 0 },
      };

      const monthEnd: ICalendarDate = {
        year: viewDate.year,
        month: viewDate.month,
        day: monthLength,
        weekday: 0,
        time: { hour: 23, minute: 59, second: 59 },
      };

      // Get notes synchronously for UI performance
      try {
        for (let day = 1; day <= monthLength; day++) {
          const dayDate: ICalendarDate = {
            year: viewDate.year,
            month: viewDate.month,
            day: day,
            weekday: 0,
            time: { hour: 0, minute: 0, second: 0 },
          };

          const notes = notesManager.storage?.findNotesByDateSync(dayDate) || [];
          if (notes.length > 0) {
            const dateKey = this.formatDateKey(dayDate);
            const dayCategories = new Set<string>();

            // Gather categories from all notes for this day
            notes.forEach(note => {
              const category = note.flags?.['seasons-and-stars']?.category || 'general';
              dayCategories.add(category);
            });

            // Determine primary category (most common, or first if tied)
            const categoryCount = new Map<string, number>();
            notes.forEach(note => {
              const category = note.flags?.['seasons-and-stars']?.category || 'general';
              categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
            });

            const primaryCategory =
              Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

            monthNotes.set(dateKey, {
              count: notes.length,
              primaryCategory,
              categories: dayCategories,
            });
          }
        }
      } catch (error) {
        Logger.warn('Error loading notes for calendar', error);
      }
    }

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
        time: { hour: 0, minute: 0, second: 0 },
      };

      const isToday = this.isSameDate(dayDate, currentDate);
      const isViewDate = this.isSameDate(dayDate, viewDate);
      const dateKey = this.formatDateKey(dayDate);
      const noteData = monthNotes.get(dateKey);
      const noteCount = noteData?.count || 0;
      const hasNotes = noteCount > 0;

      // Determine category class for styling
      let categoryClass = '';
      if (hasNotes && noteData) {
        if (noteData.categories.size > 1) {
          categoryClass = 'category-mixed';
        } else {
          categoryClass = `category-${noteData.primaryCategory}`;
        }
      }

      currentWeek.push({
        day: day,
        date: dayDate,
        isToday: isToday,
        isSelected: isViewDate,
        isClickable: game.user?.isGM || false,
        weekday: dayDate.weekday,
        fullDate: `${viewDate.year}-${viewDate.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        hasNotes: hasNotes,
        noteCount: noteCount,
        noteMultiple: noteCount > 1,
        categoryClass: categoryClass,
        primaryCategory: noteData?.primaryCategory || 'general',
        canCreateNote: this.canCreateNote(),
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
      monthDescription: monthInfo.description,
    };
  }

  /**
   * Format date as storage key
   */
  private formatDateKey(date: ICalendarDate): string {
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

  /**
   * Check if current user can create notes
   */
  private canCreateNote(): boolean {
    const notesManager = game.seasonsStars?.notes;
    if (!notesManager) return false;

    const user = game.user;
    if (!user) return false;

    // Check permission via notes manager
    return notesManager.permissions?.canCreateNote(user) || false;
  }

  /**
   * Check if two dates are the same (ignoring time)
   */
  private isSameDate(date1: ICalendarDate, date2: ICalendarDate): boolean {
    return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
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
        time: currentDate.time || { hour: 0, minute: 0, second: 0 },
      };

      // Set the target date
      await manager.setCurrentDate(targetDate);

      ui.notifications?.info(
        `Date set to ${targetDate.year}-${targetDate.month.toString().padStart(2, '0')}-${targetDate.day.toString().padStart(2, '0')}`
      );

      // Update view date to selected date
      this.viewDate = targetDate;
      this.render();
    } catch (error) {
      Logger.error('Failed to set date', error as Error);
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
    const newYear = await new Promise<number | null>(resolve => {
      new Dialog({
        title: 'Set Year',
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
            label: 'Set Year',
            callback: (html: JQuery) => {
              const yearInput = html.find('input[name="year"]').val() as string;
              const year = parseInt(yearInput);
              if (!isNaN(year) && year > 0) {
                resolve(year);
              } else {
                ui.notifications?.error('Please enter a valid year');
                resolve(null);
              }
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(null),
          },
        },
        default: 'ok',
      }).render(true);
    });

    if (newYear !== null) {
      this.viewDate = { ...this.viewDate, year: newYear };
      this.render();
    }
  }

  /**
   * Create a new note for the selected date
   */
  async _onCreateNote(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const notesManager = game.seasonsStars?.notes;
    if (!notesManager) {
      ui.notifications?.error('Notes system not available');
      return;
    }

    // Check permissions
    if (!this.canCreateNote()) {
      ui.notifications?.error("You don't have permission to create notes");
      return;
    }

    // Get the date from the clicked element
    const dayElement = target.closest('.calendar-day');
    if (!dayElement) return;

    const day = parseInt(dayElement.getAttribute('data-day') || '0');
    if (!day) return;

    const targetDate: ICalendarDate = {
      year: this.viewDate.year,
      month: this.viewDate.month,
      day: day,
      weekday: 0, // Will be calculated by the engine
      time: { hour: 0, minute: 0, second: 0 },
    };

    // Show note creation dialog
    const noteData = await this.showCreateNoteDialog(targetDate);
    if (!noteData) return;

    try {
      const note = await notesManager.createNote(noteData);
      ui.notifications?.info(`Created note: ${noteData.title}`);

      // Refresh the calendar to show the new note indicator
      this.render();

      // Emit hook for other modules
      Hooks.callAll('seasons-stars:noteCreated', note);
    } catch (error) {
      Logger.error('Failed to create note', error as Error);
      ui.notifications?.error('Failed to create note');
    }
  }

  /**
   * Show note creation dialog with enhanced category and tag support
   */
  private async showCreateNoteDialog(date: ICalendarDate): Promise<any | null> {
    const categories = game.seasonsStars?.categories;
    if (!categories) {
      ui.notifications?.error('Note categories system not available');
      return null;
    }

    return new Promise(resolve => {
      const dateStr = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;

      // Build category options from the categories system
      const availableCategories = categories.getCategories();
      const categoryOptions = availableCategories
        .map(
          cat =>
            `<option value="${cat.id}" style="color: ${cat.color};">
          ${cat.name} ${cat.description ? `- ${cat.description}` : ''}
        </option>`
        )
        .join('');

      // Get predefined tags for suggestions
      const predefinedTags = categories.getPredefinedTags();
      const tagSuggestions = predefinedTags
        .map(tag => `<span class="tag-suggestion" data-tag="${tag}">${tag}</span>`)
        .join(' ');

      new Dialog({
        title: `Create Note for ${dateStr}`,
        content: `
          <form class="seasons-stars-note-form">
            <div class="form-group">
              <label>Title:</label>
              <input type="text" name="title" placeholder="Note title" autofocus />
            </div>
            
            <div class="form-group">
              <label>Content:</label>
              <textarea name="content" rows="4" placeholder="Note content"></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group half-width">
                <label>Category:</label>
                <select name="category" class="category-select">
                  ${categoryOptions}
                </select>
              </div>
              <div class="form-group half-width">
                <label>
                  <input type="checkbox" name="allDay" checked />
                  All Day Event
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>Tags:</label>
              <input type="text" name="tags" placeholder="Enter tags separated by commas" class="tags-input" />
              <div class="tag-suggestions">
                <small>Suggestions:</small>
                ${tagSuggestions}
              </div>
            </div>
            
            <!-- Recurring Events Section -->
            <div class="form-group">
              <label>
                <input type="checkbox" name="isRecurring" class="recurring-toggle" />
                Recurring Event
              </label>
              
              <div class="recurring-options" style="display: none; margin-top: 8px; padding: 8px; border: 1px solid var(--color-border-light); border-radius: 3px; background: rgba(255, 255, 255, 0.02);">
                <div class="form-row">
                  <div class="form-group half-width">
                    <label>Frequency:</label>
                    <select name="frequency" class="frequency-select">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div class="form-group half-width">
                    <label>Every:</label>
                    <input type="number" name="interval" value="1" min="1" max="100" style="width: 60px;" />
                    <span class="interval-label">day(s)</span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>End Date (optional):</label>
                  <input type="date" name="endDate" />
                </div>
                
                <div class="weekly-options" style="display: none;">
                  <label>Days of Week:</label>
                  <div class="weekday-checkboxes">
                    <label><input type="checkbox" name="weekdays" value="sunday" /> Sun</label>
                    <label><input type="checkbox" name="weekdays" value="monday" /> Mon</label>
                    <label><input type="checkbox" name="weekdays" value="tuesday" /> Tue</label>
                    <label><input type="checkbox" name="weekdays" value="wednesday" /> Wed</label>
                    <label><input type="checkbox" name="weekdays" value="thursday" /> Thu</label>
                    <label><input type="checkbox" name="weekdays" value="friday" /> Fri</label>
                    <label><input type="checkbox" name="weekdays" value="saturday" /> Sat</label>
                  </div>
                </div>
                
                <div class="monthly-options" style="display: none;">
                  <div class="form-row">
                    <div class="form-group half-width">
                      <label>
                        <input type="radio" name="monthlyType" value="day" checked />
                        Day of Month
                      </label>
                      <input type="number" name="monthDay" value="${date.day}" min="1" max="31" style="width: 60px;" />
                    </div>
                    <div class="form-group half-width">
                      <label>
                        <input type="radio" name="monthlyType" value="weekday" />
                        Weekday
                      </label>
                      <select name="monthWeek" style="width: 70px;">
                        <option value="1">1st</option>
                        <option value="2">2nd</option>
                        <option value="3">3rd</option>
                        <option value="4">4th</option>
                      </select>
                      <select name="monthWeekday">
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="yearly-options" style="display: none;">
                  <div class="form-row">
                    <div class="form-group half-width">
                      <label>Month:</label>
                      <input type="number" name="yearMonth" value="${date.month}" min="1" max="12" style="width: 60px;" />
                    </div>
                    <div class="form-group half-width">
                      <label>Day:</label>
                      <input type="number" name="yearDay" value="${date.day}" min="1" max="31" style="width: 60px;" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" name="playerVisible" ${game.user?.isGM ? '' : 'checked'} />
                Visible to Players
              </label>
            </div>
          </form>
          
          <style>
            .seasons-stars-note-form .form-row {
              display: flex;
              gap: 10px;
            }
            .seasons-stars-note-form .half-width {
              flex: 1;
            }
            .seasons-stars-note-form .category-select {
              width: 100%;
            }
            .seasons-stars-note-form .tags-input {
              width: 100%;
              margin-bottom: 5px;
            }
            .seasons-stars-note-form .tag-suggestions {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              align-items: center;
            }
            .seasons-stars-note-form .tag-suggestion {
              background: var(--color-border-light-tertiary);
              color: var(--color-text-light-heading);
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 0.8em;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .seasons-stars-note-form .tag-suggestion:hover {
              background: var(--color-border-light-primary);
            }
            .seasons-stars-note-form .weekday-checkboxes {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: 4px;
            }
            .seasons-stars-note-form .weekday-checkboxes label {
              font-size: 0.9em;
              display: flex;
              align-items: center;
              gap: 3px;
            }
            .seasons-stars-note-form .recurring-options {
              font-size: 0.9em;
            }
            .seasons-stars-note-form .recurring-options .form-group {
              margin-bottom: 8px;
            }
            .seasons-stars-note-form .interval-label {
              margin-left: 5px;
              color: var(--color-text-secondary);
            }
          </style>
        `,
        buttons: {
          create: {
            icon: '<i class="fas fa-plus"></i>',
            label: 'Create Note',
            callback: (html: JQuery) => {
              const form = html.find('form')[0] as HTMLFormElement;
              const formData = new FormData(form);

              const title = formData.get('title') as string;
              const content = formData.get('content') as string;
              const tagsString = formData.get('tags') as string;

              if (!title?.trim()) {
                ui.notifications?.error('Note title is required');
                resolve(null);
                return;
              }

              // Parse tags
              const tags = categories.parseTagString(tagsString);
              const { valid: validTags, invalid: invalidTags } = categories.validateTags(tags);

              if (invalidTags.length > 0) {
                ui.notifications?.warn(`Some tags are not allowed: ${invalidTags.join(', ')}`);
              }

              // Parse recurring pattern if enabled
              let recurringPattern: any = undefined;
              if (formData.has('isRecurring')) {
                const frequency = formData.get('frequency') as string;
                const interval = parseInt(formData.get('interval') as string) || 1;

                recurringPattern = {
                  frequency: frequency as any,
                  interval,
                  endDate: undefined,
                  weekdays: undefined,
                  monthDay: undefined,
                  monthWeek: undefined,
                  monthWeekday: undefined,
                  yearMonth: undefined,
                  yearDay: undefined,
                };

                // Add end date if specified
                const endDateStr = formData.get('endDate') as string;
                if (endDateStr) {
                  const endDateParts = endDateStr.split('-');
                  if (endDateParts.length === 3) {
                    recurringPattern.endDate = {
                      year: parseInt(endDateParts[0]),
                      month: parseInt(endDateParts[1]),
                      day: parseInt(endDateParts[2]),
                      weekday: 0,
                      time: { hour: 23, minute: 59, second: 59 },
                    };
                  }
                }

                // Add frequency-specific options
                if (frequency === 'weekly') {
                  const weekdays: string[] = [];
                  formData.getAll('weekdays').forEach(day => weekdays.push(day as string));
                  if (weekdays.length > 0) {
                    recurringPattern.weekdays = weekdays as any;
                  }
                } else if (frequency === 'monthly') {
                  const monthlyType = formData.get('monthlyType') as string;
                  if (monthlyType === 'day') {
                    recurringPattern.monthDay = parseInt(formData.get('monthDay') as string);
                  } else if (monthlyType === 'weekday') {
                    recurringPattern.monthWeek = parseInt(formData.get('monthWeek') as string);
                    recurringPattern.monthWeekday = formData.get('monthWeekday') as any;
                  }
                } else if (frequency === 'yearly') {
                  recurringPattern.yearMonth = parseInt(formData.get('yearMonth') as string);
                  recurringPattern.yearDay = parseInt(formData.get('yearDay') as string);
                }
              }

              resolve({
                title: title.trim(),
                content: content || '',
                startDate: date,
                allDay: formData.has('allDay'),
                category:
                  (formData.get('category') as string) || categories.getDefaultCategory().id,
                tags: validTags,
                playerVisible: formData.has('playerVisible'),
                recurring: recurringPattern,
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(null),
          },
        },
        default: 'create',
        render: (html: JQuery) => {
          // Add click handlers for tag suggestions
          html.find('.tag-suggestion').on('click', function () {
            const tag = $(this).data('tag');
            const tagsInput = html.find('input[name="tags"]');
            const currentTags = tagsInput.val() as string;

            if (currentTags) {
              tagsInput.val(currentTags + ', ' + tag);
            } else {
              tagsInput.val(tag);
            }
          });

          // Update category select styling based on selection
          html.find('.category-select').on('change', function () {
            const selectedCat = categories.getCategory($(this).val() as string);
            if (selectedCat) {
              $(this).css('border-left', `4px solid ${selectedCat.color}`);
            }
          });

          // Trigger initial styling
          html.find('.category-select').trigger('change');

          // Recurring options toggle
          html.find('.recurring-toggle').on('change', function () {
            const isChecked = $(this).is(':checked');
            html.find('.recurring-options').toggle(isChecked);
          });

          // Frequency selection changes
          html.find('.frequency-select').on('change', function () {
            const frequency = $(this).val();
            const intervalLabel = html.find('.interval-label');

            // Update interval label
            switch (frequency) {
              case 'daily':
                intervalLabel.text('day(s)');
                break;
              case 'weekly':
                intervalLabel.text('week(s)');
                break;
              case 'monthly':
                intervalLabel.text('month(s)');
                break;
              case 'yearly':
                intervalLabel.text('year(s)');
                break;
            }

            // Show/hide frequency-specific options
            html.find('.weekly-options').toggle(frequency === 'weekly');
            html.find('.monthly-options').toggle(frequency === 'monthly');
            html.find('.yearly-options').toggle(frequency === 'yearly');
          });

          // Monthly type radio changes
          html.find('input[name="monthlyType"]').on('change', function () {
            const isWeekday = $(this).val() === 'weekday';
            html.find('input[name="monthDay"]').prop('disabled', isWeekday);
            html
              .find('select[name="monthWeek"], select[name="monthWeekday"]')
              .prop('disabled', !isWeekday);
          });

          // Trigger initial frequency setup
          html.find('.frequency-select').trigger('change');
        },
      }).render(true);
    });
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
  async close(options: any = {}): Promise<this> {
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

  /**
   * Add a sidebar button to the grid widget
   * Provides generic API for integration with other modules
   */
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    // Check if button already exists
    const existingButton = this.sidebarButtons.find(btn => btn.name === name);
    if (existingButton) {
      Logger.debug(`Button "${name}" already exists in grid widget`);
      return;
    }

    // Add to buttons array
    this.sidebarButtons.push({ name, icon, tooltip, callback });
    Logger.debug(`Added sidebar button "${name}" to grid widget`);

    // If widget is rendered, add button to DOM immediately
    if (this.rendered && this.element) {
      this.renderSidebarButton(name, icon, tooltip, callback);
    }
  }

  /**
   * Render a sidebar button in the grid widget header
   */
  private renderSidebarButton(
    name: string,
    icon: string,
    tooltip: string,
    callback: Function
  ): void {
    if (!this.element) return;

    const buttonId = `grid-sidebar-btn-${name.toLowerCase().replace(/\s+/g, '-')}`;

    // Don't add if already exists in DOM
    if (this.element.querySelector(`#${buttonId}`)) {
      return;
    }

    // Find window controls area in header
    let windowControls = this.element.querySelector(
      '.window-header .window-controls'
    ) as HTMLElement;
    if (!windowControls) {
      // Try to find window header and add controls area
      const windowHeader = this.element.querySelector('.window-header');
      if (windowHeader) {
        windowControls = document.createElement('div');
        windowControls.className = 'window-controls';
        windowControls.style.cssText = 'display: flex; align-items: center; margin-left: auto;';
        windowHeader.appendChild(windowControls);
      } else {
        Logger.warn('No window header found for grid widget sidebar button');
        return;
      }
    }

    // Create button element
    const button = document.createElement('button');
    button.id = buttonId;
    button.className = 'grid-sidebar-button';
    button.title = tooltip;
    button.innerHTML = `<i class="fas ${icon}"></i>`;
    button.style.cssText = `
      background: var(--color-bg-btn, #f0f0f0);
      border: 1px solid var(--color-border-dark, #999);
      border-radius: 3px;
      padding: 4px 6px;
      margin-left: 4px;
      cursor: pointer;
      font-size: 12px;
      color: var(--color-text-primary, #000);
      transition: background-color 0.15s ease;
    `;

    // Add click handler
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      try {
        callback();
      } catch (error) {
        Logger.error(`Error in grid widget sidebar button "${name}"`, error as Error);
      }
    });

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'var(--color-bg-btn-hover, #e0e0e0)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'var(--color-bg-btn, #f0f0f0)';
    });

    windowControls.appendChild(button);
    Logger.debug(`Rendered sidebar button "${name}" in grid widget header`);
  }

  /**
   * Render all existing sidebar buttons (called after widget render)
   */
  private renderExistingSidebarButtons(): void {
    this.sidebarButtons.forEach(button => {
      this.renderSidebarButton(button.name, button.icon, button.tooltip, button.callback);
    });
  }
}
