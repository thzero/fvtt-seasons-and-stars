/**
 * Calendar Mini Widget - Compact date display that pairs with SmallTime
 */

import { CalendarLocalization } from '../core/calendar-localization';
import type { CalendarDate as ICalendarDate } from '../types/calendar';

export class CalendarMiniWidget extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  private static activeInstance: CalendarMiniWidget | null = null;
  private sidebarButtons: Array<{name: string, icon: string, tooltip: string, callback: Function}> = [];

  static DEFAULT_OPTIONS = {
    id: 'seasons-stars-mini-widget',
    classes: ['seasons-stars', 'calendar-mini-widget'],
    tag: 'div',
    window: {
      frame: false,
      positioned: true,
      minimizable: false,
      resizable: false
    },
    position: {
      width: 'auto',
      height: 'auto',
      top: -1000,  // Start off-screen to minimize flash
      left: -1000
    },
    actions: {
      advanceTime: CalendarMiniWidget.prototype._onAdvanceTime
    }
  };

  static PARTS = {
    main: {
      template: 'modules/seasons-and-stars/templates/calendar-mini-widget.hbs'
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
        error: 'Calendar not available',
        shortDate: 'N/A'
      });
    }

    const activeCalendar = manager.getActiveCalendar();
    const currentDate = manager.getCurrentDate();
    
    if (!activeCalendar || !currentDate) {
      return Object.assign(context, {
        error: 'No calendar active',
        shortDate: 'N/A'
      });
    }
    
    // Check if SmallTime is available and active
    const hasSmallTime = this.detectSmallTime();
    
    return Object.assign(context, {
      shortDate: currentDate.toDateString(),
      hasSmallTime: hasSmallTime,
      showTimeControls: !hasSmallTime && (game.user?.isGM || false),
      isGM: game.user?.isGM || false
    });
  }

  /**
   * Simple post-render positioning like SmallTime
   */
  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender(context, options);
    
    // Register this as the active instance
    CalendarMiniWidget.activeInstance = this;
    
    // Render any existing sidebar buttons
    this.renderExistingSidebarButtons();
    
    // Position widget after render (SmallTime approach)
    this.positionWidget();
  }

  /**
   * Position widget - simplified approach like SmallTime
   */
  private positionWidget(): void {
    if (!this.element) return;

    const smallTimeElement = this.findSmallTimeElement();
    
    if (smallTimeElement) {
      // Check if SmallTime is pinned/docked in DOM or floating
      if (this.isSmallTimeDocked(smallTimeElement)) {
        // SmallTime is docked - use DOM positioning
        this.dockAboveSmallTime(smallTimeElement);
      } else {
        // SmallTime is floating - use fixed positioning  
        this.positionAboveSmallTime(smallTimeElement);
      }
    } else {
      // No SmallTime - dock to player list
      this.dockToPlayerList();
    }
  }

  /**
   * Attach event listeners to rendered parts
   */
  _attachPartListeners(partId: string, htmlElement: HTMLElement, options: any): void {
    super._attachPartListeners(partId, htmlElement, options);
  }

  /**
   * Handle closing the widget
   */
  async close(options: any = {}): Promise<void> {
    // Clear active instance if this is it
    if (CalendarMiniWidget.activeInstance === this) {
      CalendarMiniWidget.activeInstance = null;
    }
    
    // Clean up mutation observer
    const observer = (this as any)._playerListObserver;
    if (observer) {
      observer.disconnect();
      delete (this as any)._playerListObserver;
    }
    
    return super.close(options);
  }

  /**
   * Handle Foundry hooks for real-time updates
   */
  static registerHooks(): void {
    // Update widget when date changes
    Hooks.on('seasons-stars:dateChanged', () => {
      if (CalendarMiniWidget.activeInstance?.rendered) {
        CalendarMiniWidget.activeInstance.render();
      }
    });

    // Update widget when calendar changes
    Hooks.on('seasons-stars:calendarChanged', () => {
      if (CalendarMiniWidget.activeInstance?.rendered) {
        CalendarMiniWidget.activeInstance.render();
      }
    });
  }

  /**
   * Show the mini widget
   */
  static show(): void {
    if (CalendarMiniWidget.activeInstance) {
      if (!CalendarMiniWidget.activeInstance.rendered) {
        CalendarMiniWidget.activeInstance.render(true);
      }
    } else {
      new CalendarMiniWidget().render(true);
    }
  }

  /**
   * Hide the mini widget
   */
  static hide(): void {
    if (CalendarMiniWidget.activeInstance?.rendered) {
      CalendarMiniWidget.activeInstance.close();
    }
  }

  /**
   * Get the current instance for API access
   */
  static getInstance(): CalendarMiniWidget | null {
    return CalendarMiniWidget.activeInstance;
  }

  /**
   * Add a sidebar button to the mini widget
   * Provides generic API for integration with other modules via compatibility bridges
   */
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    // Check if button already exists
    const existingButton = this.sidebarButtons.find(btn => btn.name === name);
    if (existingButton) {
      console.log(`Seasons & Stars | Button "${name}" already exists in mini widget`);
      return;
    }

    // Add to buttons array
    this.sidebarButtons.push({ name, icon, tooltip, callback });
    console.log(`Seasons & Stars | Added sidebar button "${name}" to mini widget`);

    // If widget is rendered, add button to DOM immediately
    if (this.rendered && this.element) {
      this.renderSidebarButton(name, icon, tooltip, callback);
    }
  }

  /**
   * Render a sidebar button in the mini widget DOM
   */
  private renderSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    if (!this.element) return;

    const buttonId = `mini-sidebar-btn-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Don't add if already exists in DOM
    if (this.element.querySelector(`#${buttonId}`)) {
      return;
    }

    // Find or create header area for buttons
    let headerArea = this.element.querySelector('.mini-widget-header') as HTMLElement;
    if (!headerArea) {
      // Create header if it doesn't exist
      headerArea = document.createElement('div');
      headerArea.className = 'mini-widget-header';
      headerArea.style.cssText = 'display: flex; justify-content: flex-end; align-items: center; padding: 2px 4px; background: rgba(0,0,0,0.1); border-bottom: 1px solid var(--color-border-light-tertiary);';
      
      // Insert at the beginning of the widget
      this.element.insertBefore(headerArea, this.element.firstChild);
    }

    // Create button element
    const button = document.createElement('button');
    button.id = buttonId;
    button.className = 'mini-sidebar-button';
    button.title = tooltip;
    button.innerHTML = `<i class="fas ${icon}"></i>`;
    button.style.cssText = `
      background: var(--color-bg-btn, #f0f0f0);
      border: 1px solid var(--color-border-dark, #999);
      border-radius: 2px;
      padding: 2px 4px;
      margin-left: 2px;
      cursor: pointer;
      font-size: 10px;
      color: var(--color-text-primary, #000);
      transition: background-color 0.15s ease;
    `;

    // Add click handler
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        callback();
      } catch (error) {
        console.error(`Error in mini widget sidebar button "${name}":`, error);
      }
    });

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'var(--color-bg-btn-hover, #e0e0e0)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'var(--color-bg-btn, #f0f0f0)';
    });

    headerArea.appendChild(button);
    console.log(`Seasons & Stars | Rendered sidebar button "${name}" in mini widget DOM`);
  }

  /**
   * Render all existing sidebar buttons (called after widget render)
   */
  private renderExistingSidebarButtons(): void {
    this.sidebarButtons.forEach(button => {
      this.renderSidebarButton(button.name, button.icon, button.tooltip, button.callback);
    });
  }

  /**
   * Toggle mini widget visibility
   */
  static toggle(): void {
    if (CalendarMiniWidget.activeInstance?.rendered) {
      CalendarMiniWidget.activeInstance.close();
    } else {
      CalendarMiniWidget.show();
    }
  }

  /**
   * Instance action handler for time advancement
   */
  async _onAdvanceTime(event: Event, target: HTMLElement): Promise<void> {
    event.preventDefault();
    
    const amount = parseInt(target.dataset.amount || '0');
    const unit = target.dataset.unit || 'hours';
    
    const manager = game.seasonsStars?.manager;
    if (!manager) return;

    console.log(`Seasons & Stars | Mini widget advancing time: ${amount} ${unit}`);

    try {
      switch (unit) {
        case 'minutes':
          await manager.advanceMinutes(amount);
          break;
        case 'hours':
          await manager.advanceHours(amount);
          break;
        default:
          console.warn(`Unknown time unit: ${unit}`);
          return;
      }
      
    } catch (error) {
      console.error('Seasons & Stars | Error advancing time:', error);
      ui.notifications?.error('Failed to advance time');
    }
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
   * Auto-position the mini widget relative to SmallTime or find optimal standalone position
   */
  private autoPositionRelativeToSmallTime(): void {
    // Wait for both our element and SmallTime to be ready
    const attemptPositioning = (attempts = 0) => {
      const maxAttempts = 10;
      const smallTimeElement = this.findSmallTimeElement();
      
      if (smallTimeElement && this.element && this.rendered) {
        // Both elements exist and we're rendered, proceed with positioning
        console.log('Seasons & Stars | Auto-positioning mini widget relative to SmallTime (attempt', attempts + 1, ')');
        this.positionRelativeToSmallTime('above'); // Default to above instead of below
      } else if (attempts < maxAttempts) {
        // Retry after a short delay
        console.log('Seasons & Stars | Retrying positioning (attempt', attempts + 1, 'of', maxAttempts, ')');
        setTimeout(() => attemptPositioning(attempts + 1), 100);
      } else {
        // SmallTime not found - use smart standalone positioning
        console.log('Seasons & Stars | SmallTime not found, using standalone positioning');
        this.positionStandalone();
      }
    };

    // Start the positioning attempt
    requestAnimationFrame(() => attemptPositioning());
  }

  /**
   * Position mini widget in standalone mode (when SmallTime is not available)
   * First try to dock to player list, then fallback to fixed positioning
   */
  private positionStandalone(): void {
    if (!this.element) return;

    // First attempt: Try SmallTime-style docking to player list
    const playerList = document.getElementById('players');
    if (playerList) {
      this.positionRelativeToPlayerList();
      return;
    }

    // Fallback: Fixed positioning if player list not found
    let position = { top: 80, left: 20 }; // Default fallback

    try {
      // Fallback: Try to find where player list would typically be
      // Usually bottom-right area of UI
      position = {
        top: window.innerHeight - 150, // Typical player list area
        left: window.innerWidth - 240   // Typical player list left edge
      };
      
      console.log('Seasons & Stars | Player list not found, using typical location:', position);

    } catch (error) {
      console.log('Seasons & Stars | Error in standalone positioning, using fallback:', error);
    }

    // Apply the fixed position as last resort
    this.element.style.position = 'fixed';
    this.element.style.top = `${position.top}px`;
    this.element.style.left = `${position.left}px`;
    this.element.style.zIndex = '95';
    this.element.style.margin = '0';

    // Add a class to indicate standalone mode
    this.element.classList.add('standalone-mode');
    this.element.classList.remove('above-smalltime', 'below-smalltime', 'beside-smalltime', 'docked-mode');
  }

  /**
   * Find SmallTime element using multiple strategies
   */
  private findSmallTimeElement(): HTMLElement | null {
    // Try multiple selectors to find SmallTime
    const selectors = [
      '#smalltime-app',           // Primary ID
      '.smalltime-app',           // Class variant
      '#timeDisplay',             // From the HTML you provided
      '#slideContainer',          // Another element from your HTML
      '[id*="smalltime"]',        // Any element with smalltime in ID
      '.form:has(#timeDisplay)'   // Form containing timeDisplay
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          console.log('Seasons & Stars | Found SmallTime using selector:', selector);
          // If we found timeDisplay, get its parent form/container
          if (selector === '#timeDisplay' || selector === '#slideContainer') {
            const container = element.closest('form') || element.closest('.form') || element.parentElement;
            return container as HTMLElement || element;
          }
          return element;
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    console.log('Seasons & Stars | SmallTime not found with any selector');
    return null;
  }

  /**
   * Position the mini widget relative to SmallTime
   */
  private positionRelativeToSmallTime(position: 'above' | 'below' | 'beside' = 'below'): void {
    const smallTimeElement = this.findSmallTimeElement();
    if (!smallTimeElement || !this.element) {
      console.log('Seasons & Stars | SmallTime not found, using standalone positioning');
      // Use smart standalone positioning instead of basic fallback
      this.positionStandalone();
      return;
    }

    console.log('Seasons & Stars | Found SmallTime, positioning mini widget', position);

    // Wait for the mini widget to be properly rendered before getting dimensions
    requestAnimationFrame(() => {
      const smallTimeRect = smallTimeElement.getBoundingClientRect();
      
      // Use a fixed height estimate instead of getBoundingClientRect() which can be wrong
      const estimatedMiniHeight = 32; // Match the CSS height (24px) + padding (4px + 4px)
      
      console.log('Seasons & Stars | SmallTime rect:', smallTimeRect);
      console.log('Seasons & Stars | Using estimated mini height:', estimatedMiniHeight);
      
      let newPosition: { top: number; left: number };

      switch (position) {
        case 'above':
          newPosition = {
            top: smallTimeRect.top - estimatedMiniHeight - 8,
            left: smallTimeRect.left
          };
          this.element.classList.add('above-smalltime');
          this.element.classList.remove('below-smalltime', 'beside-smalltime');
          break;
          
        case 'beside':
          newPosition = {
            top: smallTimeRect.top,
            left: smallTimeRect.right + 8
          };
          this.element.classList.add('beside-smalltime');
          this.element.classList.remove('above-smalltime', 'below-smalltime');
          break;
          
        case 'below':
        default:
          newPosition = {
            top: smallTimeRect.bottom + 8,
            left: smallTimeRect.left
          };
          this.element.classList.add('below-smalltime');
          this.element.classList.remove('above-smalltime', 'beside-smalltime');
          break;
      }

      console.log('Seasons & Stars | Positioning mini widget at:', newPosition);

      // Apply positioning directly via CSS (more reliable than setPosition for frameless windows)
      if (this.element) {
        this.element.style.position = 'fixed';
        this.element.style.top = `${newPosition.top}px`;
        this.element.style.left = `${newPosition.left}px`;
        this.element.style.zIndex = '95';
        
        // Try to match SmallTime's actual background color
        this.matchSmallTimeBackground(smallTimeElement);
        
        console.log('Seasons & Stars | Applied CSS positioning directly');
        
        // Verify final position
        setTimeout(() => {
          const finalRect = this.element.getBoundingClientRect();
          console.log('Seasons & Stars | Final position:', finalRect);
        }, 100);
      }
    });
  }

  /**
   * Match SmallTime's actual background styling
   */
  private matchSmallTimeBackground(smallTimeElement: HTMLElement): void {
    try {
      // Find SmallTime's content area
      const smallTimeContent = smallTimeElement.querySelector('.window-content') || 
                              smallTimeElement.querySelector('form') ||
                              smallTimeElement;
      
      if (smallTimeContent && this.element) {
        const computedStyle = getComputedStyle(smallTimeContent as HTMLElement);
        const miniContent = this.element.querySelector('.calendar-mini-content') as HTMLElement;
        
        if (miniContent) {
          // Try to match the background
          const background = computedStyle.backgroundColor;
          const backgroundImage = computedStyle.backgroundImage;
          
          console.log('Seasons & Stars | SmallTime background:', background, backgroundImage);
          
          if (background && background !== 'rgba(0, 0, 0, 0)') {
            miniContent.style.background = background;
          }
          if (backgroundImage && backgroundImage !== 'none') {
            miniContent.style.backgroundImage = backgroundImage;
          }
        }
      }
    } catch (error) {
      console.log('Seasons & Stars | Could not match SmallTime background:', error);
    }
  }

  /**
   * Public positioning methods
   */
  static positionAboveSmallTime(): void {
    if (CalendarMiniWidget.activeInstance?.rendered) {
      CalendarMiniWidget.activeInstance.positionRelativeToSmallTime('above');
    }
  }

  static positionBelowSmallTime(): void {
    if (CalendarMiniWidget.activeInstance?.rendered) {
      CalendarMiniWidget.activeInstance.positionRelativeToSmallTime('below');
    }
  }

  static positionBesideSmallTime(): void {
    if (CalendarMiniWidget.activeInstance?.rendered) {
      CalendarMiniWidget.activeInstance.positionRelativeToSmallTime('beside');
    }
  }

  /**
   * Listen for SmallTime position changes and update accordingly
   */
  static registerSmallTimeIntegration(): void {
    // Listen for SmallTime app rendering/movement
    Hooks.on('renderApplication', (app: any) => {
      if (app.id === 'smalltime-app' && CalendarMiniWidget.activeInstance?.rendered) {
        // Delay to ensure SmallTime positioning is complete
        setTimeout(() => {
          CalendarMiniWidget.activeInstance?.autoPositionRelativeToSmallTime();
        }, 100);
      }
    });

    // Listen for player list changes that might affect positioning
    Hooks.on('renderPlayerList', () => {
      if (CalendarMiniWidget.activeInstance?.rendered) {
        setTimeout(() => {
          CalendarMiniWidget.activeInstance?.handlePlayerListChange();
        }, 50);
      }
    });

    // Also listen for general UI updates that might affect player list
    Hooks.on('renderSidebar', () => {
      if (CalendarMiniWidget.activeInstance?.rendered) {
        setTimeout(() => {
          CalendarMiniWidget.activeInstance?.handlePlayerListChange();
        }, 100);
      }
    });

    // Use MutationObserver to watch for player list changes in real-time
    const playerList = document.getElementById('players');
    if (playerList && CalendarMiniWidget.activeInstance) {
      const observer = new MutationObserver(() => {
        if (CalendarMiniWidget.activeInstance?.rendered) {
          CalendarMiniWidget.activeInstance.handlePlayerListChange();
        }
      });
      
      observer.observe(playerList, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true
      });
      
      // Store observer for cleanup
      (CalendarMiniWidget.activeInstance as any)._playerListObserver = observer;
    }

    // Listen for window resize to maintain positioning
    window.addEventListener('resize', () => {
      if (CalendarMiniWidget.activeInstance?.rendered) {
        // Re-evaluate positioning on resize
        CalendarMiniWidget.activeInstance.autoPositionRelativeToSmallTime();
      }
    });
  }

  /**
   * Handle player list expansion/contraction
   */
  private handlePlayerListChange(): void {
    const playerList = document.getElementById('players');
    
    // Check if player list is expanded using the same approach as SmallTime
    const isExpanded = playerList?.classList.contains('expanded') || false;

    if (this.element) {
      this.element.classList.toggle('player-list-expanded', isExpanded);
      
      // Use SmallTime-style positioning - insert before player list when not with SmallTime
      if (!this.findSmallTimeElement()) {
        this.positionRelativeToPlayerList();
      }
    }
  }

  /**
   * Position widget relative to player list using SmallTime approach
   */
  private positionRelativeToPlayerList(): void {
    if (!this.element) return;

    const playerList = document.getElementById('players');
    if (!playerList) return;

    try {
      // Use SmallTime's approach: insert before the player list in the DOM
      // This automatically moves with player list expansion/contraction
      const uiLeft = document.getElementById('ui-left');
      if (uiLeft && !uiLeft.contains(this.element)) {
        // Move to ui-left container and position before players list
        playerList.parentElement?.insertBefore(this.element, playerList);
        
        // Style as pinned/docked (similar to SmallTime)
        this.element.style.position = 'relative';
        this.element.style.top = 'auto';
        this.element.style.left = 'auto';
        this.element.style.zIndex = '95';
        this.element.style.margin = '0 0 8px 0';  // Small gap above player list
        
        this.element.classList.add('docked-mode');
        this.element.classList.remove('standalone-mode', 'above-smalltime', 'below-smalltime', 'beside-smalltime');
        
        console.log('Seasons & Stars | Mini widget docked above player list (SmallTime style)');
      }
    } catch (error) {
      console.log('Seasons & Stars | Error docking to player list, using fallback positioning:', error);
      this.positionStandalone();
    }
  }

  /**
   * Simple positioning above SmallTime (like SmallTime's pinApp)
   */
  private positionAboveSmallTime(smallTimeElement: HTMLElement): void {
    if (!this.element) return;

    const smallTimeRect = smallTimeElement.getBoundingClientRect();
    const estimatedMiniHeight = 32;
    
    // Position above SmallTime
    this.element.style.position = 'fixed';
    this.element.style.top = `${smallTimeRect.top - estimatedMiniHeight - 8}px`;
    this.element.style.left = `${smallTimeRect.left}px`;
    this.element.style.zIndex = '95';
    
    this.element.classList.add('above-smalltime');
    this.element.classList.remove('below-smalltime', 'beside-smalltime', 'standalone-mode', 'docked-mode');
  }

  /**
   * Check if SmallTime is docked/pinned in the DOM hierarchy
   */
  private isSmallTimeDocked(smallTimeElement: HTMLElement): boolean {
    // SmallTime adds 'pinned' class when docked
    if (smallTimeElement.classList.contains('pinned')) {
      return true;
    }
    
    // Also check if it's positioned in ui-left (where pinned widgets go)
    const uiLeft = document.getElementById('ui-left');
    if (uiLeft && uiLeft.contains(smallTimeElement)) {
      return true;
    }
    
    // Check if position is relative (docked) vs fixed (floating)
    const computedStyle = getComputedStyle(smallTimeElement);
    return computedStyle.position === 'relative';
  }

  /**
   * Dock above SmallTime in the DOM (when SmallTime is also docked)
   */
  private dockAboveSmallTime(smallTimeElement: HTMLElement): void {
    if (!this.element) return;

    // Insert before SmallTime in the DOM (like SmallTime does with players)
    $(smallTimeElement).before(this.element);
    
    // Style for docked mode above SmallTime
    this.element.style.position = 'relative';
    this.element.style.top = 'auto';
    this.element.style.left = 'auto';
    this.element.style.zIndex = '95';
    this.element.style.margin = '0 0 8px 0'; // Small gap below us, above SmallTime
    
    this.element.classList.add('above-smalltime', 'docked-mode');
    this.element.classList.remove('below-smalltime', 'beside-smalltime', 'standalone-mode');
  }

  /**
   * Simple docking to player list (exactly like SmallTime's pinApp)
   */
  private dockToPlayerList(): void {
    if (!this.element) return;

    const playerList = document.getElementById('players');
    if (!playerList) return;

    // Exactly like SmallTime: $('#players').before(app.element)
    $(playerList).before(this.element);
    
    // Style for docked mode
    this.element.style.position = 'relative';
    this.element.style.top = 'auto';
    this.element.style.left = 'auto';
    this.element.style.zIndex = '95';
    this.element.style.margin = '0 0 8px 0';
    
    this.element.classList.add('docked-mode');
    this.element.classList.remove('standalone-mode', 'above-smalltime', 'below-smalltime', 'beside-smalltime');
  }
}