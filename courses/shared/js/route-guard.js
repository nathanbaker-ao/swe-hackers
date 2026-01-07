/**
 * Route Guard for AutoNateAI Learning Hub
 * Protects course content from unauthorized access
 * 
 * Integrates with RBACService for role-based and organization-based access control.
 */

const RouteGuard = {
  // Pages that don't require authentication
  publicPages: [
    '/index.html',
    '/auth/login.html',
    '/auth/register.html',
    '/course/',  // Course detail pages are public
    '/catalog.html',
    '/enterprise.html',
    '/consulting.html',
    '/blog/',
    '/challenges.html'
  ],

  // Course path patterns and their required access
  coursePatterns: {
    // Partner courses (organization-specific)
    'endless-opportunities': {
      requiresAuth: true,
      requiresOrganization: 'endless-opportunities'
    },
    // Add more partner courses here as needed
    // 'matrix-capital': {
    //   requiresAuth: true,
    //   requiresOrganization: 'matrix-capital'
    // }
  },

  // Check if current page requires authentication
  isProtectedPage() {
    const path = window.location.pathname;
    
    // Check if it's a public page
    for (const publicPage of this.publicPages) {
      if (path.includes(publicPage)) {
        return false;
      }
    }
    
    // Check if it's a course lesson page (protected)
    if (path.includes('/ch0-') ||
        path.includes('/ch1-') || 
        path.includes('/ch2-') || 
        path.includes('/ch3-') || 
        path.includes('/ch4-') || 
        path.includes('/ch5-') || 
        path.includes('/ch6-')) {
      return true;
    }
    
    // Dashboard pages are protected
    if (path.includes('/dashboard/')) {
      return true;
    }
    
    return false;
  },

  /**
   * Extract course ID from current path
   * @returns {string|null} Course ID or null if not in a course
   */
  getCourseFromPath() {
    const path = window.location.pathname;
    const parts = path.split('/');
    
    // Find the courses index and get the next segment
    const coursesIndex = parts.indexOf('courses');
    if (coursesIndex !== -1 && parts[coursesIndex + 1]) {
      const potentialCourse = parts[coursesIndex + 1];
      // Exclude non-course paths
      if (!['auth', 'shared', 'dashboard', 'course', 'blog', 'assets'].includes(potentialCourse)) {
        return potentialCourse;
      }
    }
    
    return null;
  },

  /**
   * Check if current course requires organization access
   * @returns {object|null} Course access requirements or null
   */
  getCourseRequirements() {
    const courseId = this.getCourseFromPath();
    if (!courseId) return null;

    return this.coursePatterns[courseId] || null;
  },

  /**
   * Initialize route guard with RBAC integration
   */
  async init() {
    // Wait for Firebase and services to initialize
    if (!window.FirebaseApp || !window.AuthService) {
      console.error('Firebase or AuthService not loaded');
      return;
    }

    // Wait for auth state to be determined
    const user = await window.AuthService.waitForAuthState();

    // Check basic authentication for protected pages
    if (!user && this.isProtectedPage()) {
      window.AuthService.setRedirectUrl(window.location.href);
      this.redirectToLogin();
      return;
    }

    // Check organization/role-based access if RBAC is available
    if (user && window.RBACService) {
      await this.checkRBACAccess();
    }

    // Listen for future auth state changes
    window.AuthService.onAuthStateChanged(async (authUser) => {
      if (!authUser && this.isProtectedPage()) {
        window.AuthService.setRedirectUrl(window.location.href);
        this.redirectToLogin();
      }
    });
  },

  /**
   * Check RBAC-based access control
   */
  async checkRBACAccess() {
    const courseId = this.getCourseFromPath();
    if (!courseId) return; // Not in a course, skip RBAC check

    const requirements = this.getCourseRequirements();
    if (!requirements) return; // No special requirements for this course

    // Check if user can access this course
    const canAccess = await window.RBACService.canAccessCourse(courseId);

    if (!canAccess) {
      console.warn(`🔐 Access denied to course: ${courseId}`);
      
      // Determine the reason for denial
      if (requirements.requiresOrganization) {
        window.RBACService.handleAccessDenied('organization');
      } else {
        window.RBACService.handleAccessDenied('unauthorized');
      }
    }
  },

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    const path = window.location.pathname;
    let basePath = '';
    
    // Count depth from courses folder
    const parts = path.split('/');
    const coursesIndex = parts.indexOf('courses');
    if (coursesIndex !== -1) {
      const depth = parts.length - coursesIndex - 2; // -2 for courses and filename
      basePath = '../'.repeat(depth);
    }
    
    window.location.href = basePath + 'auth/login.html';
  },

  /**
   * Check if user is enrolled in a course
   */
  async checkEnrollment(courseId) {
    const progress = await window.DataService.getCourseProgress(courseId);
    return progress !== null;
  },

  /**
   * Require enrollment to access lesson
   */
  async requireEnrollment(courseId) {
    const isEnrolled = await this.checkEnrollment(courseId);
    
    if (!isEnrolled) {
      // Redirect to course detail page
      const path = window.location.pathname;
      let basePath = '';
      
      const parts = path.split('/');
      const coursesIndex = parts.indexOf('courses');
      if (coursesIndex !== -1) {
        const depth = parts.length - coursesIndex - 2;
        basePath = '../'.repeat(depth);
      }
      
      window.location.href = basePath + `course/${courseId}.html`;
      return false;
    }
    
    return true;
  },

  /**
   * Require specific role to access page
   * @param {string} requiredRole - The role required
   * @returns {Promise<boolean>}
   */
  async requireRole(requiredRole) {
    if (!window.RBACService) {
      console.warn('RBACService not available');
      return false;
    }

    const hasRole = await window.RBACService.hasRole(requiredRole);
    if (!hasRole) {
      window.RBACService.handleAccessDenied('unauthorized');
      return false;
    }
    return true;
  },

  /**
   * Require organization membership to access page
   * @param {string} organizationId - The organization required
   * @returns {Promise<boolean>}
   */
  async requireOrganization(organizationId) {
    if (!window.RBACService) {
      console.warn('RBACService not available');
      return false;
    }

    const belongs = await window.RBACService.belongsToOrganization(organizationId);
    if (!belongs) {
      window.RBACService.handleAccessDenied('organization');
      return false;
    }
    return true;
  },

  /**
   * Require admin role to access page
   * @returns {Promise<boolean>}
   */
  async requireAdmin() {
    return this.requireRole('admin');
  }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Delay to ensure Firebase and other services are loaded
  setTimeout(async () => {
    if (window.FirebaseApp && window.AuthService) {
      await RouteGuard.init();
    }
  }, 100);
});

// Export
window.RouteGuard = RouteGuard;
