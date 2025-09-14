# Transparency System API Tests

These are example API calls to test your Transparency System backend.

## Setup
1. Make sure PostgreSQL is running
2. Run the database setup scripts
3. Update the .env file with your database credentials
4. Start the server: `npm run dev`

## API Examples

### 1. Login (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@college.edu",
  "password": "admin123"
}'
```

### 2. Login (Donor)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "donor@alumni.org",
  "password": "donor123"
}'
```

### 3. Create Donation (Admin only)
```bash
# Replace YOUR_ADMIN_TOKEN with the token from login response
curl -X POST http://localhost:3000/api/donations \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
-d '{
  "source_tag": "Alumni Batch 2020",
  "amount": 100000,
  "description": "Donation for new computer lab",
  "financial_year": "2024-2025"
}'
```

### 4. Get All Donations (Admin only)
```bash
curl -X GET http://localhost:3000/api/donations \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Create Allocation (Admin only)
```bash
curl -X POST http://localhost:3000/api/allocations \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
-d '{
  "donation_id": 1,
  "beneficiary": "Computer Science Department",
  "beneficiary_type": "department",
  "reason": "Purchase of 20 new computers for lab",
  "amount": 50000,
  "notes": "High-end computers with latest specifications"
}'
```

### 6. Get Allocations by Source Tag (Donor access)
```bash
# Replace YOUR_DONOR_TOKEN with donor token
# This donor can only see allocations for their source_tag
curl -X GET http://localhost:3000/api/donations/Alumni%20Donation/allocations \
-H "Authorization: Bearer YOUR_DONOR_TOKEN"
```

## Response Examples

### Successful Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@college.edu",
      "role": "admin",
      "source_tag": null
    }
  }
}
```

### Donations Response (Admin)
```json
{
  "success": true,
  "message": "Donations retrieved successfully",
  "data": {
    "donations": [
      {
        "id": 1,
        "source_tag": "Alumni Donation",
        "amount": "500000.00",
        "description": "For infrastructure development",
        "financial_year": "2024-2025",
        "status": "partially_allocated",
        "date_added": "2024-09-13T19:30:00.000Z",
        "allocated_amount": "150000.00",
        "remaining_amount": "350000.00",
        "allocation_count": "3"
      }
    ],
    "count": 1
  }
}
```

### Allocations Response (Donor)
```json
{
  "success": true,
  "message": "Allocations retrieved successfully",
  "data": {
    "allocations": [
      {
        "id": 1,
        "donation_id": 1,
        "beneficiary": "Computer Science Department",
        "beneficiary_type": "department",
        "reason": "Purchase of computers for new lab",
        "amount": "75000.00",
        "notes": "High-performance computers for programming courses",
        "approved_by": 1,
        "date_allocated": "2024-09-13T19:35:00.000Z",
        "source_tag": "Alumni Donation",
        "donation_amount": "500000.00",
        "approved_by_email": "admin@college.edu"
      }
    ],
    "count": 1,
    "source_tag": "Alumni Donation"
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Amount must be a positive number",
      "param": "amount",
      "location": "body"
    }
  ]
}
```

## Health Check
```bash
curl -X GET http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-09-13T19:30:00.000Z",
  "environment": "development"
}
```
