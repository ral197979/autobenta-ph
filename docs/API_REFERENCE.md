# AutoBenta PH — API Reference

Base URL: `http://localhost:3001/api`

Authentication: Bearer token — `Authorization: Bearer <token>`

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | — | Returns API status |

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Register new user |
| POST | /auth/login | — | Login and get token |
| GET | /auth/me | ✅ | Get current user profile |
| PATCH | /auth/me | ✅ | Update profile |
| POST | /auth/change-password | ✅ | Change password |

### POST /auth/register
```json
{ "email": "user@example.com", "password": "min6chars", "name": "Juan", "phone": "09151234567", "role": "buyer|seller|dealer" }
```

### POST /auth/login
```json
{ "email": "user@example.com", "password": "password" }
```
Returns: `{ user, token }`

---

## Listings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /listings | — | Browse listings with filters |
| GET | /listings/:id | — | Get listing detail |
| POST | /listings | seller/dealer/admin | Create listing |
| PATCH | /listings/:id | owner/admin | Update listing |
| DELETE | /listings/:id | owner/admin | Archive listing |
| POST | /listings/:id/photos | owner/admin | Upload photos |
| DELETE | /listings/:id/photos/:photoId | owner/admin | Delete photo |
| GET | /listings/user/my-listings | ✅ | Get my listings |

### GET /listings — Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| search | string | Full-text search |
| make | string | Filter by brand |
| model | string | Filter by model |
| yearMin | int | Min year |
| yearMax | int | Max year |
| priceMin | float | Min price (₱) |
| priceMax | float | Max price (₱) |
| mileageMax | int | Max mileage (km) |
| fuelType | enum | gasoline/diesel/hybrid/electric/lpg |
| transmission | enum | automatic/manual/cvt |
| location | string | Filter by city |
| sellerType | enum | private/dealer/repossessed |
| condition | enum | excellent/good/fair/poor |
| sortBy | string | price/year/mileage/viewCount/createdAt |
| sortOrder | string | asc/desc |

### POST /listings — Body
```json
{
  "make": "Toyota", "model": "Vios", "year": 2020, "variant": "1.3 XLE CVT",
  "mileage": 40000, "price": 650000, "negotiable": true,
  "fuelType": "gasoline", "transmission": "cvt", "color": "Silver",
  "bodyType": "Sedan", "location": "Quezon City", "city": "Quezon City",
  "region": "NCR", "condition": "good", "description": "...",
  "hasOrCr": true, "ownerCount": 1, "serviceHistory": true,
  "hasAccident": false, "hasFlood": false
}
```

---

## Dealers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /dealers | — | List all dealers |
| GET | /dealers/:id | — | Get dealer profile + listings |
| POST | /dealers/register | ✅ | Register as dealer |
| PATCH | /dealers/me | dealer | Update dealer profile |
| GET | /dealers/me/leads | dealer | Get my leads |
| PATCH | /dealers/me/leads/:id | dealer | Update lead status |

### Lead Status Values
`new | contacted | viewing_scheduled | financing | closed_won | closed_lost`

---

## Inquiries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /inquiries | ✅ | Send inquiry to seller |
| GET | /inquiries/received | ✅ | Get received inquiries |
| GET | /inquiries/sent | ✅ | Get sent inquiries |
| PATCH | /inquiries/:id/status | seller | Update inquiry status |

---

## Favorites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /favorites | ✅ | Get my saved cars |
| POST | /favorites/:listingId | ✅ | Save a car |
| DELETE | /favorites/:listingId | ✅ | Remove from saved |

---

## Inspections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /inspections/request | ✅ | Request inspection |
| GET | /inspections | ✅ | List my inspection requests |
| GET | /inspections/:id | ✅ | Get inspection detail |
| PATCH | /inspections/:id/status | admin/inspector | Update status |
| POST | /inspections/:id/report | admin/inspector | Submit inspection report |

### POST /inspections/request
```json
{ "listingId": "uuid", "preferredDate": "2025-01-15", "address": "BGC, Taguig", "notes": "Check engine thoroughly" }
```

### POST /inspections/:id/report
```json
{
  "overallScore": 82,
  "result": "pass",
  "exterior": { "paint": "good", "dents": "minor", "rust": "none" },
  "engine": { "compression": "good", "leaks": "none", "timing": "good" },
  "testDriveNotes": "Smooth ride, responsive brakes"
}
```

---

## Financing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /financing/calculate | — | Calculate estimated payment |
| POST | /financing/request | ✅ | Submit financing request |
| GET | /financing/my-requests | ✅ | Get my requests |
| GET | /financing | admin | List all requests |
| PATCH | /financing/:id | admin | Update status |

### POST /financing/calculate
```json
{ "vehiclePrice": 800000, "downPayment": 160000, "termMonths": 60, "incomeRange": "50k_100k" }
```
Returns: `{ loanAmount, estimatedRate, estimatedMonthly, totalPayment, totalInterest }`

### Income Range Values
`under_30k | 30k_50k | 50k_100k | 100k_above`

---

## AI Services

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /ai/listing/:id/analysis | — | Get AI analysis for listing |
| POST | /ai/price-estimate | — | Estimate fair market price |
| POST | /ai/buyer-assistant | — | Ask AI buyer assistant |
| POST | /ai/fraud-check/:id | — | Check fraud risk for listing |

### POST /ai/buyer-assistant
```json
{ "question": "Is this a good deal?", "listingId": "uuid", "compareIds": ["uuid1", "uuid2"] }
```

---

## Admin (admin role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/stats | Marketplace analytics |
| GET | /admin/users | List all users |
| PATCH | /admin/users/:id | Update user (role, status) |
| GET | /admin/listings | List all listings |
| PATCH | /admin/listings/:id/status | Approve/reject listing |
| GET | /admin/dealers | List all dealers |
| PATCH | /admin/dealers/:id/verify | Verify/unverify dealer |
| GET | /admin/financing | List all financing requests |
| GET | /admin/audit-logs | View audit logs |

---

## Error Responses

All errors return:
```json
{ "error": "Human-readable message" }
```
Or validation errors:
```json
{ "errors": [{ "msg": "...", "path": "fieldName" }] }
```

## HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not found |
| 409 | Conflict (e.g., email already exists) |
| 500 | Internal server error |
