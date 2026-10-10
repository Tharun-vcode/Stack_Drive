# StackDrive — Scalable File Management API

A backend-focused file management system built with **Node.js, Express.js, PostgreSQL, and Prisma**, designed with scalability, secure file handling, and user-level authorization in mind.

StackDrive provides REST APIs for authentication, file and folder management, hierarchical organization, filtering, pagination, and secure cloud-based file storage.

## 🚀 Features

* JWT-based user authentication
* Secure password hashing using bcrypt
* User-level authorization and resource ownership
* Hierarchical folder management with parent-child relationships
* Cloudinary-based object storage
* Signed direct file uploads
* Asynchronous Cloudinary webhook processing
* Webhook signature and timestamp verification
* File MIME-type validation using file content
* Search, filtering, sorting, and pagination
* Rate limiting using a token-bucket algorithm
* Secure file downloads using temporary signed URLs
* Idempotent webhook processing using Prisma `upsert`
* PostgreSQL indexes for frequently queried fields
* RESTful API architecture

## 🏗️ Architecture

StackDrive separates **file storage** from **application metadata**.

```text
                 ┌──────────────────┐
                 │      Client      │
                 │  Postman / App   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Express API     │
                 │     Server       │
                 └────────┬─────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
      ┌──────────────┐        ┌────────────────┐
      │  PostgreSQL  │        │   Cloudinary   │
      │              │        │ Object Storage │
      │ File Metadata│        │    File Data   │
      └──────────────┘        └───────┬────────┘
                                      │
                                      │ Webhook
                                      ▼
                              ┌─────────────────┐
                              │ Express Webhook │
                              │   Verification  │
                              └─────────────────┘
```

The actual file contents are stored in Cloudinary, while PostgreSQL stores metadata such as:

* Original filename
* Cloudinary public ID
* File URL
* MIME type
* File size
* Resource type
* User ownership
* Folder association
* Timestamps

This keeps the application database focused on structured metadata rather than large binary files.

## 🔐 File Upload Flow

Instead of sending the entire file through the backend, StackDrive uses a signed direct-upload architecture.

```text
Client
  │
  │ 1. Request upload signature
  ▼
Express API
  │
  │ 2. Generate signed Cloudinary parameters
  ▼
Client
  │
  │ 3. Upload directly
  ▼
Cloudinary
  │
  │ 4. Send webhook
  ▼
Express API
  │
  │ 5. Verify signature + timestamp
  │
  │ 6. Generate temporary signed URL
  │
  │ 7. Detect actual MIME type
  │
  │ 8. Validate user/folder ownership
  │
  │ 9. Store metadata
  ▼
PostgreSQL
```

This avoids routing large file payloads through the Node.js server and keeps the backend responsible for authorization, validation, and metadata management.

## 🛡️ Security

The project implements several security mechanisms:

### Authentication

Users authenticate using JWT tokens.

```text
Authorization: Bearer <JWT>
```

The backend verifies the token before allowing access to protected resources.

### Password Security

Passwords are never stored directly. They are hashed using **bcrypt** before being stored in PostgreSQL.

### Authorization

Every file and folder operation is associated with a user.

The backend verifies ownership before allowing operations such as:

* Viewing files
* Downloading files
* Updating files
* Deleting files
* Accessing folders

### Rate Limiting

A token-bucket rate limiter is used to control incoming requests.

Current configuration:

```text
Bucket capacity : 10 requests
Refill rate     : 2 tokens/second
Request cost    : 1 token
```

The current implementation stores bucket state in memory. A production deployment with multiple application instances could use Redis or another shared store.

### Webhook Verification

Cloudinary webhook requests are protected using:

* Cloudinary signature verification
* Timestamp validation
* Raw request-body verification

The backend rejects requests with:

* Missing signatures
* Invalid signatures
* Expired timestamps

### MIME Validation

The MIME type provided by the upload metadata is not blindly trusted.

The backend:

1. Generates a temporary signed Cloudinary URL.
2. Retrieves the file content.
3. Inspects the file bytes.
4. Determines the actual MIME type.
5. Compares it against the expected type.

This provides an additional validation layer against incorrect or manipulated file metadata.

## 📁 Folder Management

StackDrive supports hierarchical folders using a self-referencing database relationship.

Example:

```text
My Files
│
├── College
│   ├── Assignments
│   │   ├── DBMS.pdf
│   │   └── OS.pdf
│   │
│   └── Projects
│       └── StackDrive.zip
│
└── Personal
    └── Resume.pdf
```

Each folder can optionally reference a parent folder through `parentId`.

## 🔎 File Management

The API supports:

* File listing
* Search
* MIME-type filtering
* File-size filtering
* Multi-field sorting
* Pagination
* File renaming
* Moving files between folders
* File deletion
* Secure downloads

Database indexes are used on frequently queried fields such as:

```text
userId
parentId
userId + folderId
```

This improves query efficiency as the number of stored metadata records increases.

## 🔁 Webhook Idempotency

Cloudinary webhook processing is designed to be idempotent.

Each Cloudinary file has a unique `publicId`.

When a webhook is received, StackDrive uses Prisma `upsert`:

```text
Webhook received
       │
       ▼
Find publicId
       │
   ┌───┴────┐
   │        │
Exists   Doesn't exist
   │        │
Update    Create
```

This prevents duplicate database records if the same webhook is delivered more than once.

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* Prisma ORM

### Authentication & Security

* JWT
* bcrypt
* Helmet
* CORS
* Token Bucket Rate Limiting

### Storage

* Cloudinary

### Development & Testing

* Postman
* Git
* GitHub
* VS Code

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register a new user   |
| POST   | `/api/auth/login`    | Login and receive JWT |

### Files

| Method | Endpoint                      | Description                                  | 
| ------ | ----------------------------- | -------------------------------------------- | 
| POST   | `/api/files/upload-signature` | Generate signed Cloudinary upload parameters | 
| GET    | `/api/files`                  | List/search/filter/sort/paginate files       | 
| GET    | `/api/files/:id`              | Get file details                             | 
| GET    | `/api/files/:id/download`     | Generate/download file                       | 
| PATCH  | `/api/files/:id`              | Update file metadata/location                | 
| DELETE | `/api/files/:id`              | Delete a file                                | 
| POST   | `/api/files/webhook`          | Process Cloudinary upload webhook            | 

### Folders

| Method | Endpoint       | Description        |
| ------ | -------------- | ------------------ |
| POST   | `/api/folders` | Create a folder    |
| GET    | `/api/folders` | Get user's folders |

### System

| Method | Endpoint   | Description                |
| ------ | ---------- | -------------------------- |
| GET    | `/`        | API health/basic response  |
| GET    | `/test-db` | Database connectivity test |

## 📂 Project Structure

```text
StackDrive/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── folderController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimitMiddleware.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   └── folderRoutes.js
│   │
│   ├── utils/
│   │   └── mimeSniffer.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── prisma7.config.ts
├── package.json
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Tharun-vcode/Stack_Drive.git
cd Stack_Drive
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5000/file"

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit your `.env` file or expose your Cloudinary API secret or database credentials.

### 4. Configure PostgreSQL

Create a PostgreSQL database and update the `DATABASE_URL` in `.env`.

Then generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
npm start
```

The API will run on:

```text
http://localhost:3000
```

## 🧪 Testing

The APIs can be tested using **Postman**.

Typical flow:

```text
1. Register
      ↓
2. Login
      ↓
3. Copy JWT
      ↓
4. Create Folder
      ↓
5. Request Cloudinary Upload Signature
      ↓
6. Upload File Directly to Cloudinary
      ↓
7. Cloudinary Sends Webhook
      ↓
8. Backend Validates Webhook
      ↓
9. Metadata Stored in PostgreSQL
      ↓
10. List / Search / Download / Update / Delete
```

## 📈 Scalability Considerations

The project is a proof of concept designed with scalability-oriented architecture.

Key design decisions include:

* Cloud storage instead of storing file binaries in PostgreSQL
* Direct client-to-Cloudinary uploads
* Database indexing
* Pagination instead of returning entire datasets
* Stateless JWT authentication
* Asynchronous webhook-based metadata processing
* Separation of file storage and metadata
* Idempotent webhook processing

For a larger production deployment, additional infrastructure could include:

* Redis for distributed rate limiting
* Multiple Node.js application instances
* Load balancing
* Background job queues
* Centralized logging and monitoring
* Object-storage lifecycle policies
* Database connection pooling and tuning

## 🎯 Project Goals

The main goal of StackDrive was to understand how a backend file-management system can be designed around:

* REST API architecture
* Authentication and authorization
* Database relationships
* Cloud object storage
* Asynchronous processing
* Secure file validation
* API rate limiting
* Database performance
* Scalable backend design

## 🔮 Future Improvements

Potential improvements include:

* Redis-based distributed rate limiting
* Background job processing for large files
* File versioning
* Shared folders
* Role-based folder permissions
* Bulk file operations
* File expiration policies
* Automated virus/malware scanning
* Centralized logging and monitoring
* Automated API documentation using Swagger/OpenAPI

