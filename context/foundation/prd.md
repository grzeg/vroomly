---
project: Vroomly
version: 1
status: draft
created: 2026-06-10
context_type: greenfield
product_type: web-app
target_scale:
  users: small
timeline_budget:
  mvp_weeks: 3
  after_hours_only: true
  hard_deadline: null
---

## Vision & Problem Statement

**Vision**: Car owners can see exactly where their money goes, understand fuel efficiency, and make informed decisions about driving habits and maintenance.

**Problem**: Today, tracking car expenses is tedious and scattered across receipts and memory with no visibility into trends or costs per km. The pain point is workflow friction—the raw data exists (receipts, odometer readings), but owners have no tool to aggregate and visualize it, making it impossible to identify patterns, optimize spending, or verify if a car is operating efficiently.

**Insight**: Car owners have the data; they just lack the tools to synthesize it. Providing visibility into fuel consumption trends and cost breakdowns will enable conscious spending and driving behavior.

---

## User & Persona

**Primary Persona**: Individual car owner (solo operator tracking a single vehicle)

**Secondary**: Family or household managing 2–3 vehicles (supported in MVP; not the primary focus)

Car owners want to optimize their spending. They collect receipts and mileage data naturally; Vroomly aggregates and visualizes that data so owners can answer questions like:
- How much am I spending on fuel per month?
- What's my actual fuel consumption (L/100km)?
- Is my car burning fuel normally, or is something wrong?
- When is the next service due?

---

## Success Criteria

### Primary
User can add a car (make, model, year, fuel type), log fuel purchases (mileage, liters, cost, date), view calculated fuel consumption (L/100km) and cost-per-100km metrics, view summary statistics via tables, set and receive maintenance reminders for oil changes/inspections/insurance, and manage multiple cars under one account.

### Secondary
Users can view fuel efficiency trends over months and compare driving patterns across their vehicles (year-over-year or multi-car comparison).

### Guardrails
- User data is never lost. All expense records, car details, and reminder settings persist reliably, even if the user closes the browser mid-session.

---

## User Stories

### US-01: User logs a fuel purchase and sees updated consumption metrics

**Given**: A user has registered, logged in, and added their car

**When**: The user logs a fuel purchase (mileage: 45500 km, liters: 45L, cost: 180 PLN, date: today)

**Then**:
- The app calculates fuel consumption: (45L ÷ 500 km) × 100 = 9 L/100km
- The app calculates cost per 100km: (180 PLN ÷ 500 km) × 100 = 36 PLN/100km
- The user sees these metrics updated in a summary table with date, mileage, liters, cost, and calculated values
- The previous entry (if any) is also visible in the table for comparison

---

## Functional Requirements

- FR-001: User can register with email and password. Priority: must-have
  > Socrates: Email registration adds complexity (password reset, email validation). Counter-argument considered but kept; auth is foundational.

- FR-002: User can log in with email and password. Priority: must-have
  > Socrates: No counter-argument; login is essential to the product.

- FR-003: User can add a new car (enter make, model, year, fuel type). Priority: must-have
  > Socrates: No counter-argument; setting up vehicles is core.

- FR-004: User can log a fuel purchase (mileage, liters, cost, date). Priority: must-have
  > Socrates: No counter-argument; this is the heartbeat of Vroomly.

- FR-005: App can calculate and display fuel consumption (L/100km) and cost per 100km. Priority: must-have
  > Socrates: No counter-argument; the math is the entire value proposition.

- FR-006: User can view fuel consumption and cost metrics via tables and summary statistics. Priority: must-have
  > Socrates: Charts could be deferred to v1.1; tables are simpler and proven MVP scope. Scope decision: use tables for MVP.

- FR-007: User can set maintenance reminders (oil change, inspection, insurance renewal dates). Priority: must-have
  > Socrates: No counter-argument; reminders are essential to the product.

- FR-008: User can receive in-app alerts for upcoming/overdue maintenance (notifications as in-app warnings when logging in). Priority: must-have
  > Socrates: Active notifications (email/push) could be deferred; in-app alerts are simpler and sufficient for MVP.

- FR-009: User can add and manage multiple cars under one account. Priority: must-have
  > Socrates: Single-car MVP is simpler; multi-car considered but kept. User confirmed multi-car is part of the core flow.

---

## Non-Functional Requirements

- **Data Durability**: All user records (cars, fuel purchases, maintenance reminders) persist reliably across browser crashes, network interruptions, and server restarts. Users never lose data.

- **Response Time**: Any user action (logging a fuel purchase, viewing metrics, adding a car) completes and displays results within 2 seconds from user input.

---

## Business Logic

**One-sentence rule**: The app measures fuel efficiency (L/100km) and cost per km from fuel purchase logs, making visible what would otherwise stay hidden in receipt piles.

The rule consumes fuel purchase logs—the owner enters mileage, liters, cost, and date for each fill-up. The app then calculates two derived metrics: fuel consumption (liters per 100 km) and cost per 100 km. These metrics accumulate in a table so the owner sees their consumption and spending trend over time.

The owner encounters the rule every time they log a fuel purchase—the app immediately recalculates the metrics and updates the summary table. Over weeks and months, patterns emerge: is consumption rising (sign of a mechanical issue)? Is cost per km stable or creeping up? This visibility lets owners ask "why" and act (e.g., adjust driving habits, get the car serviced).

---

## Access Control

**Authentication**: Email + password registration and login.

**User Model**: Flat single-user model. Each logged-in user owns their account and all associated cars, fuel records, and maintenance reminders. No role hierarchy (no admin/member distinction) in MVP.

---

## Non-Goals

- **No data export (Excel, CSV, PDF) in MVP** — Users view and analyze data within the app. Export comes in v1.1 based on user demand.
- **No mobile app; web-only for MVP** — Desktop and mobile browsers only. Native iOS/Android apps deferred to post-MVP.
- **No external integrations (CEPIK, OBD-II, telematics)** — Vroomly stands alone as a manual-input app. Integration with external car data sources (government databases, vehicle diagnostic APIs) is out of scope for MVP.

---

## Open Questions

(No gaps found. All required PRD sections are fully populated from shape-notes.md.)
