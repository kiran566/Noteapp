# NotesApp Frontend

A modern, responsive Single Page Application (SPA) built with **React 19**, **Vite**, and **Tailwind CSS**. It connects seamlessly to the FastAPI backend running on port `8000`.

---

## 📑 Table of Contents
1. [Architecture & Request Flow](#architecture--request-flow)
2. [Libraries & Dependencies Used](#libraries--dependencies-used)
3. [File Structure & Purpose](#file-structure--purpose)
4. [How Frontend Communicates with the Backend](#how-frontend-communicates-with-the-backend)
5. [Environment Variables](#environment-variables)
6. [Setup & Running](#setup--running)

---

## 🏗 Architecture & Request Flow

```
   [User Browser]
         │
    React Router (v7)
    ├── /login      ──► Login Component ──► POST /api/auth/login ──► Store Token
    ├── /signup     ──► SignUp Component ─► POST /api/auth/signup ─► Redirect to /login
    └── /dashboard  ──► ProtectedRoute Guard (checks localStorage for token)
                             │
                             ▼
                      Dashboard Component
                             │
       ┌─────────────────────┴──────────────────────┐
       │ (Concurrent API requests via Axios)       │
       ▼                                            ▼
GET /api/auth/dashboard                     GET /api/notes/
(fetches user profile for Navbar)           (fetches user notes)
       │                                            │
       ▼                                            ▼
Render Navbar (Initials & Name)             Render Note Cards & Tags
                                                    │
                      ┌─────────────────────────────┼────────────────────────────┐
                      ▼                             ▼                            ▼
               Add/Edit Modal                  Toggle Pin                   Delete Note
             (POST/PUT /api/notes)       (PATCH /api/notes/pin/{id})    (DELETE /api/notes/{id})
```

---

## 📦 Libraries & Dependencies Used

### Production Dependencies (`dependencies`)

| Library | Version | Why It Is Used & How It Fits |
|---|---|---|
| **`react`** | `^19.2.0` | Core UI library using component architecture, hooks (`useState`, `useEffect`), and functional components. |
| **`react-dom`** | `^19.2.0` | DOM renderer for React, mounting the component tree into `<div id="root"></div>`. |
| **`react-router-dom`** | `^7.10.1` | Client-side routing system. Enables navigation between `/`, `/login`, `/signup`, and `/dashboard` without full page reloads. Provides `useNavigate`, `Link`, and `Navigate`. |
| **`axios`** | `^1.15.2` | Promise-based HTTP client. Configured with a central `baseURL`, automatic request interceptor to attach JWT `Bearer` tokens, and centralized error handling. |
| **`lucide-react`** | `^0.561.0` | Clean SVG icon set used for the password visibility toggles (`Eye`, `EyeOff`) and search bar icon (`Search`). |
| **`react-icons`** | `^5.6.0` | Material Design icon set used for note card interactions (`MdAdd`, `MdOutlinePushPin`, `MdCreate`, `MdDelete`, `MdClose`). |
| **`react-modal`** | `^3.16.3` | Accessible dialog/modal overlay for displaying the Add/Edit Note form without navigating away from the dashboard. |

### Development Dependencies (`devDependencies`)

| Library | Version | Purpose |
|---|---|---|
| **`vite`** | `^7.2.4` | Ultra-fast build tool and local development server with Hot Module Replacement (HMR). |
| **`@vitejs/plugin-react`** | `^5.1.1` | Vite plugin enabling Fast Refresh and JSX transformation for React. |
| **`tailwindcss`** | `^3.4.18` | Utility-first CSS framework used for responsive, clean styling across all pages and components. |
| **`postcss`** & **`autoprefixer`** | `^8.5.6` / `^10.4.22` | PostCSS pipeline adding vendor prefixes automatically for cross-browser CSS compatibility. |
| **`eslint`** & plugins | `^9.39.1` | Code linter with React Hooks and React Refresh rules ensuring clean code and preventing render performance bugs. |

---

## 📂 File Structure & Purpose

```
frontend/
├── public/                 # Static assets served directly
├── src/
│   ├── assets/             # Images and illustrations
│   │   ├── empty.jpeg      # Graphic shown when a user has no notes yet
│   │   ├── empty.png       # Alternative empty state image
│   │   └── nosearch.png    # Graphic shown when search query yields 0 results
│   │
│   ├── Services/
│   │   └── api.js          # Centralized Axios instance, JWT interceptor & FastAPI error parser
│   │
│   ├── components/
│   │   ├── Navbar.jsx      # Top header with dynamic user initials, name, search bar & logout
│   │   ├── NoteCard.jsx    # Card representing an individual note (pin, edit, delete, tags, dates)
│   │   ├── EmptyCard.jsx   # Presentation component for empty/no-search-results states
│   │   └── ProtectedRoute.jsx # Route guard that redirects unauthenticated visitors to /login
│   │
│   ├── pages/
│   │   ├── Login.jsx       # Login page with password visibility toggle, error alert, and redirection
│   │   ├── Signup.jsx      # Registration page with >= 8 char password validation and error alerts
│   │   ├── Dashboard.jsx   # Primary notes hub: fetches data, manages search filter, and coordinates modals
│   │   └── AddEditNotes.jsx# Modal dialog form for creating new notes or editing existing ones
│   │
│   ├── App.jsx             # Top-level client routing configuration
│   ├── main.jsx            # Application entry point mounting React root with BrowserRouter
│   ├── index.css           # Global CSS and Tailwind directives (@tailwind base, etc.)
│   └── App.css             # Supplementary styling
│
├── .env                    # Environment variables (VITE_API_URL=http://localhost:8000)
├── eslint.config.js        # ESLint flat configuration ignoring production build artifacts
├── index.html              # HTML shell hosting the React root
├── package.json            # Project dependencies and npm scripts
├── postcss.config.cjs      # PostCSS configuration for Tailwind and Autoprefixer
├── tailwind.config.js      # Tailwind theme and content path configuration
└── vite.config.js          # Vite configuration setting build directory to 'build'
```

---

## 🔗 How Frontend Communicates with the Backend

### 1. Centralized Axios Configuration (`src/Services/api.js`)
All HTTP requests go through the shared `API` Axios instance:
- **Base URL**: Defaults to `http://localhost:8000` (configured via `VITE_API_URL`).
- **Authorization Interceptor**: Automatically reads `token` from `localStorage` on every outgoing request and injects the header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Error Parser (`getErrorMessage`)**: Inspects error responses from FastAPI:
  - If `detail` is a string (e.g. `HTTPException`), returns the string directly.
  - If `detail` is an array (Pydantic validation failure, e.g. password < 8 characters), formats and joins the error messages for display.

### 2. Complete API Interaction Matrix

| Action | Frontend Trigger | Method & Backend Route | Request Payload | Response Expected |
|---|---|---|---|---|
| **Register** | Submit form in `Signup.jsx` | `POST /api/auth/signup` | `{ "name": "...", "email": "...", "password": "..." }` | `{ "message": "...", "token": "...", "user": { ... } }` |
| **Login** | Submit form in `Login.jsx` | `POST /api/auth/login` | `{ "email": "...", "password": "..." }` | `{ "message": "...", "token": "...", "user": { ... } }` |
| **Get Profile** | `Dashboard.jsx` mount | `GET /api/auth/dashboard` | *None (Bearer token in header)* | `{ "message": "Welcome, Kiran!", "userId": "..." }` |
| **List Notes** | `Dashboard.jsx` mount & refresh | `GET /api/notes/` | *None (Bearer token in header)* | `[ { "id": "...", "title": "...", "content": "...", "tags": [...], "isPinned": false, "createdAt": "..." } ]` |
| **Create Note** | Submit in `AddEditNotes.jsx` | `POST /api/notes/` | `{ "title": "...", "content": "..." }` | Created note object with auto-generated tags and `id` |
| **Update Note** | Submit edit in `AddEditNotes.jsx` | `PUT /api/notes/{id}` | `{ "title": "...", "content": "..." }` | Updated note object |
| **Toggle Pin** | Click pin icon in `NoteCard.jsx` | `PATCH /api/notes/pin/{id}` | *None (Bearer token in header)* | Note object with toggled `isPinned` state |
| **Delete Note** | Click trash icon in `NoteCard.jsx` | `DELETE /api/notes/{id}` | *None (Bearer token in header)* | `{ "message": "Note deleted successfully" }` |

### 3. ID Normalization
The backend MongoDB database stores notes with `_id`, but serializes them as `id`. The frontend safely reads `item.id || item._id` to ensure compatibility regardless of serialization format.

---

## ⚙️ Environment Variables

Create or inspect `.env` in the `frontend` root:
```env
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Running in Development
```bash
npm run dev
```
The frontend will start at **`http://localhost:5173`**.

### Building for Production
```bash
npm run build
```
Build files will be generated in the **`build/`** directory.

### Running Lint Checks
```bash
npm run lint
```
