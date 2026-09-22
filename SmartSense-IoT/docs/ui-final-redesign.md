# SmartSense IoT — Professional White & Blue Redesign & Integration Specification

## 1. Overview & Visual Direction

The SmartSense IoT web platform has been redesigned into an enterprise-grade, clean, professional **White & Blue** monitoring environment. The prior dark-slate palette has been completely retired in favor of high-contrast white card surfaces, deep navy typography, and refined cobalt blue brand accents.

### Core Visual Principles
- **Color Dominance:** White (`#FFFFFF`) and Soft Tint (`#F6F9FD`) dominate the viewport (~80% surface area).
- **Brand Accent:** Professional Primary Blue (`#146BFF`) and Secondary Blue (`#2F80ED`).
- **Typography & Hierarchy:** Deep Navy (`#14213D`) headings and dark slate (`#17233C`) body text with muted slate-blue (`#6B7A99`) metadata.
- **Card Framing:** Clean 1px borders (`#DCE6F5`) with subtle elevation shadows (`0 1px 3px rgba(0, 0, 0, 0.05)`).
- **Elimination of Old Layouts:** Replaced the legacy 3 × 2 static sensor grid with a **Horizontal Sensor Carousel** and an **Expandable Selected Sensor Detail Panel**.

---

## 2. Color Palette & Design Tokens

| Token Name | Value | Purpose / Application |
| :--- | :--- | :--- |
| `--primary-blue` | `#146BFF` | Active navigation, primary action buttons, main data trends |
| `--secondary-blue` | `#2F80ED` | Humidity telemetry, secondary chart series, hovered pills |
| `--soft-blue-bg` | `#EEF4FF` | Active sidebar item fill, selected card highlight background |
| `--dark-navy` | `#14213D` | Brand titles, header labels, high-contrast modal headings |
| `--text-main` | `#17233C` | Primary content, metric integers, form inputs |
| `--text-muted` | `#6B7A99` | Hardware bus descriptions, relative timestamps, units |
| `--bg-app` | `#F6F9FD` | Application main workspace background |
| `--card-surface` | `#FFFFFF` | Primary card surfaces, modal dialogs, top navbar |
| `--border-subtle` | `#DCE6F5` | Structural dividers, card borders, table separators |
| `--status-online` | `#16A34A` | Online gateway badges, normal sensor state, distance metrics |
| `--status-warning` | `#F59E0B` | Warning thresholds, sound peak indicators |
| `--status-critical` | `#DC2626` | Armed breach alarms, capacitive emergency SOS triggers |

---

## 3. Device Display-Name Change

Per specification, the edge node title is standardized to **`SmartRoom-01`**:
- **Main Device Title:** Displays as **`SmartRoom-01`** across all user-facing components (Navbar, Dashboard, Live Monitoring, Device Status, Analytics, and Settings).
- **Hardware Gateway Identifier:** The underlying technical ID **`smartsense-pi-01`** is strictly preserved for all REST API routes (`/api/sensors/latest/smartsense-pi-01`, `/api/devices/smartsense-pi-01`, `/api/analytics/smartsense-pi-01`), MQTT topics (`smartsense/room1/sensors`), and database entries.
- **Zero Backend Disruption:** No database keys, device IDs, or firmware contracts were modified.

---

## 4. Sensor Carousel Implementation

On the **Live Monitoring** page, the legacy 3 × 2 grid has been replaced by a responsive horizontal carousel:
- **Scrolling Behavior:** Horizontal scrolling container with CSS scroll snap (`scroll-snap-type: x mandatory`).
- **Interactive Controls:**
  - Left (`<`) and Right (`>`) arrow navigation buttons with active hover states.
  - Trackpad / mouse wheel horizontal scrolling support.
  - Touch swipe support for tablet and mobile viewports.
  - Keyboard navigation (Arrow keys, Tab indexing, Enter/Space activation).
- **Screen Viewport Sizing:**
  - **Desktop (>= 1024px):** Displays ~3 cards simultaneously without overcrowding.
  - **Tablet & Mobile (< 768px):** Displays 1–2 cards with snap-to-center behavior.
- **Filter Controls:** Clean category filter (`All Sensors ▼`, `Environmental`, `Security`, `Activity`) allowing operators to isolate sensor streams.
- **Pagination Indicators:** Interactive pagination dots underneath the carousel reflecting scroll position and active selection.
- **No Infinite Auto-Scroll:** Carousel movement is exclusively user-controlled to prevent interface distraction.

---

## 5. Expandable Selected Sensor Detail Panel

Directly beneath the carousel, a single expanded detail panel renders high-resolution telemetry for the active card:
- **Layout Architecture (3-Column Desktop Grid):**
  1. **Primary Metric Column:** Oversized live value (`28.5 °C`), status badge (`OPTIMAL`), operating range (`18.0°C – 32.0°C`), and statistical aggregates (Avg: `27.4°C`, Min: `25.1°C`, Max: `30.2°C`).
  2. **Real-time Mini Trend Line Chart:** Rendered using Chart.js with primary blue stroke (`#146BFF`), gentle gradient fill (`rgba(20, 107, 255, 0.08)`), and lightweight tension curves.
  3. **Hardware Gateway Metadata:** Sensor hardware specifications (Model: `DHT22 High-Precision`, GPIO: `GPIO 4`, Bus Protocol: `1-Wire Digital`, Sampling Interval: `2.0 sec`).
- **State Synchronization:** Clicking any card in the carousel or any row in the compact list instantly focuses and renders its full telemetry inside this single expanded panel.

---

## 6. Compact Sensor List & Timeline

- **Compact Sensor Rows:** Rendered directly below the detail panel for quick vertical scanning. Each row displays the sensor icon, name, live value, status pill, and an expand chevron (`>`).
- **Recent Sensor Events Stream:** Clean chronological audit feed logging timestamped triggers (`14:42:10 — Motion detected — Room 1`, `14:42:08 — Temperature updated (28.5°C)`).

---

## 7. Redesigned Pages Summary

1. **Top Header (`Navbar.jsx`):** Pure white header with `#DCE6F5` bottom divider, brand title `SmartSense IoT`, `● System Online` status pill, Armed/Disarmed security mode switch, notification bell with unread badge count, and Admin dropdown.
2. **Sidebar (`Sidebar.jsx`):** Clean white sidebar with BrandLogo squircle, active navigation states in soft blue (`#EEF4FF`) with primary blue icons (`#146BFF`), and bottom gateway status indicator.
3. **Dashboard (`Dashboard.jsx`):** White greeting panel for `SmartRoom-01`, key metric cards, Chart.js environmental thermal/humidity drift curves, security perimeter control card with confirmation modal, and recent alerts.
4. **Live Monitoring (`LiveMonitoring.jsx`):** System banner, horizontal carousel with filter dropdown, 3-column expanded detail panel, compact sensor rows, and real-time event log.
5. **Device Status (`DeviceStatusPage.jsx`):** Features `SmartRoom-01` as primary device name, `smartsense-pi-01` hardware ID, Broadcom BCM2711 vitals (CPU temperature, RAM utilization, MQTT connection), and 40-pin GPIO physical mapping table.
6. **Analytics (`Analytics.jsx`):** Time-range toggles (`1H`, `6H`, `24H`, `7D`), sensor filter pills, statistical summary cards (Average, Minimum, Maximum), and white/blue Chart.js time series.
7. **Security Alerts (`Alerts.jsx`):** Severity classification KPI summary (Critical, Warning, Info), multi-state filter tabs, and white `AlertCard` items with left severity accent borders.
8. **Settings (`Settings.jsx`):** 6 organized white card sections (Profile, Device Configuration, Notifications, Security, Appearance, and System Diagnostics).
9. **Login (`Login.jsx`):** Modern split layout with brand illustration panel on the left and white card credentials form on the right.

---

## 8. Responsive & Accessibility Features

- **Breakpoints:** Responsive at `>= 1280px` (desktop), `1024px` (laptop), `768px` (tablet), and `<= 480px` (mobile).
- **Collapsible Sidebar:** Auto-collapses on mobile screens with mobile hamburger toggle and tap-outside backdrop.
- **ARIA & Keyboard Navigation:**
  - `SensorCard` implements `role="button"`, `tabIndex={0}`, `aria-pressed`, and keyboard triggers for `Enter` and `Space`.
  - `ConfirmationModal` implements `role="dialog"`, `aria-modal="true"`, and `Escape` key dismissal.
  - All form inputs provide explicit labels, focus outlines, and high-contrast color ratios (> 4.5:1).

---

## 9. Verification & Build Results

### Automated Test Suite Execution
- **Frontend Automated Tests:** **17 / 17 passed** (`test/frontend.test.mjs`, `test/e2e-pipeline.test.mjs`)
- **Backend REST API Tests:** **44 / 44 passed** (`backend/test/api.test.js`, `backend/test/phase10-validation.test.js`, `backend/test/phase12-integration.test.js`)
- **Mobile Integration Tests:** **18 / 18 passed** (`mobile/test/mobile.test.mjs`)
- **Raspberry Pi Software Tests:** **31 / 31 passed** (`raspberry-pi/tests/`)
- **Total Repository Automated Tests:** **110 / 110 passed (100% success rate)**

### Production Build
- **Tool:** Vite v5.4.21
- **Status:** Built in 5.95 seconds with zero errors or warnings.
- **Artifacts:**
  - `dist/index.html` (0.83 kB)
  - `dist/assets/index-CTzP-PEO.css` (21.99 kB)
  - `dist/assets/index-CEAskrWh.js` (468.18 kB)
