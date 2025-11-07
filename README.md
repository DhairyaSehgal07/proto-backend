# COLDOP BACKEND

## Description

A more detailed description of your project, its purpose, and the problem it solves.

## Installation

Instructions for installing and setting up your project locally.

### Prerequisites

- Node.js (20.17.0)
- [pnpm](https://pnpm.io) (9.9.0)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/DhairyaSehgal07/cold-op-backend
   ```
2. Navigate to the project directory:
   ```bash
   cd cold-op-backend
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

## Usage

Instructions for running and using your project.

1. Start the server:
   ```bash
   pnpm start
   ```
2. Open your browser and navigate to `http://localhost:5000`

### API Endpoints

Describe the available endpoints, including their methods, paths, and expected inputs/outputs.

- **GET /api/example**
  - Description: Example endpoint
  - Query Parameters: None
  - Response: JSON object

## Role-Based Access Control (RBAC)

The application implements a comprehensive Role-Based Access Control (RBAC) system that manages permissions for different admin roles within cold storage facilities.

### Role Hierarchy

The system has three roles:

- **Admin** role
  - Has full access to all resources and operations
  - Can manage permissions for other roles (Manager and Assistant)
  - Can only access their own cold storage data

- **Manager** role
  - Has configurable permissions set by Admin
  - Can only access their own cold storage data
  - Permissions are managed via RBAC API

- **Assistant** role
  - Has configurable permissions set by Admin
  - Can only access their own cold storage data
  - Permissions are managed via RBAC API

### Authentication Flow

1. **Login**: Store admins authenticate using mobile number and password

   ```
   POST /api/v1/base/store-admin/login
   Body: {
     "mobileNumber": "1234567890",
     "password": "password123"
   }
   ```

2. **JWT Token**: Upon successful login, a JWT token is returned

   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "admin": { ... },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

3. **Authorization Header**: Include the token in subsequent requests
   ```
   Authorization: Bearer <token>
   ```

### Permission System

#### Resources

The following resources can have permissions configured:

- `farmers` - Manage farmer data
- `incoming-orders` - Manage incoming orders
- `outgoing-orders` - Manage outgoing orders
- `locations` - Manage storage locations
- `farmer-storage-links` - Manage farmer-storage relationships
- `cold-storage` - Update cold storage details
- `store-admins` - Manage other admins (Manager and Assistant roles)

#### Operations

Each resource can have the following operations:

- `create` - Create new records
- `read` - View/read records
- `update` - Modify existing records
- `delete` - Remove records

### RBAC API Endpoints

All RBAC endpoints require authentication and Admin role access unless otherwise specified.

#### 1. Create or Update Role Permissions

**POST** `/api/v1/base/rbac/permissions`

Create or update permissions for a specific role (Manager or Assistant) in a cold storage.

**Request Body:**

```json
{
  "coldStorageId": "cold_storage_id",
  "role": "Manager", // or "Assistant"
  "permissions": [
    {
      "resource": "farmers",
      "operations": ["create", "read", "update"]
    },
    {
      "resource": "incoming-orders",
      "operations": ["read"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Role permissions for Manager updated successfully.",
  "data": {
    "id": "permission_id",
    "coldStorageId": "cold_storage_id",
    "role": "Manager",
    "permissions": [...],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get Role Permissions

**GET** `/api/v1/base/rbac/permissions/:coldStorageId/:role`

Get permissions for a specific role in a cold storage.

**Path Parameters:**

- `coldStorageId` - The cold storage ID
- `role` - Either "Manager" or "Assistant"

#### 3. Get All Role Permissions

**GET** `/api/v1/base/rbac/permissions/:coldStorageId`

Get all active role permissions for a cold storage.

#### 4. Deactivate Role Permissions

**DELETE** `/api/v1/base/rbac/permissions/:coldStorageId/:role`

Deactivate (soft delete) permissions for a specific role.

#### 5. Get Cold Storage Admins

**GET** `/api/v1/base/rbac/admins/:coldStorageId`

Get all admins in a cold storage, grouped by role.

**Response:**

```json
{
  "success": true,
  "message": "Admins retrieved successfully.",
  "data": {
    "total": 5,
    "byRole": {
      "Admin": [...],
      "Manager": [...],
      "Assistant": [...]
    },
    "all": [...]
  }
}
```

#### 6. Get My Permissions

**GET** `/api/v1/base/rbac/my-permissions`

Get the current authenticated admin's permissions. Available to all authenticated admins.

**Response:**

```json
{
  "success": true,
  "message": "Your permissions retrieved successfully.",
  "data": {
    "role": "Manager",
    "coldStorage": {
      "id": "cold_storage_id",
      "name": "Storage Name",
      "address": "Storage Address"
    },
    "permissions": [
      {
        "resource": "farmers",
        "operations": ["create", "read", "update"]
      }
    ]
  }
}
```

**Note:** Admin role receives all permissions automatically:

```json
{
  "role": "Admin",
  "permissions": [
    { "resource": "farmers", "operations": ["create", "read", "update", "delete"] },
    { "resource": "incoming-orders", "operations": ["create", "read", "update", "delete"] }
    // ... all resources with all operations
  ]
}
```

### Using RBAC Middleware in Routes

Protect your routes using the RBAC middleware:

```typescript
import {
  authenticateAdmin,
  requireSuperAdmin,
  requireSameColdStorage,
} from '@/core/middleware/auth.middleware.js';
import { requirePermission } from '@/core/middleware/permission.middleware.js';

// Example: Create farmer (requires 'create' permission on 'farmers' resource)
fastify.post(
  '/farmers',
  {
    preHandler: [
      authenticateAdmin, // Verify JWT token
      requirePermission('farmers', 'create'), // Check permission
      requireSameColdStorage, // Ensure same cold storage
    ],
  },
  async (request, reply) => {
    // Handler logic
  }
);

// Example: Admin role only route
fastify.delete(
  '/store-admins/:id',
  {
    preHandler: [
      authenticateAdmin,
      requireAdmin, // Only Admin role can access
    ],
  },
  async (request, reply) => {
    // Handler logic
  }
);
```

### Middleware Functions

#### `authenticateAdmin`

- Verifies JWT token from Authorization header
- Attaches admin object to `request.admin`
- Returns 401 if token is invalid or expired

#### `requireAdmin`

- Ensures the authenticated admin has `Admin` role
- Returns 403 if role is not Admin

#### `requirePermission(resource, operation)`

- Checks if admin has permission for specific resource and operation
- Admin role automatically passes
- Returns 403 if permission is not granted

#### `requireSameColdStorage`

- Ensures admin can only access their own cold storage data
- Applies to all roles including Admin
- Returns 403 if trying to access different cold storage

### Permission Workflow

1. **Admin creates/updates permissions** for Manager or Assistant roles via RBAC API
2. **Permissions are stored** in the database (RolePermission model)
3. **Admins login** and receive JWT tokens
4. **On each request**, middleware checks:
   - Token validity (authenticateAdmin)
   - Required permissions (requirePermission)
   - Cold storage access (requireSameColdStorage)
5. **Request proceeds** if all checks pass, otherwise returns appropriate error

### Error Responses

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required. Please provide a valid token."
  }
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Access denied. You do not have create permission for farmers."
  }
}
```

## Configuration

Create a `.env` file in the root directory and add the following variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_mongo_uri
DIRECT_DATABASE_URL=your_direct_mongo_uri
AUTH_SECRET=your_auth_secret
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
DOMAIN=http://localhost:5000/api/farmers
STORE_ADMIN_DOMAIN=http://localhost:5000/api/store-admin
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGIN=*
LOG_LEVEL=info
```

**Important Environment Variables for RBAC:**

- `AUTH_SECRET`: Secret key for signing and verifying JWT tokens (use a strong, random string in production)
- `JWT_EXPIRES_IN`: Token expiration time (default: "7d" for 7 days)

### 6. Contributing

```markdown
## Contributing

Guidelines for contributing to your project.

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a description of your changes.
```

## Acknowledgements

Thanks to my friends Gourish Narang and Anurag Anand who helped me
in building this project
