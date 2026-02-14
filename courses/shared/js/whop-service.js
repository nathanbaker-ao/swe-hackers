/**
 * Whop Payment Service for AutoNateAI Marketplace
 * Client-side service for Whop.com checkout and access management
 *
 * Usage:
 * 1. Include script: <script src="shared/js/whop-service.js"></script>
 * 2. Access via window.WhopService
 */

const WhopService = {
  // Whop checkout base URL (public, no API key needed client-side)
  WHOP_CHECKOUT_BASE: 'https://whop.com/checkout',

  // Product catalog (hardcoded initially, can migrate to Firestore later)
  PRODUCTS: [
    {
      id: 'linkedin-boolean-pack',
      name: 'LinkedIn Boolean Search Pack',
      description: 'Advanced Boolean search strings for LinkedIn. Find hiring managers, decision-makers, and hidden job postings with precision targeting.',
      price: 29,
      platform: 'linkedin',
      platformIcon: '💼',
      whopProductId: 'prod_XXXXXXXXX1',
      tags: ['boolean', 'linkedin', 'job-search'],
      featured: true
    },
    {
      id: 'facebook-groups-pack',
      name: 'Facebook Groups Search Pack',
      description: 'Curated search queries to find high-value Facebook groups where 6-figure opportunities are shared daily.',
      price: 19,
      platform: 'facebook',
      platformIcon: '📘',
      whopProductId: 'prod_XXXXXXXXX2',
      tags: ['facebook', 'groups', 'networking']
    },
    {
      id: 'reddit-opportunity-pack',
      name: 'Reddit Opportunity Finder Pack',
      description: 'Search strings optimized for Reddit to surface freelance gigs, contract roles, and startup opportunities across key subreddits.',
      price: 19,
      platform: 'reddit',
      platformIcon: '🤖',
      whopProductId: 'prod_XXXXXXXXX3',
      tags: ['reddit', 'freelance', 'contracts']
    },
    {
      id: 'multi-platform-bundle',
      name: 'Multi-Platform Power Bundle',
      description: 'Our complete collection: LinkedIn + Facebook + Reddit search packs. The ultimate toolkit for sourcing 6-figure opportunities everywhere.',
      price: 49,
      platform: 'multi',
      platformIcon: '🚀',
      whopProductId: 'prod_XXXXXXXXX4',
      tags: ['bundle', 'all-platforms', 'best-value'],
      featured: true
    },
    {
      id: 'twitter-x-search-pack',
      name: 'Twitter/X Opportunity Pack',
      description: 'Advanced search operators for Twitter/X to find job leads, consulting opportunities, and industry connections in real-time.',
      price: 19,
      platform: 'twitter',
      platformIcon: '🐦',
      whopProductId: 'prod_XXXXXXXXX5',
      tags: ['twitter', 'real-time', 'networking']
    },
    {
      id: 'google-dorking-pack',
      name: 'Google Dorking for Jobs Pack',
      description: 'Google search operators that bypass job boards entirely. Find unlisted positions, company career pages, and direct hiring manager contacts.',
      price: 24,
      platform: 'google',
      platformIcon: '🔍',
      whopProductId: 'prod_XXXXXXXXX6',
      tags: ['google', 'advanced-search', 'hidden-jobs']
    }
  ],

  /**
   * Get all available products
   * @returns {Array} Array of product objects
   */
  getProducts() {
    return this.PRODUCTS.filter(p => true); // All active products
  },

  /**
   * Get a single product by ID
   * @param {string} productId
   * @returns {Object|null}
   */
  getProduct(productId) {
    return this.PRODUCTS.find(p => p.id === productId) || null;
  },

  /**
   * Get featured products
   * @returns {Array}
   */
  getFeaturedProducts() {
    return this.PRODUCTS.filter(p => p.featured);
  },

  /**
   * Create a Whop checkout session
   * Redirects user to Whop.com for payment
   * @param {string} productId - The product to purchase
   * @param {string} email - User's email (for linking purchase)
   */
  createCheckout(productId, email) {
    const product = this.getProduct(productId);
    if (!product) {
      console.error('WhopService: Product not found:', productId);
      return;
    }

    // Store pending purchase info in sessionStorage
    // This allows us to link the purchase after redirect back
    sessionStorage.setItem('pendingPurchase', JSON.stringify({
      productId: product.id,
      whopProductId: product.whopProductId,
      email: email || '',
      timestamp: Date.now()
    }));

    // Build Whop checkout URL
    // The return URL will include our site so we can handle post-purchase
    const returnUrl = `${window.location.origin}${this._detectBaseUrl()}shop.html?purchased=${product.id}`;
    const checkoutUrl = `${this.WHOP_CHECKOUT_BASE}/${product.whopProductId}?d=${encodeURIComponent(returnUrl)}`;

    // Redirect to Whop checkout
    window.location.href = checkoutUrl;
  },

  /**
   * Check if user has access to a specific product
   * Reads from Firestore user library
   * @param {string} productId
   * @returns {Promise<boolean>}
   */
  async checkAccess(productId) {
    const user = window.AuthService?.getUser();
    if (!user) return false;

    try {
      const db = window.FirebaseApp.getDb();
      if (!db) return false;

      const libraryDoc = await db
        .collection('users')
        .doc(user.uid)
        .collection('library')
        .doc(productId)
        .get();

      return libraryDoc.exists && libraryDoc.data().accessGranted === true;
    } catch (error) {
      console.error('WhopService: Error checking access:', error);
      return false;
    }
  },

  /**
   * Get user's purchased product library
   * @returns {Promise<Array>} Array of purchased product objects with metadata
   */
  async getLibrary() {
    const user = window.AuthService?.getUser();
    if (!user) return [];

    try {
      const db = window.FirebaseApp.getDb();
      if (!db) return [];

      const librarySnapshot = await db
        .collection('users')
        .doc(user.uid)
        .collection('library')
        .orderBy('purchasedAt', 'desc')
        .get();

      const library = [];
      librarySnapshot.forEach(doc => {
        const data = doc.data();
        const product = this.getProduct(doc.id);
        library.push({
          ...data,
          id: doc.id,
          product: product // Enrich with product details
        });
      });

      return library;
    } catch (error) {
      console.error('WhopService: Error loading library:', error);
      return [];
    }
  },

  /**
   * Detect base URL for building return URLs
   * @private
   */
  _detectBaseUrl() {
    const path = window.location.pathname;
    if (path.includes('/auth/') || path.includes('/dashboard/') ||
        path.includes('/course/') || path.includes('/blog/')) {
      return path.substring(0, path.lastIndexOf('/', path.lastIndexOf('/') - 1) + 1);
    }
    return path.substring(0, path.lastIndexOf('/') + 1);
  }
};

// Export
window.WhopService = WhopService;
