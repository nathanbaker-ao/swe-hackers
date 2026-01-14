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
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('ChallengePuzzle: Container not found:', this.containerId);
      return;
    }
    
    // Build the challenge UI
    this.container.innerHTML = this.buildUI();
    
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
          <button class="puzzle-btn puzzle-clear">🗑️ Clear Edges</button>
        ` : `
          <button class="puzzle-btn puzzle-reset">↩️ Reset Positions</button>
        `}
        <button class="puzzle-btn puzzle-check" disabled>✓ Check Answer</button>
      </div>
      <div class="puzzle-feedback"></div>
    `;
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
    
    // Store correct edges for checking
    this.challengeData.solution.edges.forEach(edge => {
      this.correctEdges.add(`${edge.source}->${edge.target}`);
    });
    
    // Initialize Cytoscape with nodes only (no edges - user adds them)
    this.cy = cytoscape({
      container: document.getElementById(canvasId),
      elements: this.challengeData.nodes.map(n => ({ data: n })),
      style: this.getEdgeChallengeStyles(),
      layout: { name: 'preset' },
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true // Nodes can't be moved
    });
    
    // Click handlers for edge creation
    this.cy.on('tap', 'node', (e) => this.handleNodeTap(e));
    this.cy.on('tap', (e) => {
      if (e.target === this.cy) this.clearSelection();
    });
    
    // Edge click to remove
    this.cy.on('tap', 'edge', (e) => this.handleEdgeTap(e));
    
    // Setup control buttons
    this.container.querySelector('.puzzle-clear')?.addEventListener('click', () => this.clearAllEdges());
    this.container.querySelector('.puzzle-check')?.addEventListener('click', () => this.checkAnswer());
  }
  
  handleNodeTap(e) {
    const node = e.target;
    
    if (!this.selectedNode) {
      // First node selected - start edge
      this.selectedNode = node;
      node.addClass('selected');
      this.updateInstruction('Now click the target node to connect');
    } else {
      // Second node selected - create edge
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
    
    // Check if edge already exists (either direction)
    if (this.userEdges.has(edgeKey) || this.userEdges.has(reverseKey)) {
      return;
    }
    
    this.userEdges.add(edgeKey);
    
    // Determine if this edge is correct
    const isCorrect = this.correctEdges.has(edgeKey) || this.correctEdges.has(reverseKey);
    
    this.cy.add({
      group: 'edges',
      data: { 
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId, 
        target: targetId,
        userCreated: true,
        isCorrect: isCorrect
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
    
    // Create elements with edges but scrambled node positions
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
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false
    });
    
    // Store original scrambled positions for reset
    this.originalPositions = {};
    this.cy.nodes().forEach(node => {
      this.originalPositions[node.id()] = { ...node.position() };
    });
    
    // Enable dragging
    this.cy.nodes().forEach(node => {
      node.grabify();
    });
    
    // Track when nodes are moved
    this.cy.on('dragfree', 'node', () => this.updateProgress());
    
    // Setup control buttons
    this.container.querySelector('.puzzle-reset')?.addEventListener('click', () => this.resetPositions());
    this.container.querySelector('.puzzle-check')?.addEventListener('click', () => this.checkAnswer());
  }
  
  getScrambledPosition(nodeId) {
    // Find the correct position
    const correct = this.challengeData.solution.positions.find(p => p.id === nodeId);
    const canvas = this.container.querySelector('.puzzle-canvas');
    const width = canvas?.offsetWidth || 400;
    const height = canvas?.offsetHeight || 300;
    
    // Return a random position (scrambled)
    return {
      x: 50 + Math.random() * (width - 100),
      y: 50 + Math.random() * (height - 100)
    };
  }
  
  resetPositions() {
    this.cy.nodes().forEach(node => {
      node.position(this.originalPositions[node.id()]);
    });
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
      // Count correct edges
      this.userEdges.forEach(edgeKey => {
        const [source, target] = edgeKey.split('->');
        const reverseKey = `${target}->${source}`;
        if (this.correctEdges.has(edgeKey) || this.correctEdges.has(reverseKey)) {
          correct++;
        }
      });
    } else {
      // Count correctly placed nodes
      this.cy.nodes().forEach(node => {
        if (this.isNodeCorrectlyPlaced(node)) {
          correct++;
        }
      });
    }
    
    // Update progress text
    const progressText = this.container.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${correct}/${total} correct`;
    }
    
    // Enable check button when user has made attempts
    const checkBtn = this.container.querySelector('.puzzle-check');
    if (checkBtn) {
      checkBtn.disabled = this.userEdges.size === 0 && this.challengeData.type === 'connect-edges';
    }
    
    this.options.onProgress({ correct, total });
  }
  
  isNodeCorrectlyPlaced(node) {
    const solution = this.challengeData.solution.positions.find(p => p.id === node.id());
    if (!solution) return false;
    
    const pos = node.position();
    const tolerance = 50; // pixels
    
    return Math.abs(pos.x - solution.x) < tolerance && 
           Math.abs(pos.y - solution.y) < tolerance;
  }
  
  checkAnswer() {
    if (this.isComplete) return;
    
    let correct = 0;
    let total = this.getTargetCount();
    let incorrect = 0;
    
    if (this.challengeData.type === 'connect-edges') {
      // Check edges
      const userEdgeKeys = Array.from(this.userEdges);
      
      userEdgeKeys.forEach(edgeKey => {
        const [source, target] = edgeKey.split('->');
        const reverseKey = `${target}->${source}`;
        if (this.correctEdges.has(edgeKey) || this.correctEdges.has(reverseKey)) {
          correct++;
          // Mark edge as correct
          this.cy.edges(`[source="${source}"][target="${target}"]`).addClass('correct');
        } else {
          incorrect++;
          // Mark edge as incorrect
          this.cy.edges(`[source="${source}"][target="${target}"]`).addClass('incorrect');
        }
      });
      
      // Check for missing edges
      const missing = total - correct;
      
      this.showFeedback(correct, total, incorrect, missing);
      
    } else {
      // Check node positions
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
    
    // If perfect score, mark complete
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
    
    const score = Math.round((correct / total) * 100);
    const isPerfect = correct === total && incorrect === 0;
    
    let message = '';
    let className = '';
    
    if (isPerfect) {
      message = `🎉 Perfect! All ${total} connections correct!`;
      className = 'success';
    } else if (correct > 0) {
      message = `${correct}/${total} correct`;
      if (incorrect > 0) message += `, ${incorrect} wrong`;
      if (missing > 0) message += `, ${missing} missing`;
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
    
    // Clear incorrect markers after a delay so user can try again
    if (!isPerfect) {
      setTimeout(() => {
        this.cy.elements().removeClass('incorrect');
        feedbackEl.classList.remove('visible');
      }, 2000);
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
          'font-size': '12px',
          'width': 80,
          'height': 40,
          'shape': 'roundrectangle',
          'text-wrap': 'wrap',
          'text-max-width': '70px',
          'cursor': 'pointer'
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
          'line-color': '#666',
          'target-arrow-color': '#666',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.2
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
          'font-size': '12px',
          'width': 80,
          'height': 40,
          'shape': 'roundrectangle',
          'text-wrap': 'wrap',
          'text-max-width': '70px',
          'cursor': 'grab'
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

// Export
window.ChallengePuzzle = ChallengePuzzle;
