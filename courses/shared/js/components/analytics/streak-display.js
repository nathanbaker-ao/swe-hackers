/**
 * StreakDisplay Component
 * 
 * Visual representation of learning streak with flame animation.
 * Shows current streak, record, and recent days.
 */

class StreakDisplay {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      currentStreak: 0,
      streakRecord: 0,
      recentDays: [], // Array of { date: 'YYYY-MM-DD', active: boolean }
      animate: true,
      ...options
    };
    
    this.element = null;
  }
  
  render() {
    if (!this.container) return this;
    
    this.container.innerHTML = '';
    
    const { currentStreak, streakRecord } = this.options;
    const isOnFire = currentStreak >= 3;
    
    this.element = document.createElement('div');
    this.element.className = 'streak-display';
    this.element.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      text-align: center;
    `;
    
    // Flame icon with animation
    const flameSize = Math.min(80, 40 + currentStreak * 5);
    const flameHTML = `
      <div class="streak-display__flame" style="
        font-size: ${flameSize}px;
        filter: ${isOnFire ? 'drop-shadow(0 0 20px rgba(251, 146, 60, 0.5))' : 'grayscale(0.5)'};
        ${this.options.animate ? 'animation: flame-pulse 1.5s ease-in-out infinite;' : ''}
      ">
        🔥
      </div>
    `;
    
    // Streak count
    const countHTML = `
      <div class="streak-display__count" style="
        font-size: 3rem;
        font-weight: 700;
        color: ${isOnFire ? 'var(--accent-warning, #f59e0b)' : 'var(--text-primary)'};
        line-height: 1;
        margin: 0.5rem 0;
      ">
        ${currentStreak}
      </div>
      <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        day streak
      </div>
    `;
    
    // Recent days visualization
    const recentDaysHTML = this._renderRecentDays();
    
    // Record badge
    const recordHTML = streakRecord > currentStreak ? `
      <div style="
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(255,255,255,0.05);
        border-radius: 20px;
        font-size: 0.8rem;
        color: var(--text-muted);
      ">
        🏆 Record: <strong style="color: var(--text-primary);">${streakRecord} days</strong>
      </div>
    ` : currentStreak === streakRecord && currentStreak > 0 ? `
      <div style="
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, rgba(251,146,60,0.2), rgba(239,68,68,0.2));
        border-radius: 20px;
        font-size: 0.8rem;
        color: var(--accent-warning);
      ">
        ✨ Personal Best!
      </div>
    ` : '';
    
    // CSS animation
    const styleTag = `
      <style>
        @keyframes flame-pulse {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
      </style>
    `;
    
    this.element.innerHTML = styleTag + flameHTML + countHTML + recentDaysHTML + recordHTML;
    this.container.appendChild(this.element);
    
    return this;
  }
  
  _renderRecentDays() {
    // Generate last 7 days if not provided
    let days = this.options.recentDays;
    if (days.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
          date: date.toISOString().split('T')[0],
          active: i < this.options.currentStreak
        });
      }
    }
    
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return `
      <div style="
        display: flex;
        gap: 6px;
        margin-top: 0.5rem;
      ">
        ${days.slice(-7).map((day, i) => {
          const date = new Date(day.date + 'T12:00:00');
          const dayIndex = date.getDay();
          const isToday = i === days.length - 1;
          
          return `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            ">
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${day.active ? 'var(--accent-warning, #f59e0b)' : 'rgba(255,255,255,0.1)'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                ${isToday ? 'box-shadow: 0 0 0 2px var(--accent-primary);' : ''}
              ">
                ${day.active ? '✓' : ''}
              </div>
              <span style="font-size: 10px; color: var(--text-muted);">${dayLabels[dayIndex]}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

// Export
if (typeof window !== 'undefined') {
  window.StreakDisplay = StreakDisplay;
}
