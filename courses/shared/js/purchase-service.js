/**
 * Purchase Service for AutoNateAI Marketplace
 * Handles post-purchase flow, pending purchase claiming, and purchase return handling
 *
 * Usage:
 * 1. Include script: <script src="shared/js/purchase-service.js"></script>
 * 2. Access via window.PurchaseService
 *
 * Flow:
 * 1. User clicks "Buy Now" -> WhopService.createCheckout() stores pending purchase in sessionStorage
 * 2. User completes payment on Whop -> redirected back to index.html?purchased=productId
 * 3. handlePurchaseReturn() detects the return and shows success
 * 4. If user wasn't logged in, they register/login -> claimPendingPurchase() links purchase to account
 */

const PurchaseService = {

  /**
   * Handle return from Whop checkout
   * Called on index.html load to detect ?purchased= query param
   * @returns {Object|null} Purchase info if returning from checkout, null otherwise
   */
  handlePurchaseReturn() {
    const params = new URLSearchParams(window.location.search);
    const purchasedProductId = params.get('purchased');

    if (!purchasedProductId) return null;

    // Get pending purchase info from sessionStorage
    const pendingData = sessionStorage.getItem('pendingPurchase');
    let pending = null;

    if (pendingData) {
      try {
        pending = JSON.parse(pendingData);
      } catch (e) {
        console.warn('PurchaseService: Could not parse pending purchase data');
      }
    }

    // Clean up URL (remove query params)
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    return {
      productId: purchasedProductId,
      pending: pending,
      product: window.WhopService?.getProduct(purchasedProductId) || null
    };
  },

  /**
   * Claim pending purchases for the current user
   * Called after registration or login to link any purchases made before account creation
   *
   * Flow:
   * 1. Check sessionStorage for pending purchase
   * 2. If found, write to user's library in Firestore
   * 3. Clear sessionStorage
   *
   * @returns {Promise<Object|null>} Claimed purchase info or null
   */
  async claimPendingPurchase() {
    const pendingData = sessionStorage.getItem('pendingPurchase');
    if (!pendingData) return null;

    let pending;
    try {
      pending = JSON.parse(pendingData);
    } catch (e) {
      console.warn('PurchaseService: Invalid pending purchase data');
      sessionStorage.removeItem('pendingPurchase');
      return null;
    }

    // Check if purchase is still fresh (within 1 hour)
    if (Date.now() - pending.timestamp > 3600000) {
      console.warn('PurchaseService: Pending purchase expired');
      sessionStorage.removeItem('pendingPurchase');
      return null;
    }

    const user = window.AuthService?.getUser();
    if (!user) {
      console.warn('PurchaseService: No user to claim purchase for');
      return null;
    }

    try {
      const db = window.FirebaseApp.getDb();
      if (!db) return null;

      // Write to user's library
      await db
        .collection('users')
        .doc(user.uid)
        .collection('library')
        .doc(pending.productId)
        .set({
          purchasedAt: firebase.firestore.FieldValue.serverTimestamp(),
          accessGranted: true,
          whopProductId: pending.whopProductId,
          claimedVia: 'sessionStorage',
          email: user.email
        }, { merge: true });

      // Clear pending purchase
      sessionStorage.removeItem('pendingPurchase');

      console.log('PurchaseService: Claimed purchase:', pending.productId);
      return {
        productId: pending.productId,
        product: window.WhopService?.getProduct(pending.productId) || null
      };
    } catch (error) {
      console.error('PurchaseService: Error claiming purchase:', error);
      return null;
    }
  },

  /**
   * Check if there's a pending purchase in sessionStorage
   * @returns {boolean}
   */
  hasPendingPurchase() {
    return sessionStorage.getItem('pendingPurchase') !== null;
  },

  /**
   * Get pending purchase details without clearing
   * @returns {Object|null}
   */
  getPendingPurchase() {
    const data = sessionStorage.getItem('pendingPurchase');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
};

// Export
window.PurchaseService = PurchaseService;
