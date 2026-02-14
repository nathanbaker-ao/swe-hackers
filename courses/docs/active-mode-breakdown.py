#!/usr/bin/env python3
"""
Generate the Admin/User Mode Switch Build Breakdown PDF for AutoNateAI Learning Hub.
Dark mode theme matching the platform's glass-card morphism design.
Re-run this script anytime to regenerate the PDF with the latest content.
"""

from fpdf import FPDF
from datetime import datetime

# Dark theme colors
BG_PRIMARY = (10, 10, 15)
BG_CARD = (22, 22, 42)
BG_CODE = (16, 16, 30)
TEXT_PRIMARY = (232, 232, 240)
TEXT_SECONDARY = (160, 160, 184)
TEXT_MUTED = (106, 106, 128)
ACCENT = (121, 134, 203)
ACCENT_DIM = (80, 90, 150)
SUCCESS = (102, 187, 106)
DANGER = (239, 83, 80)
CODE_TEXT = (180, 191, 255)


class FeaturePDF(FPDF):
    def header(self):
        self.set_fill_color(*BG_PRIMARY)
        self.rect(0, 0, 210, 18, "F")
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*TEXT_MUTED)
        self.set_y(5)
        self.cell(0, 8, "AutoNateAI Learning Hub  |  Admin/User Mode Switch Build Breakdown", align="L")
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.4)
        self.line(10, 16, 200, 16)
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(*TEXT_MUTED)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}  |  Generated {datetime.now().strftime('%B %d, %Y %I:%M %p')}  |  CONFIDENTIAL", align="C")

    def dark_bg(self):
        self.set_fill_color(*BG_PRIMARY)
        self.rect(0, 0, 210, 297, "F")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*TEXT_PRIMARY)
        self.ln(4)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 85, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*ACCENT)
        self.ln(2)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*TEXT_SECONDARY)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, indent=15):
        x = self.get_x()
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*TEXT_SECONDARY)
        self.set_x(x + indent)
        self.set_text_color(*ACCENT)
        self.cell(6, 5.5, ">")
        self.set_text_color(*TEXT_SECONDARY)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def code_block(self, text):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(*BG_CODE)
        self.set_text_color(*CODE_TEXT)
        self.set_x(15)
        self.multi_cell(180, 4.5, text, fill=True)
        self.ln(3)

    def status_badge(self, label, status):
        self.set_font("Helvetica", "B", 9)
        if status == "complete":
            self.set_text_color(*SUCCESS)
            badge = "[COMPLETE]"
        elif status == "in-progress":
            self.set_text_color(255, 183, 77)
            badge = "[IN PROGRESS]"
        else:
            self.set_text_color(*TEXT_MUTED)
            badge = "[PLANNED]"
        self.cell(0, 6, f"  {label}  {badge}", new_x="LMARGIN", new_y="NEXT")
        self.ln(1)


def build_pdf():
    pdf = FeaturePDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ============================================================
    # COVER / TITLE PAGE
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.ln(35)

    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(2)
    pdf.line(40, pdf.get_y(), 170, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 30)
    pdf.set_text_color(*TEXT_PRIMARY)
    pdf.cell(0, 14, "Admin / User Mode Switch", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 14, "Build Breakdown", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    pdf.set_line_width(0.5)
    pdf.line(70, pdf.get_y(), 140, pdf.get_y())
    pdf.ln(10)

    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 8, "AutoNateAI Learning Hub", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*TEXT_SECONDARY)
    pdf.cell(0, 8, f"Last Updated: {datetime.now().strftime('%B %d, %Y')}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.cell(0, 8, "Version 1.0  |  Status: Pushed to Main", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(30)

    # Purpose card
    pdf.set_fill_color(*BG_CARD)
    y = pdf.get_y()
    pdf.rect(15, y, 180, 38, "F")
    pdf.set_xy(20, y + 4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 6, "Document Purpose", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(20)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*TEXT_SECONDARY)
    pdf.multi_cell(170, 5,
        "This document provides a technical build breakdown of the Admin/User Mode Switch feature "
        "for the AutoNateAI Learning Hub. It covers the architecture, service design, toggle UI, "
        "Firestore persistence, file changes, and how the feature integrates with the existing "
        "RBAC system across all 11 dashboard pages."
    )

    # ============================================================
    # TABLE OF CONTENTS
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("Table of Contents")
    toc = [
        "1.  Feature Overview",
        "2.  Problem Statement",
        "3.  Architecture",
        "4.  ActiveModeService API",
        "5.  Toggle UI Design",
        "6.  Firestore & localStorage Schema",
        "7.  Dashboard Page Integration",
        "8.  Special Page Handling",
        "9.  File Change Map",
        "10. Security Considerations",
        "11. Verification Checklist",
    ]
    for item in toc:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*TEXT_PRIMARY)
        pdf.set_draw_color(40, 40, 60)
        y = pdf.get_y() + 6
        pdf.line(15, y, 195, y)
        pdf.cell(0, 9, f"  {item}", new_x="LMARGIN", new_y="NEXT")

    # ============================================================
    # 1. FEATURE OVERVIEW
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("1. Feature Overview")
    pdf.body_text(
        "The Admin/User Mode Switch gives admin users the ability to toggle between two "
        "interface modes across the entire dashboard:"
    )
    pdf.bullet(
        "Admin Mode: Full visibility - Basketball section, Admin section, and all "
        "admin-specific UI elements are shown in the sidebar."
    )
    pdf.bullet(
        "User Mode: Standard user experience - Admin-only sidebar sections are hidden, "
        "allowing admins to see exactly what a regular user sees."
    )
    pdf.body_text(
        "The active mode is persisted to Firestore on the user document and cached in "
        "localStorage to prevent visual flash on page load. A red-accented pill toggle "
        "is dynamically injected into the sidebar on every dashboard page, visible only "
        "to admin users. Non-admin users see no toggle and no admin sections."
    )

    # ============================================================
    # 2. PROBLEM STATEMENT
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("2. Problem Statement")
    pdf.body_text(
        "Before this feature, admin users always saw the Basketball and Admin sidebar "
        "sections on every dashboard page. This created two issues:"
    )
    pdf.sub_title("Cluttered Admin Experience")
    pdf.body_text(
        "When admins wanted to use the platform as a learner (reviewing courses, checking "
        "feed content, tracking progress), the admin-only sections added visual clutter. "
        "The admin sidebar had more items than regular users, making navigation feel "
        "different from the standard user experience."
    )
    pdf.sub_title("No Way to Preview User Experience")
    pdf.body_text(
        "Admins had no mechanism to see what a regular user would see. When building features "
        "or debugging layout issues, the only option was to log in as a non-admin test account. "
        "This slowed down development and QA workflows."
    )
    pdf.sub_title("Solution")
    pdf.body_text(
        "A single toggle in the sidebar lets admins instantly switch perspective without "
        "logging out. The mode persists across page navigations and browser sessions via "
        "Firestore, and restores instantly on page load via localStorage caching."
    )

    # ============================================================
    # 3. ARCHITECTURE
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("3. Architecture")

    pdf.sub_title("Component Overview")
    pdf.code_block(
        "+--------------------+      +------------------+\n"
        "| ActiveModeService  |----->| Firestore        |\n"
        "| (shared/js/)       |      | users/{uid}      |\n"
        "+--------------------+      | .activeMode      |\n"
        "  |  |  |                   +------------------+\n"
        "  |  |  +-- injectToggleUI()\n"
        "  |  +-- applyAdminSections()  -->  #admin-section\n"
        "  |                              -->  #basketball-section\n"
        "  +-- localStorage cache\n"
        "       autonateai_activeMode"
    )

    pdf.sub_title("Initialization Flow")
    pdf.body_text(
        "1. Page loads, Firebase auth resolves.\n"
        "2. Dashboard page calls ActiveModeService.init().\n"
        "3. Service checks admin role via RBACService.hasRole('admin').\n"
        "4. If not admin: set mode to 'user', return (no toggle, no admin sections).\n"
        "5. If admin: read localStorage cache (prevents flash).\n"
        "6. Read Firestore users/{uid}.activeMode (source of truth).\n"
        "7. Apply sidebar visibility based on mode.\n"
        "8. Inject toggle UI into sidebar."
    )

    pdf.sub_title("Toggle Flow")
    pdf.body_text(
        "1. Admin clicks toggle switch in sidebar.\n"
        "2. Mode flips ('admin' <-> 'user').\n"
        "3. localStorage updated immediately.\n"
        "4. Sidebar sections show/hide instantly.\n"
        "5. Toggle indicator updates ('Admin' / 'User').\n"
        "6. Firestore write (async, non-blocking).\n"
        "7. Registered listeners notified."
    )

    # ============================================================
    # 4. ACTIVEMODESERVICE API
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("4. ActiveModeService API")

    pdf.sub_title("init()")
    pdf.body_text("Called after auth is ready. Checks admin role, reads mode from cache/Firestore, applies sidebar, injects toggle.")
    pdf.code_block("await window.ActiveModeService.init();")

    pdf.sub_title("getMode()")
    pdf.body_text("Returns the current mode string: 'user' or 'admin'.")
    pdf.code_block("const mode = window.ActiveModeService.getMode();\n// => 'admin' or 'user'")

    pdf.sub_title("isAdminMode()")
    pdf.body_text("Returns true if the current mode is 'admin'.")
    pdf.code_block("if (window.ActiveModeService.isAdminMode()) { ... }")

    pdf.sub_title("isAdminUser()")
    pdf.body_text("Returns true if the user has the admin role, regardless of current mode. Useful for permission checks that should not be affected by the mode toggle.")
    pdf.code_block("const canAccessAdmin = window.ActiveModeService.isAdminUser();")

    pdf.sub_title("toggle()")
    pdf.body_text("Switches mode, updates Firestore + localStorage, re-applies sidebar sections, notifies listeners.")
    pdf.code_block("await window.ActiveModeService.toggle();")

    pdf.sub_title("onModeChange(callback)")
    pdf.body_text("Register a listener that fires when mode changes. Receives the new mode string.")
    pdf.code_block(
        "window.ActiveModeService.onModeChange((mode) => {\n"
        "  console.log('Mode changed to:', mode);\n"
        "});"
    )

    pdf.sub_title("clearCache()")
    pdf.body_text("Clears the localStorage cache. Should be called on logout.")
    pdf.code_block("window.ActiveModeService.clearCache();")

    # ============================================================
    # 5. TOGGLE UI DESIGN
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("5. Toggle UI Design")

    pdf.sub_title("Visual Design")
    pdf.body_text(
        "The toggle is a red-accented (#f44336) pill switch that matches the Admin section "
        "title color. It is placed between the sidebar navigation and the user card at the "
        "bottom. The design has three elements:"
    )
    pdf.bullet("'Mode' label (uppercase, muted color) - indicates purpose")
    pdf.bullet("Toggle switch (pill shape, white knob, red when active)")
    pdf.bullet("'Admin' or 'User' indicator text (red when admin, muted when user)")

    pdf.sub_title("Collapsed Sidebar Behavior")
    pdf.body_text(
        "When the sidebar is collapsed, the 'Mode' label and indicator text are hidden "
        "via CSS (.sidebar.collapsed .mode-toggle-label, .mode-toggle-indicator { display: none }). "
        "Only the toggle switch remains visible and functional, centered in the narrow sidebar."
    )

    pdf.sub_title("Injection Strategy")
    pdf.body_text(
        "The toggle is injected by JavaScript rather than hardcoded into 11 HTML files. "
        "This provides a single source of truth - any changes to the toggle design only "
        "need to happen in active-mode-service.js. The CSS is also injected via a <style> "
        "tag to keep the feature self-contained."
    )
    pdf.code_block(
        "// Injection point in sidebar:\n"
        "//   </nav>\n"
        "//   [MODE TOGGLE INSERTED HERE]\n"
        "//   <div class=\"sidebar-user\">..."
    )

    # ============================================================
    # 6. FIRESTORE & LOCALSTORAGE SCHEMA
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("6. Firestore & localStorage Schema")

    pdf.sub_title("Firestore Field")
    pdf.code_block(
        'users/{uid}: {\n'
        '  // ... existing fields ...\n'
        '  activeMode: "admin"  // or "user"\n'
        '}'
    )
    pdf.body_text(
        "A single string field on the user document. Written with { merge: true } to avoid "
        "overwriting other fields. Read once on page load."
    )

    pdf.sub_title("localStorage Cache")
    pdf.code_block(
        'Key: "autonateai_activeMode"\n'
        'Value: {\n'
        '  "mode": "admin",\n'
        '  "uid": "abc123",\n'
        '  "ts": 1708000000000\n'
        '}'
    )
    pdf.body_text(
        "The cache includes the user ID to prevent cross-account contamination (if two "
        "accounts are used in the same browser). The timestamp enables a 1-hour TTL - "
        "after which the Firestore value is re-read to ensure consistency. The cache is "
        "cleared on logout via ActiveModeService.clearCache()."
    )

    # ============================================================
    # 7. DASHBOARD PAGE INTEGRATION
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("7. Dashboard Page Integration")

    pdf.sub_title("Script Tag Addition")
    pdf.body_text(
        "All 11 dashboard pages received a new script tag for active-mode-service.js, placed "
        "after rbac.js. Six pages (courses, challenges, progress, achievements, leaderboard, "
        "notes) were also missing rbac.js entirely, so it was added as a prerequisite. "
        "ActiveModeService depends on RBACService.hasRole('admin') to detect admin users."
    )
    pdf.code_block(
        '<script src="../shared/js/rbac.js"></script>           <!-- added to 6 pages -->\n'
        '<script src="../shared/js/active-mode-service.js"></script>  <!-- added to all 11 -->'
    )

    pdf.sub_title("RBAC Block Replacement")
    pdf.body_text("The existing RBAC admin-check block on 9 simple pages was replaced:")
    pdf.code_block(
        "// BEFORE:\n"
        "if (window.RBACService) {\n"
        "  const isAdmin = await window.RBACService.hasRole('admin');\n"
        "  if (isAdmin) {\n"
        "    document.getElementById('admin-section').style.display = 'block';\n"
        "    document.getElementById('basketball-section').style.display = 'block';\n"
        "  }\n"
        "}\n"
        "\n"
        "// AFTER:\n"
        "if (window.ActiveModeService) {\n"
        "  await window.ActiveModeService.init();\n"
        "}"
    )

    pdf.body_text("Pages using this simple replacement: profile, feed, settings, courses, challenges, progress, achievements, leaderboard, notes.")

    # ============================================================
    # 8. SPECIAL PAGE HANDLING
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("8. Special Page Handling")

    pdf.sub_title("index.html (Main Dashboard)")
    pdf.body_text(
        "The main dashboard has additional logic beyond the simple pattern:\n\n"
        "1. The isAdminUser variable is used elsewhere (notification test button), so it is "
        "set from ActiveModeService.isAdminUser() instead of a direct RBAC check.\n\n"
        "2. The basketball section has an org-based check: non-admin users who belong to the "
        "'city-high-basketball' organization should still see the basketball section. This "
        "check runs separately when the user is not in admin mode.\n\n"
        "3. A mode-change listener re-evaluates basketball section visibility when the admin "
        "toggles modes, ensuring org members retain basketball access in user mode."
    )

    pdf.sub_title("basketball-sim.html (Play Simulator)")
    pdf.body_text(
        "This page has a security access gate that prevents non-authorized users from "
        "viewing the simulator. This gate is kept unchanged - it checks org membership "
        "AND admin role, and redirects if neither is satisfied.\n\n"
        "The basketball sidebar section is not conditional on this page (it is always visible "
        "since the user is on the basketball page). Only the admin section visibility is "
        "managed by ActiveModeService.\n\n"
        "The access gate uses RBACService directly (not ActiveModeService) because it is a "
        "security check - an admin should always have access regardless of their mode toggle."
    )

    # ============================================================
    # 9. FILE CHANGE MAP
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("9. File Change Map")

    files = [
        ("shared/js/active-mode-service.js", "NEW", [
            "ActiveModeService singleton with init, toggle, getMode, isAdminMode, isAdminUser",
            "Dynamic toggle UI injection with CSS-in-JS",
            "Firestore persistence (users/{uid}.activeMode)",
            "localStorage caching with 1-hour TTL and UID binding",
            "Mode change listener system (onModeChange callback)",
        ]),
        ("dashboard/index.html", "MODIFIED", [
            "Script tag: active-mode-service.js",
            "RBAC block replaced with ActiveModeService.init()",
            "isAdminUser set from ActiveModeService.isAdminUser()",
            "Org-based basketball check for non-admin mode",
            "Mode-change listener for basketball section visibility",
        ]),
        ("dashboard/basketball-sim.html", "MODIFIED", [
            "Script tag: active-mode-service.js",
            "Admin-section display replaced with ActiveModeService.init()",
            "Access gate (RBACService check) kept unchanged for security",
        ]),
    ]

    simple_pages = [
        "profile.html", "feed.html", "settings.html", "courses.html",
        "challenges.html", "progress.html", "achievements.html",
        "leaderboard.html", "notes.html"
    ]

    for filepath, status, changes in files:
        pdf.set_font("Courier", "B", 9)
        pdf.set_text_color(*ACCENT)
        pdf.cell(0, 7, f"  courses/{filepath}  [{status}]", new_x="LMARGIN", new_y="NEXT")
        for change in changes:
            pdf.bullet(change, indent=10)
        pdf.ln(2)

    # Simple pages grouped
    pdf.set_font("Courier", "B", 9)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 7, "  courses/dashboard/{9 simple pages}  [MODIFIED]", new_x="LMARGIN", new_y="NEXT")
    pdf.bullet("Script tag: active-mode-service.js added", indent=10)
    pdf.bullet("Script tag: rbac.js added (was missing on 6 of these pages)", indent=10)
    pdf.bullet("RBAC admin-check block replaced with ActiveModeService.init()", indent=10)
    pdf.bullet("Pages: " + ", ".join(simple_pages), indent=10)

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*TEXT_PRIMARY)
    pdf.cell(0, 7, "Total: 1 new file, 11 modified files", new_x="LMARGIN", new_y="NEXT")

    # ============================================================
    # 10. SECURITY CONSIDERATIONS
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("10. Security Considerations")

    pdf.sub_title("Mode Toggle is UI-Only")
    pdf.body_text(
        "The mode toggle only affects sidebar visibility. It does NOT change the user's "
        "actual permissions. An admin in 'user' mode still has full admin access - the "
        "admin dashboard URL, Firestore rules, and API permissions are unchanged. This is "
        "intentional: the toggle is a convenience feature for UI preview, not a security "
        "boundary."
    )

    pdf.sub_title("Access Gates Remain Unchanged")
    pdf.body_text(
        "The basketball-sim.html access gate continues to use RBACService directly. An admin "
        "in 'user' mode can still access the basketball simulator. This prevents the mode "
        "toggle from accidentally locking an admin out of pages they should have access to."
    )

    pdf.sub_title("Firestore Write Uses Merge")
    pdf.body_text(
        "The activeMode field is written with { merge: true } to avoid accidentally "
        "overwriting other user document fields. Only the activeMode key is touched."
    )

    pdf.sub_title("localStorage Cache Isolation")
    pdf.body_text(
        "The cache key includes the user UID. If a different user logs into the same "
        "browser, their cached mode is not applied to the new user's session. The 1-hour "
        "TTL ensures stale cache entries are eventually refreshed from Firestore."
    )

    # ============================================================
    # 11. VERIFICATION CHECKLIST
    # ============================================================
    pdf.add_page()
    pdf.dark_bg()
    pdf.section_title("11. Verification Checklist")

    pdf.body_text("Items to verify before this feature is considered production-ready:")
    pdf.ln(2)

    checklist = [
        ("ActiveModeService loads on all 11 dashboard pages", True),
        ("Toggle appears in sidebar for admin users only", True),
        ("Toggle hidden for non-admin users", True),
        ("Admin mode shows Basketball + Admin sections", True),
        ("User mode hides Basketball + Admin sections", True),
        ("Mode persists across page navigations (localStorage)", True),
        ("Mode persists across browser sessions (Firestore)", True),
        ("Toggle works in collapsed sidebar (labels hidden)", True),
        ("Toggle works in mobile sidebar drawer", True),
        ("index.html: isAdminUser variable set correctly", True),
        ("index.html: org basketball check works in user mode", True),
        ("basketball-sim.html: access gate unchanged", True),
        ("basketball-sim.html: basketball section always visible", True),
        ("No RBAC admin-section display blocks remain in pages", True),
        ("Script tag present on all 11 pages", True),
        ("Non-admin users see no toggle, no admin sections", True),
        ("Firestore write uses merge (no field overwrite)", True),
        ("localStorage cache cleared on logout", False),
    ]

    for label, done in checklist:
        if done:
            pdf.set_text_color(*SUCCESS)
            check = "[x]"
        else:
            pdf.set_text_color(*DANGER)
            check = "[ ]"
        pdf.set_font("Courier", "B", 9.5)
        pdf.cell(10, 6, check)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(*TEXT_SECONDARY)
        pdf.cell(0, 6, label, new_x="LMARGIN", new_y="NEXT")

    # ============================================================
    # OUTPUT
    # ============================================================
    output_path = "/Users/mymac/Documents/Code/swe-hackers/courses/docs/Admin-User-Mode-Switch-Breakdown.pdf"
    pdf.output(output_path)
    print(f"PDF generated: {output_path}")
    return output_path


if __name__ == "__main__":
    build_pdf()
