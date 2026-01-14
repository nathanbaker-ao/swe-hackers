/**
 * ChallengePuzzle - Interactive diagram challenges
 * 
 * Challenge Types:
 * 1. "connect-edges" - Given nodes, draw the correct edges
 * 2. "place-nodes" - Given edge structure, drag nodes to correct positions
 */

class ChallengePuzzle {
  constructor(containerId, challengeData, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.challengeData = challengeData;
    
    this.options = {
      onComplete: options.onComplete || (() => {}),
      onProgress: options.onProgress || (() => {}),
      ...options
    };
    
    this.cy = null;
    this.userEdges = new Set();
    this.correctEdges = new Set();
    this.selectedNode = null;
    this.isComplete = false;
    this.tooltip = null;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('ChallengePuzzle: Container not found:', this.containerId);
      return;
    }
    
    // Build the challenge UI
    this.container.innerHTML = this.buildUI();
    
    // Create tooltip element
    this.createTooltip();
    
    // Initialize based on challenge type
    if (this.challengeData.type === 'connect-edges') {
      this.initEdgeChallenge();
    } else if (this.challengeData.type === 'place-nodes') {
      this.initPlacementChallenge();
    }
  }
  
  buildUI() {
    return `
      <div class="puzzle-header">
        <div class="puzzle-instruction">${this.challengeData.instruction}</div>
        <div class="puzzle-progress">
          <span class="progress-text">0/${this.getTargetCount()} correct</span>
        </div>
      </div>
      <div class="puzzle-canvas" id="${this.containerId}-canvas"></div>
      <div class="puzzle-controls">
        ${this.challengeData.type === 'connect-edges' ? `
          <button class="puzzle-btn puzzle-clear">🗑️ Clear</button>
          <button class="puzzle-btn puzzle-fit">⊡ Fit View</button>
        ` : `
          <button class="puzzle-btn puzzle-reset">↩️ Reset</button>
          <button class="puzzle-btn puzzle-fit">⊡ Fit View</button>
        `}
        <button class="puzzle-btn puzzle-check">✓ Check Answer</button>
      </div>
      <div class="puzzle-feedback"></div>
    `;
  }
  
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'puzzle-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(30, 30, 50, 0.95);
      border: 1px solid rgba(121, 134, 203, 0.5);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: #e8e8f0;
      pointer-events: none;
      opacity: 0;
      transform: translateY(5px);
      transition: opacity 0.2s, transform 0.2s;
      z-index: 1000;
      max-width: 200px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.tooltip);
  }
  
  showTooltip(node, event) {
    const nodeData = node.data();
    const description = this.challengeData.nodeDescriptions?.[nodeData.id] || nodeData.label;
    
    this.tooltip.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.25rem;">${nodeData.label}</div>
      ${description !== nodeData.label ? `<div style="color: #b8b8c8; font-size: 0.8rem;">${description}</div>` : ''}
    `;
    
    const canvas = this.container.querySelector('.puzzle-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    // Position tooltip near the node
    const pos = node.renderedPosition();
    let left = pos.x + canvasRect.left - containerRect.left + 50;
    let top = pos.y + canvasRect.top - containerRect.top - 20;
    
    // Keep tooltip in bounds
    if (left + 200 > containerRect.width) {
      left = pos.x + canvasRect.left - containerRect.left - 220;
    }
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'translateY(0)';
  }
  
  hideTooltip() {
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(5px)';
  }
  
  getTargetCount() {
    if (this.challengeData.type === 'connect-edges') {
      return this.challengeData.solution.edges.length;
    }
    return this.challengeData.solution.positions.length;
  }
  
  // ============================================
  // Edge Connection Challenge
  // ============================================
  
  initEdgeChallenge() {
    const canvasId = `${this.containerId}-canvas`;
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
      console.error('ChallengePuzzle: Canvas not found:', canvasId);
      return;
    }
    
    // Store correct edges for checking
    this.challengeData.solution.edges.forEach(edge => {
      this.correctEdges.add(`${edge.source}->${edge.target}`);
    });
    
    // Create elements - just nodes with data, no position (will use layout)
    const elements = this.challengeData.nodes.map(n => ({
      data: { id: n.id, label: n.label }
    }));
    
    // Initialize Cytoscape with grid layout
    this.cy = cytoscape({
      container: canvas,
      elements: elements,
      style: this.getEdgeChallengeStyles(),
      layout: {
        name: 'grid',
        rows: 2,
        cols: Math.ceil(this.challengeData.nodes.length / 2),
        padding: 40,
        avoidOverlap: true,
        condense: false
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: true,
      minZoom: 0.4,
      maxZoom: 2.5
    });
    
    // Fit to viewport after layout completes
    this.cy.on('layoutstop', () => {
      this.cy.fit(undefined, 25);
    });
    
    // Node interactions
    this.cy.on('tap', 'node', (e) => this.handleNodeTap(e));
    this.cy.on('tap', (e) => {
      if (e.target === this.cy) this.clearSelection();
    });
    this.cy.on('tap', 'edge', (e) => this.handleEdgeTap(e));
    
    // Hover tooltips
    this.cy.on('mouseover', 'node', (e) => this.showTooltip(e.target, e));
    this.cy.on('mouseout', 'node', () => this.hideTooltip());
    
    // Setup control buttons
    this.container.querySelector('.puzzle-clear')?.addEventListener('click', () => this.clearAllEdges());
    this.container.querySelector('.puzzle-fit')?.addEventListener('click', () => {
      this.cy.fit(undefined, 40);
      this.cy.center();
    });
    this.container.querySelector('.puzzle-check')?.addEventListener('click', () => this.checkAnswer());
  }
  
  handleNodeTap(e) {
    const node = e.target;
    
    if (!this.selectedNode) {
      this.selectedNode = node;
      node.addClass('selected');
      this.updateInstruction('Now click the target node to connect →');
    } else {
      if (this.selectedNode.id() !== node.id()) {
        this.addUserEdge(this.selectedNode.id(), node.id());
      }
      this.clearSelection();
    }
  }
  
  handleEdgeTap(e) {
    const edge = e.target;
    const edgeKey = `${edge.data('source')}->${edge.data('target')}`;
    this.userEdges.delete(edgeKey);
    edge.remove();
    this.updateProgress();
  }
  
  addUserEdge(sourceId, targetId) {
    const edgeKey = `${sourceId}->${targetId}`;
    const reverseKey = `${targetId}->${sourceId}`;
    
    if (this.userEdges.has(edgeKey) || this.userEdges.has(reverseKey)) {
      return;
    }
    
    this.userEdges.add(edgeKey);
    
    this.cy.add({
      group: 'edges',
      data: { 
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId, 
        target: targetId,
        userCreated: true
      }
    });
    
    this.updateProgress();
  }
  
  clearSelection() {
    if (this.selectedNode) {
      this.selectedNode.removeClass('selected');
      this.selectedNode = null;
    }
    this.updateInstruction(this.challengeData.instruction);
  }
  
  clearAllEdges() {
    this.cy.edges().remove();
    this.userEdges.clear();
    this.updateProgress();
  }
  
  // ============================================
  // Node Placement Challenge
  // ============================================
  
  initPlacementChallenge() {
    const canvasId = `${this.containerId}-canvas`;
    
    const elements = [
      ...this.challengeData.nodes.map(n => ({
        data: n,
        position: this.getScrambledPosition(n.id)
      })),
      ...this.challengeData.edges.map(e => ({ data: e }))
    ];
    
    this.cy = cytoscape({
      container: document.getElementById(canvasId),
      elements: elements,
      style: this.getPlacementChallengeStyles(),
      layout: { name: 'preset' },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.5,
      maxZoom: 2
    });
    
    // Fit to viewport
    setTimeout(() => {
      this.cy.fit(undefined, 40);
      this.cy.center();
    }, 50);
    
    this.originalPositions = {};
    this.cy.nodes().forEach(node => {
      this.originalPositions[node.id()] = { ...node.position() };
      node.grabify();
    });
    
    this.cy.on('dragfree', 'node', () => this.updateProgress());
    
    // Hover tooltips
    this.cy.on('mouseover', 'node', (e) => this.showTooltip(e.target, e));
    this.cy.on('mouseout', 'node', () => this.hideTooltip());
    
    this.container.querySelector('.puzzle-reset')?.addEventListener('click', () => this.resetPositions());
    this.container.querySelector('.puzzle-fit')?.addEventListener('click', () => {
      this.cy.fit(undefined, 40);
      this.cy.center();
    });
    this.container.querySelector('.puzzle-check')?.addEventListener('click', () => this.checkAnswer());
  }
  
  getScrambledPosition(nodeId) {
    const canvas = this.container.querySelector('.puzzle-canvas');
    const width = canvas?.offsetWidth || 400;
    const height = canvas?.offsetHeight || 300;
    
    return {
      x: 80 + Math.random() * (width - 160),
      y: 60 + Math.random() * (height - 120)
    };
  }
  
  resetPositions() {
    this.cy.nodes().forEach(node => {
      node.position(this.originalPositions[node.id()]);
    });
    this.cy.fit(undefined, 40);
    this.updateProgress();
  }
  
  // ============================================
  // Shared Methods
  // ============================================
  
  updateInstruction(text) {
    const el = this.container.querySelector('.puzzle-instruction');
    if (el) el.textContent = text;
  }
  
  updateProgress() {
    let correct = 0;
    let total = this.getTargetCount();
    
    if (this.challengeData.type === 'connect-edges') {
      this.userEdges.forEach(edgeKey => {
        const [source, target] = edgeKey.split('->');
        const reverseKey = `${target}->${source}`;
        if (this.correctEdges.has(edgeKey) || this.correctEdges.has(reverseKey)) {
          correct++;
        }
      });
    } else {
      this.cy.nodes().forEach(node => {
        if (this.isNodeCorrectlyPlaced(node)) correct++;
      });
    }
    
    const progressText = this.container.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${correct}/${total} correct`;
    }
    
    this.options.onProgress({ correct, total });
  }
  
  isNodeCorrectlyPlaced(node) {
    const solution = this.challengeData.solution.positions.find(p => p.id === node.id());
    if (!solution) return false;
    
    const pos = node.position();
    const tolerance = 50;
    
    return Math.abs(pos.x - solution.x) < tolerance && 
           Math.abs(pos.y - solution.y) < tolerance;
  }
  
  checkAnswer() {
    if (this.isComplete) return;
    
    let correct = 0;
    let total = this.getTargetCount();
    let incorrect = 0;
    
    if (this.challengeData.type === 'connect-edges') {
      const userEdgeKeys = Array.from(this.userEdges);
      
      userEdgeKeys.forEach(edgeKey => {
        const [source, target] = edgeKey.split('->');
        const reverseKey = `${target}->${source}`;
        if (this.correctEdges.has(edgeKey) || this.correctEdges.has(reverseKey)) {
          correct++;
          this.cy.edges(`[source="${source}"][target="${target}"]`).addClass('correct');
        } else {
          incorrect++;
          this.cy.edges(`[source="${source}"][target="${target}"]`).addClass('incorrect');
        }
      });
      
      const missing = total - correct;
      this.showFeedback(correct, total, incorrect, missing);
      
    } else {
      this.cy.nodes().forEach(node => {
        if (this.isNodeCorrectlyPlaced(node)) {
          correct++;
          node.addClass('correct');
        } else {
          incorrect++;
          node.addClass('incorrect');
        }
      });
      
      this.showFeedback(correct, total, incorrect, 0);
    }
    
    if (correct === total && incorrect === 0) {
      this.isComplete = true;
      this.options.onComplete({
        correct,
        total,
        score: Math.round((correct / total) * 100)
      });
    }
  }
  
  showFeedback(correct, total, incorrect, missing) {
    const feedbackEl = this.container.querySelector('.puzzle-feedback');
    if (!feedbackEl) return;
    
    const isPerfect = correct === total && incorrect === 0;
    
    let message = '';
    let className = '';
    
    if (isPerfect) {
      message = `🎉 Perfect! All ${total} connections correct!`;
      className = 'success';
    } else if (correct > 0) {
      message = `${correct}/${total} correct`;
      if (incorrect > 0) message += ` • ${incorrect} wrong`;
      if (missing > 0) message += ` • ${missing} missing`;
      className = 'partial';
    } else {
      message = `Not quite right. Try again!`;
      className = 'error';
    }
    
    feedbackEl.innerHTML = `
      <div class="feedback-result ${className}">
        <span class="feedback-text">${message}</span>
        ${isPerfect ? `<span class="feedback-xp">+${this.challengeData.xp || 50} XP</span>` : ''}
      </div>
    `;
    feedbackEl.classList.add('visible');
    
    if (!isPerfect) {
      setTimeout(() => {
        this.cy.elements().removeClass('incorrect');
        feedbackEl.classList.remove('visible');
      }, 2500);
    }
  }
  
  // ============================================
  // Cytoscape Styles
  // ============================================
  
  getEdgeChallengeStyles() {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#2a2a4a',
          'border-width': 2,
          'border-color': '#7986cb',
          'color': '#e8e8f0',
          'font-size': '11px',
          'width': 90,
          'height': 45,
          'shape': 'roundrectangle',
          'text-wrap': 'wrap',
          'text-max-width': '80px',
          'cursor': 'pointer',
          'transition-property': 'border-color, border-width, background-color',
          'transition-duration': '0.2s'
        }
      },
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0
        }
      },
      {
        selector: 'node.selected',
        style: {
          'border-color': '#4db6ac',
          'border-width': 3,
          'background-color': '#3a3a5a'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#7986cb',
          'target-arrow-color': '#7986cb',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.2,
          'transition-property': 'line-color, target-arrow-color, width',
          'transition-duration': '0.2s'
        }
      },
      {
        selector: 'edge.correct',
        style: {
          'line-color': '#4db6ac',
          'target-arrow-color': '#4db6ac',
          'width': 3
        }
      },
      {
        selector: 'edge.incorrect',
        style: {
          'line-color': '#ef5350',
          'target-arrow-color': '#ef5350',
          'width': 3
        }
      }
    ];
  }
  
  getPlacementChallengeStyles() {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#2a2a4a',
          'border-width': 2,
          'border-color': '#7986cb',
          'color': '#e8e8f0',
          'font-size': '11px',
          'width': 90,
          'height': 45,
          'shape': 'roundrectangle',
          'text-wrap': 'wrap',
          'text-max-width': '80px',
          'cursor': 'grab',
          'transition-property': 'border-color, background-color',
          'transition-duration': '0.2s'
        }
      },
      {
        selector: 'node:grabbed',
        style: {
          'cursor': 'grabbing'
        }
      },
      {
        selector: 'node.correct',
        style: {
          'border-color': '#4db6ac',
          'background-color': 'rgba(77, 182, 172, 0.2)'
        }
      },
      {
        selector: 'node.incorrect',
        style: {
          'border-color': '#ef5350',
          'background-color': 'rgba(239, 83, 80, 0.2)'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#555',
          'target-arrow-color': '#555',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.2
        }
      }
    ];
  }
}

window.ChallengePuzzle = ChallengePuzzle;
