# Project 2 Part 1 - Library API

A REST API for managing a library's **books** and **authors**, built with Node.js, Express, and MongoDB (Mongoose).

- **Live API base URL:** `https://YOUR-RENDER-APP.onrender.com` *(TODO: replace with the real Render URL before submitting)*
- **Swagger UI (interactive docs/testing):** `<live URL>/api-docs`
- **Health check:** `<live URL>/health`
- **Raw OpenAPI spec:** `<live URL>/swagger.json`
- **GitHub repo:** https://github.com/maiselamadise/Project-2-Part-1

> The free Render tier sleeps when idle, so the **first request can take 30-60 seconds**. Wait for it, then everything responds normally.

## Tech Stack
- Node.js / Express
- MongoDB Atlas + Mongoose
- express-validator (validation)
- Swagger UI (swagger-ui-express) for interactive docs
- CORS enabled

## Data Model

### Author (`/api/authors`)
| Field       | Type     | Required | Notes                          |
|-------------|----------|----------|---------------------------------|
| name        | String   | Yes      | Author's full name              |
| bio         | String   | No       | Short biography                 |
| birthYear   | Number   | No       | 1000–current year               |
| nationality | String   | No       |                                  |
| website     | String   | No       | Must be a valid URL if provided |

### Book (`/api/books`)
| Field         | Type     | Required | Notes                                         |
|---------------|----------|----------|------------------------------------------------|
| title         | String   | Yes      |                                                  |
| author        | ObjectId | Yes      | Must reference an existing Author's `_id`       |
| isbn          | String   | Yes      | Must be unique                                  |
| genre         | String   | Yes      |                                                  |
| publishedYear | Number   | Yes      | 1000–current year                               |
| pages         | Number   | Yes      | Must be ≥ 1                                     |
| rating        | Number   | No       | 0–5, defaults to 0                              |
| description   | String   | No       |                                                  |
| inStock       | Boolean  | No       | Defaults to true                                |

Both models automatically include `createdAt` and `updatedAt` timestamps.

## Setup (Local Development)

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your own MongoDB Atlas connection string:
   ```bash
   cp .env.example .env
   ```
3. Run the server (requires Node 18+):
   ```bash
   npm start        # or: npm run dev  (auto-restarts on changes)
   ```
   The API will be available at `http://localhost:3000`, with Swagger UI at `http://localhost:3000/api-docs`.
   If `MONGO_URI` is missing or wrong, the server prints a clear error and exits instead of hanging.

**Note:** `.env` is included in `.gitignore` and must never be committed. When deploying, add `MONGO_URI` and `PORT` as environment variables in the Render dashboard instead.

## Endpoints

### Service

| Method | Endpoint      | Description                                              |
|--------|---------------|-----------------------------------------------------------|
| GET    | `/`           | API info and links                                        |
| GET    | `/health`     | `200` when the DB is connected, `503` otherwise           |
| GET    | `/api-docs`   | Swagger UI                                                |
| GET    | `/swagger.json` | Raw OpenAPI 3 spec                                      |

### Authors

| Method | Endpoint            | Description             |
|--------|----------------------|--------------------------|
| GET    | `/api/authors`       | Get all authors          |
| GET    | `/api/authors/:id`   | Get a single author      |
| POST   | `/api/authors`       | Create a new author      |
| PUT    | `/api/authors/:id`   | Update an existing author|
| DELETE | `/api/authors/:id`   | Delete an author         |

**POST /api/authors** — Request body:
```json
{
  "name": "George Orwell",
  "bio": "English novelist and essayist.",
  "birthYear": 1903,
  "nationality": "British",
  "website": "https://www.orwellfoundation.com"
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "66f0c2a1e4b0a1a2b3c4d5e6",
    "name": "George Orwell",
    "bio": "English novelist and essayist.",
    "birthYear": 1903,
    "nationality": "British",
    "website": "https://www.orwellfoundation.com",
    "createdAt": "2026-09-22T10:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  }
}
```

### Books

| Method | Endpoint           | Description                          |
|--------|----------------------|---------------------------------------|
| GET    | `/api/books`        | Get all books (author info populated) |
| GET    | `/api/books/:id`    | Get a single book                     |
| POST   | `/api/books`        | Create a new book                     |
| PUT    | `/api/books/:id`    | Update an existing book               |
| DELETE | `/api/books/:id`    | Delete a book                         |

**POST /api/books** — Request body:
```json
{
  "title": "1984",
  "author": "66f0c2a1e4b0a1a2b3c4d5e6",
  "isbn": "978-0-452-28423-4",
  "genre": "Dystopian Fiction",
  "publishedYear": 1949,
  "pages": 328,
  "rating": 4.8,
  "description": "A dystopian social science fiction novel.",
  "inStock": true
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "66f0c3b2e4b0a1a2b3c4d5e7",
    "title": "1984",
    "author": "66f0c2a1e4b0a1a2b3c4d5e6",
    "isbn": "978-0-452-28423-4",
    "genre": "Dystopian Fiction",
    "publishedYear": 1949,
    "pages": 328,
    "rating": 4.8,
    "description": "A dystopian social science fiction novel.",
    "inStock": true,
    "createdAt": "2026-09-22T10:05:00.000Z",
    "updatedAt": "2026-09-22T10:05:00.000Z"
  }
}
```

**PUT /api/books/:id** — Request body (any subset of fields):
```json
{
  "rating": 4.9,
  "inStock": false
}
```

**DELETE /api/books/:id** — Success response (200):
```json
{
  "success": true,
  "message": "Book deleted",
  "data": { "_id": "66f0c3b2e4b0a1a2b3c4d5e7", "title": "1984", "...": "..." }
}
```

## Validation & Error Handling

- All required fields are validated with `express-validator` before hitting the database.
- IDs in the URL are validated as proper MongoDB ObjectIds.
- Creating/updating a book confirms the referenced `author` ID actually exists.
- Mongoose-level validation (field types, min/max, required) provides a second layer of protection.
- All errors are funneled through a centralized error handler and returned as JSON:
  ```json
  { "success": false, "message": "Descriptive error message" }
  ```

**Example error responses:**

| Scenario                          | Status | Message                                              |
|------------------------------------|--------|-------------------------------------------------------|
| Missing required field             | 400    | "Title is required"                                   |
| Invalid ObjectId in URL             | 400    | "Invalid ID format"                                   |
| Duplicate ISBN                      | 400    | "Duplicate value for field \"isbn\": ... already exists" |
| Book/Author not found               | 404    | "Book not found" / "Author not found"                 |
| Malformed JSON body                 | 400    | "Invalid JSON in request body"                        |
| Unknown route                       | 404    | "Route not found - /api/xyz"                          |

## Testing the API

There are three ways to test every route. All work identically against `http://localhost:3000` and the deployed Render URL.

### 1. Swagger UI (no tools needed)

Open `/api-docs`, expand an endpoint, click **Try it out**, then **Execute**. Requests are sent to whichever host is serving the page, so the same docs work locally and on Render. Suggested order:

1. `POST /api/authors` - create an author and copy the `_id` from the response.
2. `POST /api/books` - paste that `_id` into the `author` field (a book needs an existing author) and use a unique `isbn`.
3. `GET /api/books` - confirm the author is populated.
4. `PUT /api/books/{id}` - update it (any subset of fields).
5. `DELETE /api/books/{id}` - remove it, then `GET /api/books/{id}` returns 404.

### 2. Automated smoke test (one command)

Runs the whole flow - create, read, update, delete, plus validation/404/duplicate/malformed-JSON cases - and cleans up after itself. No extra dependencies.

```bash
npm run smoke                                    # tests http://localhost:3000
npm run smoke -- https://YOUR-RENDER-APP.onrender.com   # tests the deployed API
```

It prints PASS/FAIL per check and exits non-zero if anything fails.

### 3. curl

```bash
BASE=http://localhost:3000   # or your Render URL

# create an author and note the _id in the response
curl -s -X POST $BASE/api/authors -H "Content-Type: application/json" \
  -d '{"name":"George Orwell","birthYear":1903,"nationality":"British"}'

# create a book using that _id
curl -s -X POST $BASE/api/books -H "Content-Type: application/json" \
  -d '{"title":"1984","author":"<AUTHOR_ID>","isbn":"978-0-452-28423-4","genre":"Dystopian Fiction","publishedYear":1949,"pages":328}'

curl -s $BASE/api/books
curl -s -X PUT $BASE/api/books/<BOOK_ID> -H "Content-Type: application/json" -d '{"rating":4.9}'
curl -s -X DELETE $BASE/api/books/<BOOK_ID>
```

## Deployment (Render + MongoDB Atlas)

1. **MongoDB Atlas:** create a cluster and a database user. Under **Network Access**, allow connections from Render (add `0.0.0.0/0`; Render's outbound IPs are not fixed). Copy the connection string and include a database name, e.g. `.../library?retryWrites=true&w=majority`.
2. **Render:** create a **Web Service** from the GitHub repo with
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variable: `MONGO_URI` = your Atlas connection string (`PORT` is set by Render automatically)
3. Once deployed, visit `<render-url>/health` - it should return `{"success":true,"status":"ok","database":"connected"}`. Then open `<render-url>/api-docs` or run `npm run smoke -- <render-url>`.
4. Put the real URL at the top of this README.

`.env` and `node_modules/` are git-ignored; secrets live only in the Render dashboard.
