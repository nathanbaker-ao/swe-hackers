/**
 * ProgressTimeline Component
 * 
 * A horizontal timeline showing learning milestones and recent activities.
 * Displays course completion markers, streak indicators, and activity history.
 * 
 * @example
 * const timeline = new ProgressTimeline(container, {
 *   activities: [
 *     { type: 'lesson', title: 'Variables', timestamp: '2026-01-22T10:00:00Z', score: 0.95 },
 *     { type: 'quiz', title: 'Quiz 1', timestamp: '2026-01-22T11:00:00Z', score: 0.85 }
 *   ],
 *   milestones: [
 *     { type: 'course_start', title: 'Started Apprentice', date: '2026-01-15' },
 *     { type: 'streak', title: '7 Day Streak', date: '2026-01-22' }
 *   ]
 * });
 * timeline.render();
 */

class ProgressTimeline {
  /**
   * Create a ProgressTimeline instance
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Timeline configuration
   * @param {Array} [options.activities] - Recent activity items
   * @param {Array} [options.milestones] - Achievement milestones
   * @param {number} [options.maxItems=10] - Max items to show
   * @param {boolean} [options.showDates=true] - Show date labels
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      activities: [],
      milestones: [],
      maxItems: 10,
      showDates: true,
      animate: true,
      ...options
    };
    
    this.element = null;
  }
  
  /**
   * Render the timeline
   * @returns {ProgressTimeline} this instance for chaining
   */
  render() {
    if (!this.container) {
      console.error('ProgressTimeline: No container provided');
      return this;
    }
    
    // Combine and sort items by date
    const items = this._prepareItems();
    
    if (items.length === 0) {
      this._renderEmpty();
      return this;
    }
    
    this.element = document.createElement('div');
    this.element.className = 'progress-timeline';
    
    // Group items by date
    const grouped = this._groupByDate(items);
    
    let html = '<div class="progress-timeline__track">';
    
    Object.entries(grouped).forEach(([date, dayItems], groupIndex) => {
      const formattedDate = this._formatDate(date);
      const isToday = this._isToday(date);
      
      html += `
        <div class="progress-timeline__group ${isToday ? 'progress-timeline__group--today' : ''}"
             style="animation-delay: ${groupIndex * 100}ms">
          ${this.options.showDates ? `
            <div class="progress-timeline__date">
              <span class="progress-timeline__date-text">${formattedDate}</span>
              ${isToday ? '<span class="progress-timeline__today-badge">Today</span>' : ''}
            </div>
          ` : ''}
          <div class="progress-timeline__items">
      `;
      
      dayItems.forEach((item, itemIndex) => {
        html += this._renderItem(item, itemIndex);
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Add streak indicator if present
    const currentStreak = this._getCurrentStreak();
    if (currentStreak > 0) {
      html += `
        <div class="progress-timeline__streak">
          <span class="progress-timeline__streak-icon">🔥</span>
          <span class="progress-timeline__streak-value">${currentStreak}</span>
          <span class="progress-timeline__streak-label">day streak</span>
        </div>
      `;
    }
    
    this.element.innerHTML = html;
    this.container.appendChild(this.element);
    
    // Animate in
    if (this.options.animate) {
      this._animateIn();
    }
    
    return this;
  }
  
  /**
   * Update timeline with new data
   * @param {Object} newData - New activities and milestones
   */
  update(newData) {
    if (newData.activities) this.options.activities = newData.activities;
    if (newData.milestones) this.options.milestones = newData.milestones;
    
    if (this.element) {
      this.element.remove();
    }
    
    this.render();
  }
  
  /**
   * Add a new activity item
   * @param {Object} activity - Activity to add
   */
  addActivity(activity) {
    this.options.activities.unshift(activity);
    
    // Trim to max
    if (this.options.activities.length > this.options.maxItems) {
      this.options.activities = this.options.activities.slice(0, this.options.maxItems);
    }
    
    this.update({});
  }
  
  /**
   * Set loading state
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.element?.classList.add('progress-timeline--loading');
    } else {
      this.element?.classList.remove('progress-timeline--loading');
    }
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
   * Prepare and sort items
   * @private
   */
  _prepareItems() {
    const activityItems = this.options.activities.map(a => ({
      ...a,
      category: 'activity',
      sortDate: new Date(a.timestamp || a.date)
    }));
    
    const milestoneItems = this.options.milestones.map(m => ({
      ...m,
      category: 'milestone',
      sortDate: new Date(m.date || m.timestamp)
    }));
    
    return [...activityItems, ...milestoneItems]
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, this.options.maxItems);
  }
  
  /**
   * Group items by date
   * @private
   */
  _groupByDate(items) {
    const groups = {};
    
    items.forEach(item => {
      // Validate sortDate before using
      let dateKey = 'unknown';
      if (item.sortDate && item.sortDate instanceof Date && !isNaN(item.sortDate.getTime())) {
        dateKey = item.sortDate.toISOString().split('T')[0];
      } else if (typeof item.sortDate === 'string') {
        dateKey = item.sortDate.split('T')[0];
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    return groups;
  }
  
  /**
   * Render single item
   * @private
   */
  _renderItem(item, index) {
    const icon = this._getItemIcon(item);
    const colorClass = this._getItemColorClass(item);
    const time = this._formatTime(item.sortDate);
    const score = item.score !== undefined ? Math.round(item.score * 100) : null;
    
    return `
      <div class="progress-timeline__item progress-timeline__item--${item.category} progress-timeline__item--${colorClass}"
           style="animation-delay: ${index * 50}ms">
        <div class="progress-timeline__item-marker">
          <span class="progress-timeline__item-icon">${icon}</span>
        </div>
        <div class="progress-timeline__item-content">
          <div class="progress-timeline__item-title">${item.title}</div>
          <div class="progress-timeline__item-meta">
            <span class="progress-timeline__item-time">${time}</span>
            ${score !== null ? `
              <span class="progress-timeline__item-score progress-timeline__item-score--${this._getScoreClass(score)}">
                ${score}%
              </span>
            ` : ''}
            ${item.type ? `
              <span class="progress-timeline__item-type">${this._formatType(item.type)}</span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render empty state
   * @private
   */
  _renderEmpty() {
    this.element = document.createElement('div');
    this.element.className = 'progress-timeline progress-timeline--empty';
    this.element.innerHTML = `
      <div class="progress-timeline__empty">
        <span class="progress-timeline__empty-icon">📅</span>
        <p class="progress-timeline__empty-text">No recent activity</p>
        <p class="progress-timeline__empty-subtext">Start learning to build your timeline!</p>
      </div>
    `;
    this.container.appendChild(this.element);
  }
  
  /**
   * Get icon for item
   * @private
   */
  _getItemIcon(item) {
    if (item.category === 'milestone') {
      const milestoneIcons = {
        course_start: '🚀',
        course_complete: '🎓',
        streak: '🔥',
        achievement: '🏆',
        badge: '🎖️',
        level_up: '⬆️'
      };
      return milestoneIcons[item.type] || '⭐';
    }
    
    const activityIcons = {
      lesson: '📖',
      quiz: '📝',
      challenge: '⚡',
      'drag-drop': '🎯',
      'fill-blank': '✏️',
      'multiple-choice': '☑️',
      video: '🎬',
      practice: '💪'
    };
    return activityIcons[item.type] || '📚';
  }
  
  /**
   * Get color class for item
   * @private
   */
  _getItemColorClass(item) {
    if (item.category === 'milestone') {
      return 'milestone';
    }
    
    if (item.score !== undefined) {
      if (item.score >= 0.8) return 'success';
      if (item.score >= 0.6) return 'warning';
      return 'error';
    }
    
    return 'default';
  }
  
  /**
   * Get score color class
   * @private
   */
  _getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
  
  /**
   * Format date for display
   * @private
   */
  _formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (this._isSameDay(date, today)) return 'Today';
    if (this._isSameDay(date, yesterday)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  /**
   * Format time for display
   * @private
   */
  _formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  /**
   * Format activity type
   * @private
   */
  _formatType(type) {
    return type.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  /**
   * Check if date is today
   * @private
   */
  _isToday(dateStr) {
    return this._isSameDay(new Date(dateStr), new Date());
  }
  
  /**
   * Check if two dates are same day
   * @private
   */
  _isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
  
  /**
   * Get current streak from milestones
   * @private
   */
  _getCurrentStreak() {
    const streakMilestone = this.options.milestones.find(m => m.type === 'streak');
    return streakMilestone?.value || 0;
  }
  
  /**
   * Animate timeline in
   * @private
   */
  _animateIn() {
    if (typeof anime === 'undefined') return;
    
    anime({
      targets: '.progress-timeline__group',
      opacity: [0, 1],
      translateX: [-20, 0],
      delay: anime.stagger(100),
      easing: 'easeOutCubic',
      duration: 500
    });
    
    anime({
      targets: '.progress-timeline__item',
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(50, { start: 200 }),
      easing: 'easeOutCubic',
      duration: 400
    });
  }
}

// Export for module and global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressTimeline;
}
window.ProgressTimeline = ProgressTimeline;
