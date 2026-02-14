/**
 * Centralized Footer Component
 * Single source of truth for footer across all marketing pages
 * 
 * Usage:
 * 1. Add a container: <div id="footer-container"></div>
 * 2. Include script: <script src="shared/js/footer.js" defer></script>
 * 3. Call: FooterComponent.inject('footer-container')
 */

const FooterComponent = {
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="footer-logo-icon">🏛️</span>
              <span>AutoNateAI</span>
            </div>
            <p class="footer-desc">
              We provide the tools and knowledge to efficiently source 6-figure opportunities.
            </p>
          </div>
          
          <div class="footer-column">
            <h4>Products</h4>
            <ul class="footer-links">
              <li><a href="{{baseUrl}}shop.html">Browse Tools</a></li>
              <li><a href="{{baseUrl}}dashboard/feed.html">Feed</a></li>
              <li><a href="{{baseUrl}}dashboard/library.html">My Library</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h4>Company</h4>
            <ul class="footer-links">
              <li><a href="{{baseUrl}}about.html">About</a></li>
              <li><a href="{{baseUrl}}contact.html">Contact</a></li>
              <li><a href="{{baseUrl}}blog/">Blog</a></li>
              <li><a href="https://discord.gg/Me5N8tCdkC" target="_blank">Discord</a></li>
            </ul>
          </div>
          
          <div class="footer-column">
            <h4>Account</h4>
            <ul class="footer-links">
              <li><a href="{{baseUrl}}auth/login.html">Sign In</a></li>
              <li><a href="{{baseUrl}}auth/register.html">Create Account</a></li>
              <li><a href="{{baseUrl}}dashboard/">Dashboard</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="footer-copy">© ${new Date().getFullYear()} AutoNateAI. All rights reserved.</p>
          <div class="footer-social">
            <a href="https://discord.gg/Me5N8tCdkC" target="_blank" title="Discord">💬</a>
            <a href="https://github.com/nathanbaker-ao" target="_blank" title="GitHub">🐙</a>
            <a href="https://twitter.com/autonateai" target="_blank" title="Twitter">🐦</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  
  /**
   * Inject footer into a container element
   * @param {string} containerId - ID of the container element
   * @param {Object} options - Configuration options
   * @param {string} options.baseUrl - Base URL for links (auto-detected if not provided)
   */
  inject(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`FooterComponent: Container #${containerId} not found`);
      return;
    }
    
    const baseUrl = options.baseUrl || this.detectBaseUrl();
    const html = this.template.replace(/\{\{baseUrl\}\}/g, baseUrl);
    
    container.innerHTML = html;
  },
  
  /**
   * Detect base URL based on current page depth
   */
  detectBaseUrl() {
    const path = window.location.pathname;
    
    if (path.includes('/blog/') || 
        path.includes('/course/') || 
        path.includes('/auth/') || 
        path.includes('/dashboard/')) {
      return '../';
    }
    return '';
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FooterComponent;
}
