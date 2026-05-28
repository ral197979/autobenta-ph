# AutoBenta PH — Product Specification

## Overview
AutoBenta PH is an AI-powered used car marketplace built for the Philippines market. It connects private sellers, dealers, and buyers with integrated inspection, financing, and fraud detection.

## Target Market
- **Primary users**: Filipino car buyers and sellers in Metro Manila, Cebu, Davao, and major provincial cities
- **Secondary users**: Used car dealers, financing companies, vehicle inspectors

## Core Value Propositions
1. **Trust through AI** — Fraud detection and price estimation on every listing
2. **End-to-end workflow** — From browsing to inspection to financing, all in one platform
3. **PH-native features** — OR/CR tracking, flood/accident disclosure, LTO compliance notes

---

## User Roles & Capabilities

### Buyer
- Browse and search listings
- Filter by 10+ dimensions
- Save favorites
- Compare up to 3 cars side by side
- Send inquiries to sellers
- Request vehicle inspection
- Apply for financing
- Access AI buyer assistant

### Seller (Private)
- Create and manage vehicle listings
- Upload up to 20 photos
- Set price and conditions
- Receive and track inquiries
- Edit/archive/mark as sold

### Dealer
- All seller capabilities
- Dealer profile page
- Verified badge
- Lead management pipeline (CRM)
- Inquiry-to-lead conversion
- Lead status tracking

### Inspector
- View inspection requests
- Submit inspection reports
- Grade vehicles across 9 categories
- Assign pass/warning/fail + overall score

### Admin
- Approve/reject listings
- Manage all users, dealers
- Verify dealers
- Review financing requests
- View analytics dashboard
- Audit log access

---

## Feature Specifications

### Listing Creation
- Multi-step form: Vehicle Details → Specs & Condition → Photos → Review
- Required disclosures: accident history, flood history, OR/CR status
- AI analysis triggered automatically on submission
- Status flow: draft → pending → active (after admin approval)

### AI Services (Mock Mode)
All AI runs deterministically in mock mode. Real LLM integration via `AI_MODE=live`.

**Price Estimator** (`priceEstimator.js`)
- Inputs: make, model, year, mileage, condition
- Output: estimated price, low/high range, confidence level
- Method: base price table × depreciation × mileage × condition multipliers

**Fraud Risk Scorer** (`fraudRiskScorer.js`)
- Inputs: full listing object
- Output: risk score (0–100), risk level, specific flags
- Flags: price_too_low, no_or_cr, flood_undisclosed, accident_undisclosed, minimal_description

**Listing Quality Analyzer** (`listingQualityAnalyzer.js`)
- Inputs: listing object, photo count
- Output: quality score (0–100), quality grade, improvement suggestions
- Scores: description, photos, completeness, disclosures

**Buyer Assistant** (`buyerAssistant.js`)
- Inputs: question string, optional listing, optional compare listings
- Output: answer, checklist, negotiation tips
- Handles: deal evaluation, flood check, general inspection guide, comparison, negotiation, documents

### Vehicle Inspection
- Buyer requests via listing page or inspections dashboard
- 9 inspection sections: exterior, interior, engine, transmission, suspension, tires, electrical, floodSigns, accidentSigns
- Each section: JSON of checkpoints with pass/warning/fail values
- Overall score 0–100, result: pass/warning/fail
- Completed inspections show "Verified Inspected" badge on listing

### Financing Calculator
- Loan amount = vehicle price - down payment
- Monthly payment = standard loan amortization formula
- Rate based on income range (6.5%–9.5% p.a.)
- Status flow: requested → prequalified → docs_needed → approved/rejected

### Search & Browse
- Full-text search across make, model, description
- 10 filter dimensions
- Sponsored listings sort first
- Pagination: 20 listings per page
- Sort options: newest, price asc/desc, most viewed, lowest mileage, newest year

---

## Trust & Safety

### Fraud Detection Triggers
| Flag | Severity | Condition |
|------|----------|-----------|
| price_too_low | High | Price < 65% of estimated value |
| price_low | Medium | Price 65–80% of estimated value |
| no_or_cr | High | hasOrCr = false |
| flood_undisclosed | High | hasFlood = true AND floodNotes empty |
| accident_undisclosed | Medium | hasAccident = true AND accidentNotes empty |
| minimal_description | Low | Description < 30 characters |

### Listing Moderation
- All new listings go to `pending` status
- Admin reviews and approves/rejects
- Audit log tracks every admin action

### Role-Based Access Control
| Action | buyer | seller | dealer | inspector | admin |
|--------|-------|--------|--------|-----------|-------|
| Browse listings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create listing | ❌ | ✅ | ✅ | ❌ | ✅ |
| Send inquiry | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request inspection | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit inspection report | ❌ | ❌ | ❌ | ✅ | ✅ |
| View dealer leads | ❌ | ❌ | ✅ | ❌ | ✅ |
| Admin panel | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Philippine Market Specifics

- **Currency**: Philippine Peso (₱)
- **Mileage**: Kilometers
- **Documents**: OR (Official Receipt), CR (Certificate of Registration), LTO
- **Transmission labels**: AT (Automatic), MT (Manual), CVT
- **Key car models**: Toyota Vios, Fortuner, Innova; Mitsubishi Montero, Xpander; Honda City, Civic; Ford Ranger; Nissan Navara; Suzuki Ertiga; Hyundai Starex
- **Key cities**: Metro Manila (QC, Makati, Pasig), Cebu, Davao, Pampanga, Cavite, Laguna
- **Common concerns**: Flood damage (typhoons), numberplate ending (coding scheme), repossessed units from banks
