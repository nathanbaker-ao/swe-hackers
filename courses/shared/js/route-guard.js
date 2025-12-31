/**
 * Route Guard for AutoNateAI Learning Hub
 * Protects course content from unauthorized access
 */

const RouteGuard = {
  // Pages that don't require authentication
  publicPages: [
    '/index.html',
    '/auth/login.html',
    '/auth/register.html',
    '/course/',  // Course detail pages are public
  ],

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
    if (path.includes('/ch1-') || 
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

  // Initialize route guard
  init() {
    // Wait for Firebase to initialize
    if (!window.FirebaseApp || !window.AuthService) {
      console.error('Firebase or AuthService not loaded');
      return;
    }

    // Check auth state
    window.AuthService.onAuthStateChanged((user) => {
      if (!user && this.isProtectedPage()) {
        // Store the intended destination
        window.AuthService.setRedirectUrl(window.location.href);
        
        // Redirect to login
        this.redirectToLogin();
      }
    });
  },

  // Redirect to login page
  redirectToLogin() {
    // Calculate relative path to auth/login.html
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

  // Check if user is enrolled in a course
  async checkEnrollment(courseId) {
    const progress = await window.DataService.getCourseProgress(courseId);
    return progress !== null;
  },

  // Require enrollment to access lesson
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
  }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Firebase is loaded
  setTimeout(() => {
    if (window.FirebaseApp && window.AuthService) {
      RouteGuard.init();
    }
  }, 100);
});

// Export
window.RouteGuard = RouteGuard;

