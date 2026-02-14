/**
 * ActiveModeService — Admin/User Mode Toggle
 *
 * Allows admin users to switch between "Admin" and "User" view.
 * When in User mode, admin-only sidebar sections (Basketball, Admin) are hidden.
 * Mode is persisted to Firestore (users/{uid}.activeMode) and cached in localStorage.
 * A toggle UI is injected into the sidebar for admin users only.
 */
const ActiveModeService = {
  _mode: 'user',
  _isAdmin: false,
  _uid: null,
  _listeners: [],
  _initialized: false,

  CACHE_KEY: 'autonateai_activeMode',
  CACHE_TTL: 60 * 60 * 1000, // 1 hour

  /**
   * Initialize the service. Call after auth is ready.
   * Checks admin role, reads mode from cache/Firestore, applies sidebar, injects toggle.
   */
  async init() {
    if (this._initialized) {
      this.applyAdminSections();
      return;
    }

    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      this._uid = user.uid;

      // Check admin role
      this._isAdmin = window.RBACService ? await window.RBACService.hasRole('admin') : false;

      if (!this._isAdmin) {
        // Non-admin users: no toggle, no admin sections
        this._mode = 'user';
        this._initialized = true;
        return;
      }

      // Try localStorage cache first (prevents flash)
      const cached = this._readCache();
      if (cached) {
        this._mode = cached;
      }

      // Read from Firestore (source of truth)
      try {
        const db = firebase.firestore();
        const doc = await db.collection('users').doc(this._uid).get();
        if (doc.exists && doc.data().activeMode) {
          this._mode = doc.data().activeMode;
        } else {
          this._mode = 'admin'; // Default for admins: admin mode
        }
        this._writeCache(this._mode);
      } catch (e) {
        console.warn('ActiveModeService: Could not read Firestore, using cache/default', e);
        if (!cached) this._mode = 'admin';
      }

      this._initialized = true;
      this.applyAdminSections();
      this.injectToggleUI();
    } catch (e) {
      console.error('ActiveModeService: init failed', e);
    }
  },

  /** Returns current mode: 'user' or 'admin' */
  getMode() {
    return this._mode;
  },

  /** Returns true if currently in admin mode */
  isAdminMode() {
    return this._mode === 'admin';
  },

  /** Returns true if user has admin role (regardless of current mode) */
  isAdminUser() {
    return this._isAdmin;
  },

  /** Toggle between admin and user mode */
  async toggle() {
    this._mode = this._mode === 'admin' ? 'user' : 'admin';
    this._writeCache(this._mode);
    this.applyAdminSections();
    this._updateToggleUI();

    // Persist to Firestore
    try {
      const db = firebase.firestore();
      await db.collection('users').doc(this._uid).set(
        { activeMode: this._mode },
        { merge: true }
      );
    } catch (e) {
      console.warn('ActiveModeService: Could not persist mode to Firestore', e);
    }

    // Notify listeners
    this._listeners.forEach(cb => {
      try { cb(this._mode); } catch (e) { console.error(e); }
    });
  },

  /** Show/hide #admin-section and #basketball-section based on mode */
  applyAdminSections() {
    const adminEl = document.getElementById('admin-section');
    const basketballEl = document.getElementById('basketball-section');
    const show = this._isAdmin && this._mode === 'admin';

    if (adminEl) adminEl.style.display = show ? 'block' : 'none';
    if (basketballEl) basketballEl.style.display = show ? 'block' : 'none';
  },

  /** Inject the toggle switch into the sidebar (between </nav> and .sidebar-user) */
  injectToggleUI() {
    if (!this._isAdmin) return;
    if (document.getElementById('mode-toggle-wrapper')) return;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      .mode-toggle-wrapper {
        padding: 10px 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
      }
      .mode-toggle-label {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .mode-toggle-switch {
        position: relative;
        width: 36px;
        min-width: 36px;
        height: 20px;
        cursor: pointer;
      }
      .mode-toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }
      .mode-toggle-slider {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.12);
        border-radius: 10px;
        transition: background 0.25s;
      }
      .mode-toggle-slider::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.25s;
      }
      .mode-toggle-switch input:checked + .mode-toggle-slider {
        background: #f44336;
      }
      .mode-toggle-switch input:checked + .mode-toggle-slider::before {
        transform: translateX(16px);
      }
      .mode-toggle-indicator {
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        transition: color 0.25s;
      }
      .mode-toggle-indicator.admin {
        color: #f44336;
      }
      .mode-toggle-indicator.user {
        color: rgba(255,255,255,0.4);
      }

      /* When sidebar is collapsed, hide labels */
      .sidebar.collapsed .mode-toggle-label,
      .sidebar.collapsed .mode-toggle-indicator {
        display: none;
      }
      .sidebar.collapsed .mode-toggle-wrapper {
        justify-content: center;
        padding: 10px 4px;
      }
    `;
    document.head.appendChild(style);

    // Build toggle HTML
    const wrapper = document.createElement('div');
    wrapper.className = 'mode-toggle-wrapper';
    wrapper.id = 'mode-toggle-wrapper';

    const isAdmin = this._mode === 'admin';
    wrapper.innerHTML = `
      <span class="mode-toggle-label">Mode</span>
      <label class="mode-toggle-switch">
        <input type="checkbox" id="mode-toggle-checkbox" ${isAdmin ? 'checked' : ''}>
        <span class="mode-toggle-slider"></span>
      </label>
      <span class="mode-toggle-indicator ${isAdmin ? 'admin' : 'user'}" id="mode-toggle-indicator">
        ${isAdmin ? 'Admin' : 'User'}
      </span>
    `;

    // Insert between </nav> and .sidebar-user
    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar ? sidebar.querySelector('nav') : null;
    const sidebarUser = sidebar ? sidebar.querySelector('.sidebar-user') : null;

    if (nav && sidebarUser) {
      sidebarUser.parentNode.insertBefore(wrapper, sidebarUser);
    } else if (nav) {
      nav.parentNode.insertBefore(wrapper, nav.nextSibling);
    }

    // Bind click
    const checkbox = document.getElementById('mode-toggle-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', () => this.toggle());
    }
  },

  /** Update toggle UI to reflect current mode */
  _updateToggleUI() {
    const checkbox = document.getElementById('mode-toggle-checkbox');
    const indicator = document.getElementById('mode-toggle-indicator');
    if (checkbox) checkbox.checked = this._mode === 'admin';
    if (indicator) {
      indicator.textContent = this._mode === 'admin' ? 'Admin' : 'User';
      indicator.className = 'mode-toggle-indicator ' + this._mode;
    }
  },

  /** Register a callback for mode changes: callback(mode) */
  onModeChange(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
  },

  /** Read cached mode from localStorage */
  _readCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.uid !== this._uid) return null;
      if (Date.now() - data.ts > this.CACHE_TTL) return null;
      return data.mode;
    } catch { return null; }
  },

  /** Write mode to localStorage cache */
  _writeCache(mode) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        mode,
        uid: this._uid,
        ts: Date.now()
      }));
    } catch { /* quota exceeded or private mode */ }
  },

  /** Clear cache (call on logout) */
  clearCache() {
    try { localStorage.removeItem(this.CACHE_KEY); } catch {}
  }
};

// Expose globally
window.ActiveModeService = ActiveModeService;
