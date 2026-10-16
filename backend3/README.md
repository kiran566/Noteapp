# NotesApp Backend (FastAPI + MongoDB)

A high-performance, asynchronous RESTful API built with **FastAPI**, **MongoDB Atlas (PyMongo)**, and **JWT authentication with Argon2 password hashing**.

---

## 📑 Table of Contents
1. [Architecture & Request Lifecycle](#architecture--request-lifecycle)
2. [Libraries & Dependencies Used](#libraries--dependencies-used)
3. [File Structure & Purpose](#file-structure--purpose)
4. [API Endpoints & Swagger Documentation](#api-endpoints--swagger-documentation)
5. [Authentication & Security Flow](#authentication--security-flow)
6. [Automatic Tag Extraction](#automatic-tag-extraction)
7. [How the Backend Serves the Frontend](#how-the-backend-serves-the-frontend)
8. [Environment Variables](#environment-variables)
9. [Setup & Running](#setup--running)

---

## 🏗 Architecture & Request Lifecycle

```
[React Frontend @ http://localhost:5173]
                 │
                 │ HTTP Request (with CORS headers)
                 ▼
          [app/main.py]
      FastAPI + CORSMiddleware (allow_origins=["http://localhost:5173"])
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[/api/auth/*]         [/api/notes/*]
[app/routers/auth.py] [app/routers/notes.py]
      │                     │
      │                     ├──► Depends(get_current_user) [app/dependencies/auth.py]
      │                     │     Extracts "Authorization: Bearer <token>"
      │                     │     Validates token via PyJWT & fetches user from DB
      │                     │
      ▼                     ▼
[app/services/auth_service.py] [app/services/notes_service.py]
  - Argon2 Password Hashing       - Note CRUD operations
  - JWT Token Generation          - Automatic Tag Extraction (Regex)
  - Duplicate Email Check         - Document Serialization (_id -> id)
      │                     │
      └──────────┬──────────┘
                 ▼
     [app/database/connection.py]
     PyMongo MongoClient ──► MongoDB Atlas Cluster ("notesapp" database)
                               ├── users collection
                               └── notes collection
```

---

## 📦 Libraries & Dependencies Used

| Library | Version | Why It Is Used & How It Fits |
|---|---|---|
| **`fastapi`** | `^0.143.1` | The core ASGI framework. Provides lightning-fast asynchronous route handlers, dependency injection, and automatic OpenAPI documentation generation. |
| **`uvicorn[standard]`** | `^0.54.0` | High-performance ASGI web server used to run and serve the FastAPI application. |
| **`pymongo`** | `^4.18.3` | The official MongoDB client for Python. Communicates directly with the remote MongoDB Atlas cluster for document CRUD. |
| **`pydantic`** | `^2.14.1` | Data validation and parsing library. Ensures all incoming request payloads adhere to strict schemas (e.g. string lengths, types). |
| **`email-validator`** | `^2.3.0` | Enables `EmailStr` format validation inside Pydantic schemas for clean, valid email inputs. |
| **`pyjwt`** | `^2.15.1` | Creates, signs, and decodes JSON Web Tokens (HS256) used for stateless authentication across protected endpoints. |
| **`pwdlib[argon2]`** | `^0.3.1` | Modern password hashing implementation using the **Argon2** algorithm (the current cryptographic gold standard). |
| **`python-dotenv`** | `^1.2.4` | Loads secrets and configuration variables from `.env` into `os.environ` during application startup. |
| **`httpx`** & **`pytest`** | `^0.28.1` / `^9.1.1` | Asynchronous test client and test runner used for automated endpoint and unit testing. |

---

## 📂 File Structure & Purpose

```
backend3/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py          # Centralized configuration class loading MONGODB_URI, JWT_SECRET, etc.
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py      # PyMongo client initialization, database & collection selection, health ping
│   │
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py            # FastAPI dependency (get_current_user) validating Bearer tokens
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication routes: /api/auth/signup, /login, /dashboard
│   │   └── notes.py           # Note CRUD & pin routes: /api/notes/
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py            # Pydantic schemas for SignupRequest, LoginRequest, UserResponse, AuthResponse
│   │   └── notes.py           # Pydantic schemas for NoteCreate, NoteUpdate, NoteResponse
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py    # Business logic for hashing passwords, issuing JWTs, and authenticating
│   │   └── notes_service.py   # Business logic for note CRUD, tag generation, and serialization
│   │
│   ├── __init__.py
│   └── main.py                # Application factory: configures CORS, health routes, and mounts routers
│
├── .env                       # Environment secrets (MONGODB_URI, JWT_SECRET)
├── pyproject.toml             # Project metadata and dependencies specification (uv / pip)
├── requirements.txt           # Flat dependency list
└── README.md                  # Backend documentation
```

---

## 📡 API Endpoints & Swagger Documentation

Once the server is running, interactive Swagger documentation is available at **`http://localhost:8000/docs`** and ReDoc at **`http://localhost:8000/redoc`**.

### System & Health Endpoints
- **`GET /`** — Health check returning API name and version.
- **`GET /health`** — Basic liveness probe returning `{"status": "healthy"}`.
- **`GET /health/db`** — Database readiness probe executing a ping against MongoDB Atlas.

### Authentication Endpoints (`/api/auth`)
- **`POST /api/auth/signup`**
  - **Body**: `{ "name": "...", "email": "user@example.com", "password": "password123" }` *(Password min length: 8)*
  - **Success**: `201 Created` with JWT token and user profile.
  - **Conflict**: `409 Conflict` if the email is already in use.
- **`POST /api/auth/login`**
  - **Body**: `{ "email": "user@example.com", "password": "password123" }`
  - **Success**: `200 OK` with JWT token and user profile.
  - **Unauthorized**: `401 Unauthorized` if credentials are invalid.
- **`GET /api/auth/dashboard`** *(Protected)*
  - **Header**: `Authorization: Bearer <token>`
  - **Success**: `200 OK` with `{"message": "Welcome, <Name>!", "userId": "..."}`.

### Notes Endpoints (`/api/notes`)
All notes routes require `Authorization: Bearer <token>`. Notes are automatically scoped to the authenticated user.

- **`GET /api/notes/`**
  - **Returns**: Array of notes owned by the user, sorted with pinned notes first and newest first.
- **`POST /api/notes/`**
  - **Body**: `{ "title": "Meeting notes", "content": "Discuss architecture planning..." }`
  - **Returns**: `201 Created` with the serialized note, auto-generated tags, and `id`.
- **`PUT /api/notes/{note_id}`**
  - **Body**: `{ "title": "Updated title", "content": "Updated content..." }`
  - **Returns**: `200 OK` with updated note or `404 Not Found`.
- **`DELETE /api/notes/{note_id}`**
  - **Returns**: `200 OK` `{"message": "Note deleted successfully"}` or `404 Not Found`.
- **`PATCH /api/notes/pin/{note_id}`**
  - **Returns**: `200 OK` with toggled `isPinned` state or `404 Not Found`.

---

## 🔐 Authentication & Security Flow

1. **Password Hashing**:
   - Implemented via `pwdlib[argon2]`.
   - Passwords are never stored in plaintext; only salted Argon2 hashes are stored in the `users` collection.
2. **Token Issuance**:
   - On successful signup or login, `create_access_token` creates a signed JWT containing:
     ```json
     {
       "id": "<user_object_id>",
       "name": "<user_name>",
       "iat": "<issued_at_timestamp>",
       "exp": "<expires_in_7_days>"
     }
     ```
3. **Route Protection Dependency (`get_current_user`)**:
   - Reads the token from the `HTTPBearer` header.
   - Verifies the signature with `JWT_SECRET` and algorithm `HS256`.
   - Checks that the user still exists in MongoDB Atlas before granting access.

---

## 🏷 Automatic Tag Extraction

When a note is created or updated, `generate_tags(title, content)` parses the combined text using a regular expression:
```python
words = re.findall(r"\b[a-z]{4,}\b", f"{title} {content}".lower())
return list(dict.fromkeys(words))
```
- Extracts unique words with 4 or more letters.
- Stores them as an array `tags: ["architecture", "planning", ...]` on the document.
- Powers the real-time search filtering on the frontend.

---

## 🌐 How the Backend Serves the Frontend

### 1. CORS Configuration
In `app/main.py`, CORS is configured to allow requests from Vite's development server:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Document Normalization (`serialize_note`)
MongoDB documents use `_id: ObjectId(...)`. The `serialize_note` function converts this to a standard JSON object with a clean string `id`:
```python
def serialize_note(note: dict) -> dict:
    return {
        "id": str(note["_id"]),
        "title": note["title"],
        "content": note["content"],
        "tags": note.get("tags", []),
        "isPinned": note.get("isPinned", False),
        "createdAt": note["createdAt"],
        "updatedAt": note.get("updatedAt"),
    }
```

---

## ⚙️ Environment Variables

Create or inspect `.env` inside the `backend3/` directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@notesapp.<cluster>.mongodb.net/?appName=notesapp
JWT_SECRET=your_super_secret_jwt_key
```

---

## 🚀 Setup & Running

### Using `uv` (Recommended)
```bash
# Navigate to backend directory
cd backend3

# Run the FastAPI server with auto-reload
uv run uvicorn app.main:app --reload --port 8000
```

### Using standard `python` & `pip`
```bash
# Navigate to backend directory
cd backend3

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

The backend will start at **`http://localhost:8000`**.  
Interactive Swagger API docs will be live at **`http://localhost:8000/docs`**.