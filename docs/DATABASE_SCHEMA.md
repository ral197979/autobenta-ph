# AutoBenta PH — Database Schema

## Entity Relationship Overview

```
User ──────┬──── VehicleListing ────┬──── VehiclePhoto
           │                        ├──── Favorite
           ├──── Dealer             ├──── Inquiry ──── Lead
           │                        ├──── InspectionRequest ──── InspectionReport
           ├──── Favorite           ├──── FinancingRequest
           ├──── Inquiry (buyer)    └──── AIAnalysis
           ├──── InspectionRequest
           ├──── FinancingRequest
           └──── AuditLog
```

---

## Enums

### Role
`buyer | seller | dealer | inspector | admin`

### ListingStatus
`draft | pending | active | sold | archived | rejected`

### InquiryStatus / Lead Status
`new | contacted | viewing_scheduled | financing | closed_won | closed_lost`

### InspectionStatus
`requested | scheduled | in_progress | completed | cancelled`

### InspectionResult
`pass | warning | fail`

### FinancingStatus
`requested | prequalified | docs_needed | approved | rejected`

### FuelType
`gasoline | diesel | hybrid | electric | lpg`

### Transmission
`automatic | manual | cvt`

### SellerType
`private | dealer | repossessed`

### ConditionGrade
`excellent | good | fair | poor`

---

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | String UNIQUE | |
| passwordHash | String | bcrypt hashed |
| name | String | |
| phone | String? | |
| role | Role | default: buyer |
| isVerified | Boolean | default: false |
| isActive | Boolean | default: true |
| avatarUrl | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### dealers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID FK → users | unique |
| businessName | String | |
| description | String? | |
| address | String | |
| city | String | |
| logoUrl | String? | |
| website | String? | |
| licenseNumber | String? | |
| isVerified | Boolean | default: false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### vehicle_listings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sellerId | UUID FK → users | |
| dealerId | UUID? FK → dealers | |
| sellerType | SellerType | default: private |
| status | ListingStatus | default: draft |
| make | String | |
| model | String | |
| year | Int | |
| variant | String? | e.g. "1.3 XLE CVT" |
| plateEnding | String? | last 2 digits |
| mileage | Int | km |
| price | Decimal(12,2) | PHP |
| negotiable | Boolean | default: true |
| fuelType | FuelType | |
| transmission | Transmission | |
| color | String? | |
| bodyType | String? | |
| location | String | |
| city | String | |
| region | String | |
| condition | ConditionGrade | default: good |
| description | String? | |
| hasOrCr | Boolean | default: true |
| orCrNotes | String? | |
| ownerCount | Int | default: 1 |
| serviceHistory | Boolean | default: false |
| hasAccident | Boolean | default: false |
| accidentNotes | String? | |
| hasFlood | Boolean | default: false |
| floodNotes | String? | |
| viewCount | Int | default: 0 |
| inquiryCount | Int | default: 0 |
| isSponsored | Boolean | default: false |
| fraudFlags | Json? | AI fraud detection results |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| soldAt | DateTime? | |

### vehicle_photos
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| listingId | UUID FK → vehicle_listings | CASCADE DELETE |
| url | String | local path or S3 URL |
| isPrimary | Boolean | default: false |
| caption | String? | |
| sortOrder | Int | default: 0 |
| createdAt | DateTime | |

### favorites
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID FK → users | CASCADE DELETE |
| listingId | UUID FK → vehicle_listings | CASCADE DELETE |
| createdAt | DateTime | |
| @@unique([userId, listingId]) | | |

### inquiries
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| buyerId | UUID FK → users | |
| listingId | UUID FK → vehicle_listings | |
| message | String | |
| contactPhone | String? | |
| status | InquiryStatus | default: new |
| isRead | Boolean | default: false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### leads
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| dealerId | UUID FK → dealers | |
| inquiryId | UUID? FK → inquiries | unique |
| listingId | UUID FK → vehicle_listings | |
| buyerName | String | |
| buyerEmail | String? | |
| buyerPhone | String? | |
| status | InquiryStatus | default: new |
| notes | String? | CRM notes |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### inspection_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| buyerId | UUID FK → users | |
| listingId | UUID FK → vehicle_listings | |
| status | InspectionStatus | default: requested |
| preferredDate | DateTime? | |
| address | String? | |
| notes | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### inspection_reports
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| requestId | UUID FK → inspection_requests | unique |
| inspectorId | UUID? | user id of inspector |
| overallScore | Int | 0–100 |
| result | InspectionResult | pass/warning/fail |
| exterior | Json | section data |
| interior | Json | section data |
| engine | Json | section data |
| transmission | Json | section data |
| suspension | Json | section data |
| tires | Json | section data |
| electrical | Json | section data |
| floodSigns | Json | section data |
| accidentSigns | Json | section data |
| testDriveNotes | String? | |
| photos | Json? | array of photo URLs |
| isPublic | Boolean | default: true |
| inspectedAt | DateTime | |
| createdAt | DateTime | |

### financing_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| buyerId | UUID FK → users | |
| listingId | UUID FK → vehicle_listings | |
| status | FinancingStatus | default: requested |
| vehiclePrice | Decimal(12,2) | |
| downPayment | Decimal(12,2) | |
| loanAmount | Decimal(12,2) | |
| termMonths | Int | |
| monthlyPayment | Decimal? | estimated |
| incomeRange | String | under_30k/30k_50k/50k_100k/100k_above |
| employmentType | String? | |
| adminNotes | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### ai_analyses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| listingId | UUID FK → vehicle_listings | |
| estimatedPrice | Decimal? | |
| priceLow | Decimal? | |
| priceHigh | Decimal? | |
| listingScore | Int? | 0–100 quality |
| fraudScore | Int? | 0–100 risk |
| fraudFlags | Json? | array of flag objects |
| qualityFlags | Json? | improvement suggestions |
| buyerChecklist | Json? | pre-purchase checklist |
| negotiationTips | Json? | |
| summary | String? | |
| model | String | default: "mock" |
| createdAt | DateTime | |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID? FK → users | |
| action | String | e.g. LISTING_APPROVED |
| entityType | String | e.g. VehicleListing |
| entityId | UUID? | |
| details | Json? | |
| ipAddress | String? | |
| createdAt | DateTime | |

---

## Indexes (recommended for production)
```sql
CREATE INDEX idx_listings_status ON vehicle_listings(status);
CREATE INDEX idx_listings_make ON vehicle_listings(make);
CREATE INDEX idx_listings_city ON vehicle_listings(city);
CREATE INDEX idx_listings_price ON vehicle_listings(price);
CREATE INDEX idx_listings_seller ON vehicle_listings(seller_id);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_leads_dealer ON leads(dealer_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```
