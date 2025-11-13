# Dashboard User Acceptance Testing (UAT) - Test Cases

**Project**: DailyUse Dashboard Enhancement  
**Sprint**: Sprint 4 - Testing & Deployment  
**Task**: TASK-4.2 - User Acceptance Testing (5 SP)  
**Version**: 1.0  
**Date**: 2025-11-12  
**Status**: 🚧 Ready for Execution

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Scenarios](#test-scenarios)
4. [Acceptance Criteria](#acceptance-criteria)
5. [Sign-off Checklist](#sign-off-checklist)

---

## Overview

### Purpose

Validate that the Dashboard feature meets business requirements and provides a satisfactory user experience for end users.

### Scope

- Dashboard page overview and navigation
- Widget system functionality (display, configuration, persistence)
- Performance and responsiveness
- Error handling and edge cases
- Cross-browser and cross-device compatibility
- Accessibility compliance

### Out of Scope

- Backend API implementation details
- Database schema validation
- Security penetration testing (covered in separate security review)

### Test Participants

- **Product Owner**: Final acceptance and sign-off
- **End Users**: 3-5 representative users from different roles
- **QA Engineer**: Test execution coordination and documentation
- **UX Designer**: User experience evaluation
- **Tech Lead**: Technical validation and support

### Test Schedule

| Activity                  | Duration | Date                    |
| ------------------------- | -------- | ----------------------- |
| UAT Test Case Review      | 1 day    | 2025-11-12              |
| UAT Environment Setup     | 1 day    | 2025-11-13              |
| UAT Execution (Session 1) | 2 hours  | 2025-11-14              |
| UAT Execution (Session 2) | 2 hours  | 2025-11-15              |
| Bug Fixes & Re-testing    | 2 days   | 2025-11-16 ~ 2025-11-17 |
| Final Sign-off            | 1 day    | 2025-11-18              |

---

## Test Environment Setup

### Prerequisites

#### 1. Test Environment Details

- **URL**: `https://test.dailyuse.app` (or staging environment)
- **Database**: Test database with sample data
- **Authentication**: Test user accounts created

#### 2. Test User Accounts

Create the following test accounts with different data profiles:

| Username    | Email             | Profile                            | Purpose                              |
| ----------- | ----------------- | ---------------------------------- | ------------------------------------ |
| test_user_1 | test1@example.com | Heavy user (100+ tasks, 20+ goals) | Test performance with large datasets |
| test_user_2 | test2@example.com | Moderate user (20 tasks, 5 goals)  | Test typical usage scenarios         |
| test_user_3 | test3@example.com | New user (5 tasks, 2 goals)        | Test first-time user experience      |
| test_user_4 | test4@example.com | Minimal user (0 tasks, 0 goals)    | Test empty state handling            |

#### 3. Test Data Setup

For each test user, ensure the following data exists:

**test_user_1 (Heavy User)**:

- 50 TODO tasks, 30 IN_PROGRESS tasks, 20 COMPLETED tasks
- 8 IN_PROGRESS goals, 10 COMPLETED goals, 2 ARCHIVED goals
- 15 today's reminders, 25 unread reminders
- 10 today's schedules, 30 this week's schedules

**test_user_2 (Moderate User)**:

- 10 TODO tasks, 5 IN_PROGRESS tasks, 5 COMPLETED tasks
- 3 IN_PROGRESS goals, 2 COMPLETED goals
- 5 today's reminders, 8 unread reminders
- 3 today's schedules, 12 this week's schedules

**test_user_3 (New User)**:

- 3 TODO tasks, 2 IN_PROGRESS tasks
- 1 IN_PROGRESS goal, 1 COMPLETED goal
- 2 today's reminders, 3 unread reminders
- 1 today's schedule, 5 this week's schedules

**test_user_4 (Minimal User)**:

- No tasks
- No goals
- No reminders
- No schedules

#### 4. Browser & Device Setup

Test on the following combinations:

| Browser | Version | OS         | Device Type         |
| ------- | ------- | ---------- | ------------------- |
| Chrome  | Latest  | Windows 11 | Desktop (1920x1080) |
| Firefox | Latest  | Windows 11 | Desktop (1920x1080) |
| Safari  | Latest  | macOS      | Desktop (1920x1080) |
| Edge    | Latest  | Windows 11 | Desktop (1920x1080) |
| Chrome  | Latest  | Android    | Mobile (375x667)    |
| Safari  | Latest  | iOS        | Mobile (375x667)    |
| Chrome  | Latest  | -          | Tablet (768x1024)   |

---

## Test Scenarios

### Scenario 1: Dashboard Overview & Navigation

**Priority**: P0 (Critical)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 15 minutes

#### Test Case 1.1: Navigate to Dashboard

**Steps**:

1. Log in with test_user_2 credentials
2. Observe the default landing page
3. Click on "Dashboard" in the navigation menu
4. Verify Dashboard page loads

**Expected Results**:

- ✅ Dashboard page loads within 2.5 seconds
- ✅ Page title shows "仪表盘 - DailyUse"
- ✅ URL is `/` or `/dashboard`
- ✅ Navigation menu highlights "Dashboard" item
- ✅ No console errors
- ✅ All 4 widgets are visible by default

**Acceptance Criteria**:

- Page load time ≤ 2.5s
- No JavaScript errors in console
- Correct page title and URL

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 1.2: Dashboard Page Layout

**Steps**:

1. On Dashboard page, observe the overall layout
2. Verify all 4 widgets are rendered
3. Check widget arrangement (grid layout)
4. Verify header elements (title, settings button, refresh button)

**Expected Results**:

- ✅ Dashboard title "仪表盘" is visible
- ✅ Settings button (gear icon) is visible in top-right
- ✅ Refresh button is visible
- ✅ 4 widgets displayed in grid layout:
  - TaskStatsWidget
  - GoalStatsWidget
  - ReminderStatsWidget
  - ScheduleStatsWidget
- ✅ Widgets have consistent spacing
- ✅ Layout is visually balanced

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 1.3: Widget Data Display

**Steps**:

1. Observe TaskStatsWidget statistics
2. Observe GoalStatsWidget statistics
3. Observe ReminderStatsWidget statistics
4. Observe ScheduleStatsWidget statistics
5. Verify numbers match actual data

**Expected Results**:

- ✅ **TaskStatsWidget** shows:
  - TODO: 10 tasks
  - IN_PROGRESS: 5 tasks
  - COMPLETED: 5 tasks
  - Completion rate: 50%
- ✅ **GoalStatsWidget** shows:
  - IN_PROGRESS: 3 goals
  - COMPLETED: 2 goals
  - ARCHIVED: 0 goals
  - Completion rate: 40%
- ✅ **ReminderStatsWidget** shows:
  - Today: 5 reminders
  - Unread: 8 reminders
- ✅ **ScheduleStatsWidget** shows:
  - Today: 3 schedules
  - This Week: 12 schedules
- ✅ All numbers are accurate (cross-check with module pages)

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 2: Widget Configuration

**Priority**: P0 (Critical)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 20 minutes

#### Test Case 2.1: Open Settings Panel

**Steps**:

1. On Dashboard page, click the Settings button (gear icon)
2. Observe the Settings Panel animation and appearance

**Expected Results**:

- ✅ Settings Panel opens with smooth animation
- ✅ Panel appears as modal overlay
- ✅ Panel title: "Widget Settings" or "仪表盘设置"
- ✅ Panel shows list of 4 widgets:
  - Task Statistics
  - Goal Statistics
  - Reminder Statistics
  - Schedule Statistics
- ✅ Each widget has:
  - Toggle switch for visibility
  - Size dropdown (Small/Medium/Large)
  - Order indicator
- ✅ Bottom buttons visible: Save, Cancel, Reset
- ✅ Close button (X) in top-right
- ✅ Background dimmed/overlay applied

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 2.2: Toggle Widget Visibility

**Steps**:

1. Open Settings Panel
2. Toggle OFF TaskStatsWidget
3. Observe Dashboard preview (do NOT save yet)
4. Toggle ON TaskStatsWidget
5. Toggle OFF ReminderStatsWidget
6. Click Save button
7. Observe Dashboard page

**Expected Results**:

- ✅ TaskStatsWidget disappears when toggled OFF
- ✅ TaskStatsWidget reappears when toggled ON
- ✅ ReminderStatsWidget remains visible until Save is clicked
- ✅ After Save, ReminderStatsWidget is hidden on Dashboard
- ✅ Settings Panel closes after Save
- ✅ Only 3 widgets visible (Task, Goal, Schedule)
- ✅ Layout adjusts to accommodate 3 widgets
- ✅ No layout glitches or overlaps

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 2.3: Adjust Widget Size

**Steps**:

1. Open Settings Panel
2. Change TaskStatsWidget size from Medium to Large
3. Change GoalStatsWidget size from Medium to Small
4. Click Save button
5. Observe widget size changes on Dashboard

**Expected Results**:

- ✅ TaskStatsWidget displays in Large size:
  - More detailed information
  - Larger card size
  - More vertical space
- ✅ GoalStatsWidget displays in Small size:
  - Compact layout
  - Smaller card size
  - Essential information only
- ✅ ReminderStatsWidget remains hidden (from previous test)
- ✅ ScheduleStatsWidget maintains default size
- ✅ Layout adapts properly without overlaps
- ✅ Size changes persist after page reload

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 2.4: Cancel Configuration Changes

**Steps**:

1. Open Settings Panel
2. Toggle OFF GoalStatsWidget
3. Change ScheduleStatsWidget size to Large
4. Click Cancel button
5. Observe Dashboard page
6. Reopen Settings Panel
7. Verify widget settings unchanged

**Expected Results**:

- ✅ Settings Panel closes after clicking Cancel
- ✅ Dashboard appearance unchanged:
  - TaskStatsWidget still Large
  - GoalStatsWidget still Small
  - ReminderStatsWidget still hidden
  - ScheduleStatsWidget still default size
- ✅ Reopening Settings Panel shows previous saved state:
  - GoalStatsWidget toggle is ON (not OFF as attempted)
  - ScheduleStatsWidget size is Medium (not Large as attempted)
- ✅ Cancel successfully discards unsaved changes

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 2.5: Reset to Default Configuration

**Steps**:

1. Open Settings Panel
2. Click "Reset to Defaults" button
3. Confirm reset action (if confirmation dialog appears)
4. Observe Dashboard page

**Expected Results**:

- ✅ Reset button triggers confirmation dialog or immediate reset
- ✅ After reset, Dashboard shows default configuration:
  - All 4 widgets visible
  - All widgets in Medium size
  - Default order restored
- ✅ Settings Panel shows all widgets enabled with Medium size
- ✅ Previous customizations are cleared

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 3: Configuration Persistence

**Priority**: P0 (Critical)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 15 minutes

#### Test Case 3.1: Configuration Persists Across Page Reloads

**Steps**:

1. Open Settings Panel
2. Configure widgets:
   - Hide ReminderStatsWidget
   - Set TaskStatsWidget to Large
   - Set GoalStatsWidget to Small
3. Save configuration
4. Click browser refresh button (F5 or Ctrl+R)
5. Observe Dashboard after reload

**Expected Results**:

- ✅ Dashboard reloads and shows saved configuration:
  - ReminderStatsWidget is hidden
  - TaskStatsWidget displays in Large size
  - GoalStatsWidget displays in Small size
  - ScheduleStatsWidget displays in default size
- ✅ Widget order maintained
- ✅ No flash of unstyled content (FOUC)
- ✅ Configuration loads quickly (≤ 500ms)

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 3.2: Configuration Persists Across Browser Sessions

**Steps**:

1. With configuration from Test Case 3.1 still active
2. Log out from DailyUse
3. Close browser completely
4. Reopen browser
5. Navigate to DailyUse and log in with same user
6. Navigate to Dashboard
7. Observe widget configuration

**Expected Results**:

- ✅ Dashboard shows same configuration as before logout:
  - ReminderStatsWidget is hidden
  - TaskStatsWidget in Large size
  - GoalStatsWidget in Small size
- ✅ Configuration persisted in backend (not just localStorage)
- ✅ Load time remains fast (≤ 2.5s)

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 3.3: Configuration is User-Specific

**Steps**:

1. Log in as test_user_2 with custom configuration
2. Note current Dashboard configuration
3. Log out
4. Log in as test_user_3
5. Navigate to Dashboard
6. Observe widget configuration
7. Log out and log back in as test_user_2
8. Verify test_user_2's configuration is unchanged

**Expected Results**:

- ✅ test_user_3 sees default configuration (all widgets visible, Medium size)
- ✅ test_user_2's configuration is independent and unchanged:
  - ReminderStatsWidget hidden
  - TaskStatsWidget Large
  - GoalStatsWidget Small
- ✅ Configurations do not interfere with each other
- ✅ Each user has isolated widget settings

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 4: Data Refresh & Real-Time Updates

**Priority**: P1 (High)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 15 minutes

#### Test Case 4.1: Manual Data Refresh

**Steps**:

1. On Dashboard page, note current TaskStatsWidget numbers
2. Open Tasks module in new browser tab
3. Create 2 new TODO tasks
4. Complete 1 IN_PROGRESS task
5. Return to Dashboard tab
6. Click the Refresh button
7. Observe TaskStatsWidget updates

**Expected Results**:

- ✅ Refresh button shows spinning animation during refresh
- ✅ TaskStatsWidget updates within 1 second:
  - TODO count increases by 2
  - IN_PROGRESS count decreases by 1
  - COMPLETED count increases by 1
  - Completion rate recalculated correctly
- ✅ Other widgets also refresh (if data changed)
- ✅ No page reload required
- ✅ Smooth transition without flicker

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 4.2: Cache Invalidation After Data Changes

**Steps**:

1. On Dashboard page, note current statistics
2. Open Goals module in new browser tab
3. Complete 1 IN_PROGRESS goal
4. Archive 1 COMPLETED goal
5. Wait 5 seconds
6. Return to Dashboard tab and manually refresh
7. Observe GoalStatsWidget updates

**Expected Results**:

- ✅ GoalStatsWidget reflects updated statistics:
  - IN_PROGRESS count decreases by 1
  - COMPLETED count decreases by 1 (moved to archived)
  - ARCHIVED count increases by 1
  - Completion rate recalculated
- ✅ Updates appear after cache invalidation
- ✅ Data accuracy maintained

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 5: Performance Validation

**Priority**: P0 (Critical)  
**Test User**: test_user_1 (Heavy User) & test_user_3 (New User)  
**Estimated Time**: 20 minutes

#### Test Case 5.1: Page Load Performance (Heavy User)

**Steps**:

1. Log in as test_user_1 (100+ tasks, 20+ goals)
2. Navigate to Dashboard
3. Use browser DevTools Performance tab or Network tab
4. Measure page load time (from navigation to fully loaded)
5. Observe First Contentful Paint (FCP) metric
6. Observe Largest Contentful Paint (LCP) metric

**Expected Results**:

- ✅ Page load time ≤ 2.5 seconds
- ✅ FCP ≤ 1.0 second
- ✅ LCP ≤ 2.0 seconds
- ✅ All widgets render within 1 second
- ✅ No significant lag or freeze
- ✅ Smooth scrolling and interactions

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 5.2: Widget Interaction Responsiveness

**Steps**:

1. On Dashboard page (any user)
2. Open Settings Panel and measure time to open
3. Toggle widget visibility and observe response time
4. Change widget size and observe response time
5. Save configuration and measure time to save
6. Refresh data and measure time to refresh

**Expected Results**:

- ✅ Settings Panel opens within 300ms
- ✅ Widget toggle responds within 200ms
- ✅ Widget size change responds within 200ms
- ✅ Configuration save completes within 500ms
- ✅ Data refresh completes within 1000ms
- ✅ All interactions feel instant and smooth

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 5.3: Page Performance (New User)

**Steps**:

1. Log in as test_user_3 (5 tasks, 2 goals - light data)
2. Navigate to Dashboard
3. Measure page load time
4. Compare with Heavy User load time

**Expected Results**:

- ✅ Page load time ≤ 1.5 seconds (faster than heavy user)
- ✅ FCP ≤ 0.8 seconds
- ✅ LCP ≤ 1.5 seconds
- ✅ Performance scales well with data volume
- ✅ No performance degradation with minimal data

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 6: Responsive Design & Cross-Device

**Priority**: P1 (High)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 25 minutes

#### Test Case 6.1: Desktop Responsiveness (1920x1080)

**Steps**:

1. Open Dashboard on desktop browser (Chrome, 1920x1080)
2. Observe layout and widget arrangement
3. Verify all elements are visible and properly spaced

**Expected Results**:

- ✅ 4 widgets displayed in 2x2 grid (or similar desktop-optimized layout)
- ✅ Widgets have adequate spacing (gap: 16px or more)
- ✅ Settings button easily accessible
- ✅ No horizontal scrolling required
- ✅ Text is readable (font size appropriate)
- ✅ Cards have proper shadows and visual hierarchy

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 6.2: Tablet Responsiveness (768x1024)

**Steps**:

1. Resize browser window to 768x1024 or use tablet device
2. Observe layout adaptation
3. Test Settings Panel on tablet size

**Expected Results**:

- ✅ Widgets reflow to tablet-optimized layout (possibly 2x2 or 1x4)
- ✅ Widget sizes scale appropriately
- ✅ Settings Panel is full-width or centered
- ✅ Touch targets are large enough (≥ 44px)
- ✅ No layout breaks or overlaps
- ✅ Scrolling works smoothly

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 6.3: Mobile Responsiveness (375x667)

**Steps**:

1. Resize browser to 375x667 or use mobile device
2. Observe layout adaptation
3. Test all interactions on mobile

**Expected Results**:

- ✅ Widgets displayed in single column (1x4 layout)
- ✅ Widget cards stack vertically
- ✅ Settings button easily tappable
- ✅ Settings Panel is full-screen on mobile
- ✅ All text is readable without zooming
- ✅ Touch interactions work smoothly
- ✅ No horizontal scrolling
- ✅ Adequate padding on edges

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 6.4: Cross-Browser Compatibility

**Steps**:

1. Test Dashboard on Chrome (latest)
2. Test Dashboard on Firefox (latest)
3. Test Dashboard on Safari (latest)
4. Test Dashboard on Edge (latest)
5. Compare appearance and functionality

**Expected Results**:

- ✅ Dashboard appears consistent across all browsers
- ✅ Widget layouts are identical
- ✅ Colors and styles match
- ✅ Animations work smoothly
- ✅ Settings Panel functions identically
- ✅ No browser-specific bugs
- ✅ Performance is comparable

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 7: Error Handling & Edge Cases

**Priority**: P1 (High)  
**Test User**: test_user_4 (Minimal User) & test_user_2 (Moderate User)  
**Estimated Time**: 20 minutes

#### Test Case 7.1: Empty State Handling (No Data)

**Steps**:

1. Log in as test_user_4 (0 tasks, 0 goals, 0 reminders, 0 schedules)
2. Navigate to Dashboard
3. Observe widget displays

**Expected Results**:

- ✅ Dashboard loads without errors
- ✅ All 4 widgets display with zero counts:
  - TaskStatsWidget: 0 TODO, 0 IN_PROGRESS, 0 COMPLETED
  - GoalStatsWidget: 0 IN_PROGRESS, 0 COMPLETED, 0 ARCHIVED
  - ReminderStatsWidget: 0 Today, 0 Unread
  - ScheduleStatsWidget: 0 Today, 0 This Week
- ✅ Completion rates show 0% or "N/A"
- ✅ Friendly empty state message displayed
- ✅ No broken UI or missing elements
- ✅ Suggestion to add data (e.g., "Create your first task")

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 7.2: API Error Handling (Network Failure)

**Steps**:

1. Log in as test_user_2
2. Navigate to Dashboard
3. Open browser DevTools Network tab
4. Set network throttling to "Offline"
5. Click Refresh button
6. Observe error handling

**Expected Results**:

- ✅ User-friendly error message displayed:
  - "Failed to load dashboard data"
  - "Please check your connection and try again"
- ✅ Retry button or Refresh button available
- ✅ No raw error messages or stack traces
- ✅ Dashboard doesn't crash or freeze
- ✅ When network is restored, Retry works correctly
- ✅ Error message disappears after successful retry

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 7.3: API Error Handling (Server Error 500)

**Steps**:

1. (Requires backend configuration to simulate 500 error)
2. Log in as test_user_2
3. Navigate to Dashboard
4. Backend returns 500 Internal Server Error
5. Observe error handling

**Expected Results**:

- ✅ User-friendly error message:
  - "Something went wrong"
  - "We're working to fix the issue"
- ✅ Retry button available
- ✅ Error is logged for monitoring
- ✅ Dashboard remains functional (doesn't crash)
- ✅ Other app features still accessible via navigation

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 7.4: Configuration Save Failure

**Steps**:

1. Open Settings Panel
2. Change widget configuration
3. (Simulate network failure or API error)
4. Click Save button
5. Observe error handling

**Expected Results**:

- ✅ Error message displayed:
  - "Failed to save configuration"
  - "Please try again"
- ✅ Settings Panel remains open (doesn't close)
- ✅ User changes are not lost
- ✅ Retry button available
- ✅ When network is restored, Save works correctly
- ✅ Dashboard doesn't show unsaved changes

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 7.5: Slow Network Performance

**Steps**:

1. Set browser network throttling to "Slow 3G"
2. Navigate to Dashboard
3. Observe loading experience
4. Test all interactions

**Expected Results**:

- ✅ Loading indicators appear during data fetch
- ✅ Page doesn't hang or freeze
- ✅ Skeleton loaders or spinners shown
- ✅ Dashboard eventually loads (within reasonable time)
- ✅ Interactions remain responsive (not blocked by network)
- ✅ User can navigate away if desired

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 8: Accessibility Compliance

**Priority**: P2 (Medium)  
**Test User**: test_user_2 (Moderate User)  
**Estimated Time**: 15 minutes

#### Test Case 8.1: Keyboard Navigation

**Steps**:

1. Navigate to Dashboard page
2. Use Tab key to navigate through interactive elements
3. Use Enter/Space to activate buttons
4. Use Escape to close Settings Panel
5. Test all interactions without using mouse

**Expected Results**:

- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are visible and clear
- ✅ Tab order is logical (top to bottom, left to right)
- ✅ Settings button can be activated with Enter/Space
- ✅ Settings Panel can be closed with Escape
- ✅ Widget toggles can be changed with keyboard
- ✅ Dropdown menus (size selector) work with arrow keys
- ✅ Save/Cancel/Reset buttons are keyboard accessible

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 8.2: Screen Reader Compatibility

**Steps**:

1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to Dashboard page
3. Listen to screen reader announcements
4. Navigate through widgets and settings

**Expected Results**:

- ✅ Page title announced: "仪表盘 - DailyUse"
- ✅ Widget headings announced clearly
- ✅ Widget statistics are readable by screen reader
- ✅ Settings button has descriptive label: "Dashboard Settings" or "仪表盘设置"
- ✅ Settings Panel modal is announced
- ✅ Widget list items are described clearly
- ✅ Toggle states announced (ON/OFF or Enabled/Disabled)
- ✅ Buttons have descriptive labels (Save, Cancel, Reset)
- ✅ Error messages are announced

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

#### Test Case 8.3: Color Contrast & Visual Clarity

**Steps**:

1. Review Dashboard page for color contrast
2. Use browser DevTools or contrast checker tool
3. Test in Light Mode and Dark Mode
4. Verify text readability

**Expected Results**:

- ✅ Text has sufficient contrast against background (WCAG AA: 4.5:1 minimum)
- ✅ Widget cards have clear visual separation
- ✅ Important information is not conveyed by color alone
- ✅ Focus indicators are visible (3:1 contrast)
- ✅ Buttons have clear labels (not icon-only without text alternative)
- ✅ Dark Mode has appropriate contrast
- ✅ All text is readable without strain

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**Notes**: ******************************\_******************************

---

### Scenario 9: User Experience Evaluation

**Priority**: P1 (High)  
**Test User**: All test users  
**Estimated Time**: 30 minutes

#### Test Case 9.1: First-Time User Experience

**Steps**:

1. Observe test_user_3 (new user) using Dashboard for first time
2. Provide minimal guidance
3. Ask user to complete tasks:
   - View dashboard overview
   - Understand what each widget shows
   - Customize widget configuration
   - Save changes
4. Collect feedback

**Expected Results**:

- ✅ User understands Dashboard purpose immediately
- ✅ Widgets are self-explanatory (clear labels and icons)
- ✅ Settings button is discoverable
- ✅ Settings Panel is intuitive to use
- ✅ User can complete configuration without help
- ✅ User feels satisfied with experience
- ✅ No confusion or frustration reported

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**User Feedback**: ******************************\_******************************

---

---

---

#### Test Case 9.2: Power User Experience

**Steps**:

1. Observe test_user_1 (heavy user) using Dashboard
2. Ask user to:
   - Review all statistics
   - Customize widgets for their workflow
   - Test data refresh after making changes
3. Collect feedback on performance and utility

**Expected Results**:

- ✅ Dashboard loads quickly despite large dataset
- ✅ Statistics are accurate and up-to-date
- ✅ Customization options meet user needs
- ✅ Data refresh is fast and reliable
- ✅ User finds Dashboard valuable for daily use
- ✅ No performance complaints

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**User Feedback**: ******************************\_******************************

---

---

---

#### Test Case 9.3: Overall User Satisfaction

**Steps**:

1. After completing all tests, ask users to rate:
   - Ease of use (1-5)
   - Visual design (1-5)
   - Performance (1-5)
   - Feature completeness (1-5)
   - Overall satisfaction (1-5)
2. Collect qualitative feedback

**Expected Results**:

- ✅ Average rating ≥ 4.0/5.0 for all categories
- ✅ No major usability concerns reported
- ✅ Users would recommend Dashboard to others
- ✅ Users plan to use Dashboard regularly

**Pass/Fail**: ⬜ Pass | ⬜ Fail  
**Tester**: ********\_\_********  
**Date**: ********\_\_********  
**User Ratings**:

- Ease of use: \_\_\_/5
- Visual design: \_\_\_/5
- Performance: \_\_\_/5
- Feature completeness: \_\_\_/5
- Overall satisfaction: \_\_\_/5

**User Feedback**: ******************************\_******************************

---

---

---

## Acceptance Criteria

### Must-Have (P0) - Required for Sign-off

- [x] **Functionality**
  - [ ] Dashboard page loads successfully for all user types
  - [ ] All 4 widgets display correct statistics
  - [ ] Widget configuration (show/hide, resize) works correctly
  - [ ] Configuration saves and persists across sessions
  - [ ] Data refresh updates statistics correctly

- [x] **Performance**
  - [ ] Page load time ≤ 2.5 seconds
  - [ ] First Contentful Paint (FCP) ≤ 1.0 second
  - [ ] Largest Contentful Paint (LCP) ≤ 2.0 seconds
  - [ ] User interactions respond within acceptable time (≤ 300ms for settings, ≤ 1s for refresh)

- [x] **Compatibility**
  - [ ] Works on Chrome, Firefox, Safari, Edge (latest versions)
  - [ ] Responsive on Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
  - [ ] No critical bugs on any tested browser

- [x] **Error Handling**
  - [ ] Graceful handling of network errors
  - [ ] User-friendly error messages
  - [ ] Empty state handled correctly (no crashes)

### Should-Have (P1) - Highly Desirable

- [x] **User Experience**
  - [ ] First-time users can understand and use Dashboard without training
  - [ ] Settings Panel is intuitive and easy to use
  - [ ] Visual design is consistent with app theme
  - [ ] Smooth animations and transitions

- [x] **Accessibility**
  - [ ] Keyboard navigation works for all interactions
  - [ ] Screen reader compatible (basic functionality)
  - [ ] Color contrast meets WCAG AA standards

- [x] **Data Accuracy**
  - [ ] All widget statistics match actual data (cross-checked)
  - [ ] Completion rates calculated correctly
  - [ ] Cache invalidation works properly

### Nice-to-Have (P2) - Optional

- [x] **Advanced Features**
  - [ ] Widget drag-and-drop (if implemented)
  - [ ] Advanced accessibility features (ARIA labels, etc.)
  - [ ] Offline support or progressive enhancement

---

## Sign-off Checklist

### Test Execution

- [ ] All P0 test cases executed and passed
- [ ] All P1 test cases executed (≥ 90% passed)
- [ ] All identified bugs documented and triaged
- [ ] Critical bugs (P0) fixed and re-tested
- [ ] High-priority bugs (P1) fixed or deferred with justification

### Documentation

- [ ] UAT test results documented
- [ ] Bug reports filed in issue tracker
- [ ] User feedback compiled and summarized
- [ ] Performance metrics recorded
- [ ] Known limitations documented

### Approvals

- [ ] **QA Engineer**: All tests completed and documented  
      Signature: **********\_\_\_\_********** Date: ****\_\_****

- [ ] **UX Designer**: User experience meets design standards  
      Signature: **********\_\_\_\_********** Date: ****\_\_****

- [ ] **Tech Lead**: Technical implementation is production-ready  
      Signature: **********\_\_\_\_********** Date: ****\_\_****

- [ ] **Product Owner**: Feature meets business requirements and ready for release  
      Signature: **********\_\_\_\_********** Date: ****\_\_****

---

## Appendix

### A. Test Data Reset Procedure

If test data becomes corrupted or needs reset:

```bash
# Reset test_user_2 data
npm run seed:test-user-2

# Or manually via SQL
DELETE FROM tasks WHERE user_id = 'test_user_2_id';
-- Insert fresh test data
```

### B. Performance Measurement Tools

- **Browser DevTools**: Performance tab, Network tab
- **Lighthouse**: Automated performance auditing
- **WebPageTest**: Real-world performance testing
- **Chrome User Experience Report**: Core Web Vitals data

### C. Screen Reader Testing Resources

- **NVDA** (Windows): https://www.nvaccess.org/
- **JAWS** (Windows): https://www.freedomscientific.com/
- **VoiceOver** (macOS/iOS): Built-in
- **TalkBack** (Android): Built-in

### D. Accessibility Checkers

- **axe DevTools**: Browser extension
- **WAVE**: Web accessibility evaluation tool
- **Color Contrast Analyzer**: Contrast checking tool

### E. Bug Report Template

```
**Title**: [Brief description of issue]

**Priority**: P0 | P1 | P2

**Test Case**: [Test Case ID]

**Environment**:
- Browser: [Chrome 120]
- OS: [Windows 11]
- Device: [Desktop]
- User: [test_user_2]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Videos**:
[Attach if applicable]

**Console Errors**:
[Paste any console errors]

**Impact**:
[User impact description]
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-12  
**Next Review**: 2025-11-18 (after UAT completion)
