/**
 * RecommendationCard Component
 * 
 * Displays a recommended next action with navigation.
 * Shows lesson title, reason, estimated time, and provides click-to-navigate.
 * 
 * @example
 * const card = new RecommendationCard(container, {
 *   title: 'Chapter 3: Recursion',
 *   reason: 'Strengthen your recursion skills',
 *   estimatedTime: 25,
 *   lessonPath: '../apprentice/ch3-magnetism/',
 *   type: 'growth',
 *   priority: 'high'
 * });
 * card.render();
 */

class RecommendationCard {
  /**
   * Create a RecommendationCard instance
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Card configuration
   * @param {string} options.title - Recommendation title
   * @param {string} [options.reason] - Why this is recommended
   * @param {number} [options.estimatedTime] - Estimated time in minutes
   * @param {string} [options.lessonPath] - URL to navigate to
   * @param {string} [options.type] - Type: 'growth', 'advancement', 'review', 'streak', 'challenge'
   * @param {string} [options.priority] - Priority: 'high', 'medium', 'low'
   * @param {string} [options.icon] - Custom icon (emoji)
   * @param {Function} [options.onClick] - Custom click handler
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      title: 'Recommended',
      reason: '',
      estimatedTime: null,
      lessonPath: null,
      type: 'growth',
      priority: 'medium',
      icon: null,
      onClick: null,
      animate: true,
      ...options
    };
    
    this.element = null;
  }
  
  /**
   * Render the card
   * @returns {RecommendationCard} this instance for chaining
   */
  render() {
    if (!this.container) {
      console.error('RecommendationCard: No container provided');
      return this;
    }
    
    this.element = document.createElement('div');
    this.element.className = `recommendation-card recommendation-card--${this.options.type} recommendation-card--${this.options.priority}`;
    
    if (this.options.lessonPath || this.options.onClick) {
      this.element.classList.add('recommendation-card--clickable');
    }
    
    const icon = this.options.icon || this._getTypeIcon();
    const priorityBadge = this._getPriorityBadge();
    const timeDisplay = this._getTimeDisplay();
    
    this.element.innerHTML = `
      <div class="recommendation-card__icon-wrapper">
        <span class="recommendation-card__icon">${icon}</span>
        <span class="recommendation-card__type-indicator"></span>
      </div>
      
      <div class="recommendation-card__content">
        <div class="recommendation-card__header">
          <h4 class="recommendation-card__title">${this.options.title}</h4>
          ${priorityBadge}
        </div>
        
        ${this.options.reason ? `
          <p class="recommendation-card__reason">${this.options.reason}</p>
        ` : ''}
        
        <div class="recommendation-card__meta">
          ${timeDisplay}
          <span class="recommendation-card__action">
            ${this.options.lessonPath ? 'Start Learning →' : 'View Details →'}
          </span>
        </div>
      </div>
    `;
    
    // Add click handler
    if (this.options.lessonPath || this.options.onClick) {
      this.element.addEventListener('click', (e) => this._handleClick(e));
      this.element.setAttribute('role', 'button');
      this.element.setAttribute('tabindex', '0');
      
      // Keyboard support
      this.element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._handleClick(e);
        }
      });
    }
    
    this.container.appendChild(this.element);
    
    // Animate in
    if (this.options.animate) {
      this._animateIn();
    }
    
    return this;
  }
  
  /**
   * Update the recommendation
   * @param {Object} newOptions - New configuration
   */
  update(newOptions) {
    Object.assign(this.options, newOptions);
    
    if (this.element) {
      this.element.remove();
    }
    
    this.render();
  }
  
  /**
   * Set loading state
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.element?.classList.add('recommendation-card--loading');
    } else {
      this.element?.classList.remove('recommendation-card--loading');
    }
    return this;
  }
  
  /**
   * Highlight the card (pulse animation)
   */
  highlight() {
    this.element?.classList.add('recommendation-card--highlight');
    setTimeout(() => {
      this.element?.classList.remove('recommendation-card--highlight');
    }, 2000);
    return this;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    this.element?.remove();
    this.element = null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get icon based on type
   * @private
   */
  _getTypeIcon() {
    const icons = {
      growth: '🎯',
      advancement: '🚀',
      review: '🔄',
      streak: '🔥',
      challenge: '⚡',
      practice: '💪',
      quiz: '📝',
      lesson: '📖',
      style: '🧠',
      timing: '⏰',
      persistence: '💪',
      start: '🚀'
    };
    return icons[this.options.type] || '📚';
  }
  
  /**
   * Get priority badge HTML
   * @private
   */
  _getPriorityBadge() {
    const badges = {
      high: '<span class="recommendation-card__badge recommendation-card__badge--high">Recommended</span>',
      medium: '<span class="recommendation-card__badge recommendation-card__badge--medium">Suggested</span>',
      low: ''
    };
    return badges[this.options.priority] || '';
  }
  
  /**
   * Get time display HTML
   * @private
   */
  _getTimeDisplay() {
    if (!this.options.estimatedTime) return '';
    
    const mins = this.options.estimatedTime;
    const display = mins >= 60 
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins} min`;
    
    return `
      <span class="recommendation-card__time">
        <span class="recommendation-card__time-icon">⏱️</span>
        ${display}
      </span>
    `;
  }
  
  /**
   * Handle click event
   * @private
   */
  _handleClick(e) {
    // Add click animation
    this.element.classList.add('recommendation-card--clicked');
    
    if (this.options.onClick) {
      this.options.onClick(this.options, e);
    } else if (this.options.lessonPath) {
      // Small delay for animation
      setTimeout(() => {
        window.location.href = this.options.lessonPath;
      }, 150);
    }
  }
  
  /**
   * Animate card in
   * @private
   */
  _animateIn() {
    if (typeof anime === 'undefined') {
      this.element.style.opacity = '1';
      return;
    }
    
    anime({
      targets: this.element,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      easing: 'easeOutCubic'
    });
  }
}

/**
 * RecommendationList Component
 * 
 * A container for multiple RecommendationCards with list management.
 * 
 * @example
 * const list = new RecommendationList(container, {
 *   recommendations: [
 *     { title: 'Focus on Recursion', type: 'growth', priority: 'high' },
 *     { title: 'Keep your streak going!', type: 'streak', priority: 'medium' }
 *   ],
 *   maxDisplay: 3
 * });
 * list.render();
 */
class RecommendationList {
  /**
   * Create a RecommendationList instance
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - List configuration
   * @param {Array} [options.recommendations] - Array of recommendation configs
   * @param {number} [options.maxDisplay=3] - Max cards to display
   * @param {string} [options.emptyMessage] - Message when no recommendations
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      recommendations: [],
      maxDisplay: 3,
      emptyMessage: 'Complete more activities to get personalized recommendations!',
      animate: true,
      ...options
    };
    
    this.element = null;
    this.cards = [];
  }
  
  /**
   * Render the list
   * @returns {RecommendationList} this instance for chaining
   */
  render() {
    if (!this.container) {
      console.error('RecommendationList: No container provided');
      return this;
    }
    
    this.element = document.createElement('div');
    this.element.className = 'recommendation-list';
    
    const recs = this.options.recommendations.slice(0, this.options.maxDisplay);
    
    if (recs.length === 0) {
      this.element.innerHTML = `
        <div class="recommendation-list__empty">
          <span class="recommendation-list__empty-icon">💡</span>
          <p class="recommendation-list__empty-text">${this.options.emptyMessage}</p>
        </div>
      `;
      this.container.appendChild(this.element);
      return this;
    }
    
    // Create card containers
    recs.forEach((rec, index) => {
      const cardContainer = document.createElement('div');
      cardContainer.className = 'recommendation-list__item';
      cardContainer.style.animationDelay = `${index * 100}ms`;
      this.element.appendChild(cardContainer);
      
      const card = new RecommendationCard(cardContainer, {
        ...rec,
        animate: false // List handles animation
      });
      card.render();
      this.cards.push(card);
    });
    
    this.container.appendChild(this.element);
    
    // Animate in
    if (this.options.animate) {
      this._animateIn();
    }
    
    return this;
  }
  
  /**
   * Update recommendations
   * @param {Array} recommendations - New recommendations array
   */
  update(recommendations) {
    this.options.recommendations = recommendations;
    this.destroy();
    this.render();
  }
  
  /**
   * Destroy the component and all cards
   */
  destroy() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    this.element?.remove();
    this.element = null;
  }
  
  /**
   * Animate list in
   * @private
   */
  _animateIn() {
    if (typeof anime === 'undefined') return;
    
    anime({
      targets: '.recommendation-list__item',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100),
      easing: 'easeOutCubic',
      duration: 500
    });
  }
}

// Export for module and global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RecommendationCard, RecommendationList };
}
window.RecommendationCard = RecommendationCard;
window.RecommendationList = RecommendationList;
