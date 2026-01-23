/**
 * MetricCard Component
 * 
 * A reusable card component for displaying key metrics with animations.
 * Supports value updates with smooth transitions.
 * 
 * @example
 * const card = new MetricCard(container, {
 *   title: 'Overall Score',
 *   value: 847,
 *   subtitle: 'points',
 *   icon: '🎯',
 *   trend: { value: 12, direction: 'up' }
 * });
 * card.render();
 * 
 * // Later update
 * card.update(892, { value: 5, direction: 'up' });
 */

class MetricCard {
  /**
   * Create a MetricCard instance
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Card configuration
   * @param {string} options.title - Card title
   * @param {number|string} options.value - Main metric value
   * @param {string} [options.subtitle] - Subtitle or unit
   * @param {string} [options.icon] - Emoji or icon
   * @param {Object} [options.trend] - Trend indicator
   * @param {number} options.trend.value - Trend percentage or value
   * @param {string} options.trend.direction - 'up', 'down', or 'neutral'
   * @param {string} [options.format] - Value format: 'number', 'percent', 'time'
   * @param {string} [options.size] - Card size: 'small', 'medium', 'large'
   * @param {string} [options.colorScheme] - Color: 'primary', 'success', 'warning', 'error'
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      title: 'Metric',
      value: 0,
      subtitle: '',
      icon: '📊',
      trend: null,
      format: 'number',
      size: 'medium',
      colorScheme: 'primary',
      animate: true,
      ...options
    };
    
    this.element = null;
    this.valueElement = null;
    this.currentValue = 0;
  }
  
  /**
   * Render the card to the container
   * @returns {MetricCard} this instance for chaining
   */
  render() {
    if (!this.container) {
      console.error('MetricCard: No container provided');
      return this;
    }
    
    this.element = document.createElement('div');
    this.element.className = `metric-card metric-card--${this.options.size} metric-card--${this.options.colorScheme}`;
    
    const trendHtml = this._renderTrend();
    
    this.element.innerHTML = `
      <div class="metric-card__icon">${this.options.icon}</div>
      <div class="metric-card__content">
        <div class="metric-card__value-row">
          <span class="metric-card__value" data-value="${this.options.value}">--</span>
          ${this.options.subtitle ? `<span class="metric-card__unit">${this.options.subtitle}</span>` : ''}
        </div>
        <div class="metric-card__title">${this.options.title}</div>
        ${trendHtml}
      </div>
    `;
    
    this.container.appendChild(this.element);
    this.valueElement = this.element.querySelector('.metric-card__value');
    
    // Animate initial value
    if (this.options.animate) {
      this._animateValue(0, this.options.value);
    } else {
      this.valueElement.textContent = this._formatValue(this.options.value);
      this.currentValue = this.options.value;
    }
    
    return this;
  }
  
  /**
   * Update the card's value with animation
   * @param {number|string} newValue - New value to display
   * @param {Object} [newTrend] - Optional new trend data
   * @returns {MetricCard} this instance for chaining
   */
  update(newValue, newTrend = null) {
    if (!this.valueElement) {
      console.error('MetricCard: Card not rendered yet');
      return this;
    }
    
    const oldValue = this.currentValue;
    this.options.value = newValue;
    
    if (this.options.animate && typeof newValue === 'number') {
      this._animateValue(oldValue, newValue);
    } else {
      this.valueElement.textContent = this._formatValue(newValue);
      this.currentValue = newValue;
    }
    
    // Update trend if provided
    if (newTrend) {
      this.options.trend = newTrend;
      const trendEl = this.element.querySelector('.metric-card__trend');
      if (trendEl) {
        trendEl.outerHTML = this._renderTrend();
      } else {
        const content = this.element.querySelector('.metric-card__content');
        content.insertAdjacentHTML('beforeend', this._renderTrend());
      }
    }
    
    // Add pulse animation on update
    this.element.classList.add('metric-card--updated');
    setTimeout(() => {
      this.element.classList.remove('metric-card--updated');
    }, 600);
    
    return this;
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.element?.classList.add('metric-card--loading');
      if (this.valueElement) {
        this.valueElement.textContent = '--';
      }
    } else {
      this.element?.classList.remove('metric-card--loading');
    }
    return this;
  }
  
  /**
   * Set error state
   * @param {string} [message] - Optional error message
   */
  setError(message = 'Error loading data') {
    this.element?.classList.add('metric-card--error');
    if (this.valueElement) {
      this.valueElement.textContent = '--';
    }
    return this;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    this.element?.remove();
    this.element = null;
    this.valueElement = null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Render trend indicator HTML
   * @private
   */
  _renderTrend() {
    if (!this.options.trend) return '';
    
    const { value, direction } = this.options.trend;
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
    const sign = direction === 'up' ? '+' : direction === 'down' ? '' : '';
    
    return `
      <div class="metric-card__trend metric-card__trend--${direction}">
        <span class="metric-card__trend-arrow">${arrow}</span>
        <span class="metric-card__trend-value">${sign}${value}%</span>
      </div>
    `;
  }
  
  /**
   * Format value based on format option
   * @private
   */
  _formatValue(value) {
    switch (this.options.format) {
      case 'percent':
        return `${Math.round(value)}%`;
      case 'time':
        return this._formatTime(value);
      case 'number':
      default:
        if (typeof value === 'number') {
          return value >= 1000 
            ? `${(value / 1000).toFixed(1)}k`
            : Math.round(value).toLocaleString();
        }
        return value;
    }
  }
  
  /**
   * Format time value (minutes)
   * @private
   */
  _formatTime(minutes) {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  /**
   * Animate value from start to end
   * @private
   */
  _animateValue(start, end) {
    const duration = 1200;
    const startTime = performance.now();
    const isNumber = typeof end === 'number';
    
    if (!isNumber) {
      this.valueElement.textContent = this._formatValue(end);
      this.currentValue = end;
      return;
    }
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = start + (end - start) * eased;
      
      this.valueElement.textContent = this._formatValue(currentVal);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.currentValue = end;
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Export for module and global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricCard;
}
window.MetricCard = MetricCard;
