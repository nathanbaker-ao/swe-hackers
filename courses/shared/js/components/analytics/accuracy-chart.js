/**
 * AccuracyChart Component
 * 
 * Line chart showing quiz accuracy trend over time.
 */

class AccuracyChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      data: [], // Array of { date: 'YYYY-MM-DD', accuracy: number 0-100 }
      height: 140,
      lineColor: 'var(--accent-success, #22c55e)',
      avgColor: 'var(--accent-warning, #f59e0b)',
      ...options
    };
  }
  
  render() {
    if (!this.container) return this;
    this.container.innerHTML = '';
    
    if (this.options.data.length === 0) {
      this._renderEmpty();
      return this;
    }
    
    const data = [...this.options.data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const avg = Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length);
    
    const padding = { top: 15, right: 10, bottom: 25, left: 30 };
    const width = this.container.offsetWidth || 200;
    const height = this.options.height;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const xScale = (i) => padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const yScale = (v) => height - padding.bottom - (v / 100) * chartHeight;
    
    let svg = `<svg width="${width}" height="${height}" style="display: block;">`;
    
    // Grid lines
    [0, 50, 100].forEach(v => {
      const y = yScale(v);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
              stroke="rgba(255,255,255,0.1)" stroke-dasharray="2,2"/>`;
      svg += `<text x="${padding.left - 5}" y="${y + 3}" font-size="9" fill="var(--text-muted)" text-anchor="end">${v}%</text>`;
    });
    
    // Average line
    const avgY = yScale(avg);
    svg += `<line x1="${padding.left}" y1="${avgY}" x2="${width - padding.right}" y2="${avgY}" 
            stroke="${this.options.avgColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.6"/>`;
    
    // Line path
    const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.accuracy) }));
    if (points.length > 1) {
      const path = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
      svg += `<path d="${path}" fill="none" stroke="${this.options.lineColor}" stroke-width="2" stroke-linecap="round"/>`;
    }
    
    // Dots
    points.forEach((p, i) => {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${this.options.lineColor}"/>`;
    });
    
    // Current accuracy label
    const latest = data[data.length - 1];
    svg += `<text x="${width - padding.right}" y="${padding.top}" font-size="18" font-weight="600" 
            fill="${this.options.lineColor}" text-anchor="end">${latest.accuracy}%</text>`;
    svg += `<text x="${width - padding.right}" y="${padding.top + 12}" font-size="9" 
            fill="var(--text-muted)" text-anchor="end">latest</text>`;
    
    svg += `</svg>`;
    
    this.container.innerHTML = svg;
    return this;
  }
  
  _renderEmpty() {
    this.container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: ${this.options.height}px; color: var(--text-muted);">
        <div style="text-align: center; font-size: 0.8rem;">
          <div style="font-size: 1.5rem; opacity: 0.5;">🎯</div>
          <div>No quiz data yet</div>
        </div>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.AccuracyChart = AccuracyChart;
}
