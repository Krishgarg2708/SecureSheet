# SecureSheet Pro

Role-based online Excel management platform. Admins upload/create spreadsheets and grant employees **cell-level, row-level, and column-level** edit permissions. Everything — auth, spreadsheet engine, permission enforcement, file parsing, export — is custom-built. No Firebase, no Supabase, no paid APIs.

---

## 1. Why this exists

Normal spreadsheets only give you two access levels: full edit or read-only. SecureSheet Pro lets an admin say, for example:

- **Priya** can edit Sheet1 rows 1–20, columns A–E → everything else is grey/locked for her.
- **Rahul** can edit Sheet1 rows 21–40, columns F–J → everything else is grey/locked for him.

The rule is enforced **on the server**, not just hidden in the UI — every single cell write is checked against the database before it's saved. A user with dev tools open cannot bypass this by editing frontend state; the backend re-validates row/column against their stored `Permission` document on every request.

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | Custom JWT + bcrypt (no third-party auth) |
| File parsing | SheetJS (`xlsx` package) — reads/writes .xlsx, .xls, .csv |
| PDF export | pdfkit |

---

## 3. Project structure

```
securesheet-pro/
├── server/                  # Express API
│   ├── config/db.js
│   ├── controllers/         # auth, users, files, cells, permissions, logs
│   ├── models/              # User, ExcelFile, Permission, ActivityLog
│   ├── middleware/          # authMiddleware, permissionMiddleware, uploadMiddleware
│   ├── routes/
│   ├── services/excelService.js   # SheetJS parse/export helpers
│   ├── uploads/
│   └── index.js
└── client/                  # React app
    └── src/
        ├── components/SpreadsheetGrid.jsx   # the Excel-like grid
        ├── pages/            # Login, Register, Dashboard, FilesList, Upload,
        │                     # CreateSheet, ExcelWorkspace, ManageUsers,
        │                     # PermissionEditor, ActivityLogs, DownloadCenter, Profile
        ├── layouts/MainLayout.jsx
        ├── store/            # authStore, themeStore (Zustand)
        ├── routes/ProtectedRoute.jsx
        └── services/api.js
```

---

## 4. How permissions actually work (data flow)

```
User edits a cell in the browser
        ↓
PATCH /api/files/:fileId/cell   { sheetIndex, row, column, value }
        ↓
authMiddleware.protect          → verifies JWT, loads req.user
        ↓
enforceCellPermission           → loads the file
                                   if req.user is ADMIN or file owner → allow
                                   else → Permission.canEditCell(fileId, userId, sheetIndex, row, col)
                                          checks row/col against every stored editableRange
        ↓
  allowed? → cellController.updateCell saves the single cell + writes an ActivityLog row
  denied?  → 403 { message: "ACCESS DENIED" } + an ACCESS_DENIED entry is logged
```

Only the **one changed cell** is ever sent over the wire (auto-save fires ~700ms after you stop typing; there's also a manual "Save now" button). This keeps saves fast and avoids clobbering other users' concurrent edits.

---

## 5. Database schemas

**Users** — `name, email, passwordHash, role (ADMIN|USER), isActive`

**ExcelFiles** — `filename, owner, sheets: [{ name, rows, columns, cells: [{r,c,v,f}] }], activeSheetIndex`
Cells are stored **sparsely** (only non-empty cells), which keeps large sheets cheap in MongoDB.

**Permissions** — `fileId, userId, editableRange: [{sheetIndex,startRow,endRow,startColumn,endColumn}], accessType (READ_WRITE|READ_ONLY)`

**ActivityLogs** — `user, file, action, oldValue, newValue, cellLocation, timestamp`
Every cell edit, upload, file creation, deletion, permission change, download, and access-denied event is recorded here — this powers the Activity Logs / Version History screen.

---

## 6. Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

### Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI to your local or Atlas connection string,
# and set JWT_SECRET to a long random string
npm install
npm run dev        # nodemon, or `npm start` for plain node
```

The API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

### Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL should point at your backend, e.g. http://localhost:5000/api
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

### First account

**The very first user who registers automatically becomes ADMIN.** Every account after that defaults to `USER` (an admin can promote/demote anyone later from Manage Users).

---

## 7. Using it

1. Register the first account (becomes Admin) → log in.
2. As Admin: **Upload Excel** an existing `.xlsx`/`.xls`/`.csv`, or **Create Sheet** to start blank.
3. Go to **Files → Permissions** on that file, pick an employee, and set their row/column range (e.g. rows 1–20, columns A–E) plus `READ_WRITE` or `READ_ONLY`.
4. Add the employee via **Manage Users** if they don't have an account yet (or have them self-register — they'll come in as `USER`).
5. The employee logs in, opens **My Sheets → Open**, and sees the same spreadsheet — but only their assigned cells are editable (white background); everything else is grey and disabled.
6. Both roles can **Search** cells, and export to **.xlsx / .csv / .pdf** from the workspace. Downloaded copies are local — editing a downloaded file never touches server data, since exports are a one-way snapshot.
7. **Activity Logs** (Admin) shows every cell change, upload, permission grant/revoke, and access-denied attempt, with who/what/before/after/when.

---

## 8. Security notes

- Passwords are hashed with bcrypt (10 rounds); plaintext passwords are never stored or logged.
- JWTs are signed server-side with `JWT_SECRET`; tokens expire per `JWT_EXPIRES_IN` (default 7 days).
- Every write endpoint re-checks permissions server-side — the frontend's greyed-out cells are a UX convenience, not the security boundary.
- File uploads are limited to `.xlsx/.xls/.csv`, capped at 15MB, and validated by both MIME type and extension.
- Basic rate limiting (500 req / 15 min per IP) is applied to all `/api` routes.

## 9. Deployment

- **Frontend** → Vercel (`npm run build`, output `client/dist`)
- **Backend** → Render (or any Node host) — set the same env vars as `.env.example`
- **Database** → MongoDB Atlas free tier — whitelist your Render IP or use `0.0.0.0/0` for testing

Remember to update `CLIENT_URL` (server) and `VITE_API_URL` (client) to your deployed URLs.
