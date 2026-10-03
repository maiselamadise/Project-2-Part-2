#!/usr/bin/env node
/**
 * End-to-end smoke test for the Library API.
 * Exercises every route (CRUD for authors and books) plus the main error cases.
 *
 * Usage (Node 18+, no extra dependencies):
 *   npm run smoke                                   # tests http://localhost:3000
 *   npm run smoke -- https://your-app.onrender.com  # tests a deployed instance
 *   BASE_URL=https://your-app.onrender.com npm run smoke
 *
 * POST/PUT/DELETE now require GitHub login. Log in in the browser, copy the
 * connect.sid cookie (DevTools > Application > Cookies) and run:
 *   COOKIE="connect.sid=..." npm run smoke
 *
 * It creates its own temporary records and deletes them again when it finishes.
 * Note: a free Render instance can take ~30-60s to wake up, so the timeout is generous.
 */

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TIMEOUT_MS = 90000;
const MISSING_ID = '000000000000000000000000'; // valid ObjectId format, never exists

let passed = 0;
let failed = 0;

async function call(method, path, body, rawBody) {
  const opts = { method, headers: process.env.COOKIE ? { Cookie: process.env.COOKIE } : {}, signal: AbortSignal.timeout(TIMEOUT_MS) };
  if (rawBody !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = rawBody;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    /* non-JSON response */
  }
  return { status: res.status, body: json };
}

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ''}`);
  }
}

const expectStatus = (name, res, status) =>
  check(name, res.status === status, `expected ${status}, got ${res.status} ${JSON.stringify(res.body)}`);

async function run() {
  console.log(`Library API smoke test against ${BASE}\n`);
  const tag = Date.now();
  let authorId = null;
  let bookId = null;

  try {
    console.log('Service');
    let r = await call('GET', '/');
    expectStatus('GET / returns 200', r, 200);
    r = await call('GET', '/health');
    expectStatus('GET /health returns 200 (database connected)', r, 200);
    r = await call('GET', '/swagger.json');
    expectStatus('GET /swagger.json returns 200', r, 200);
    r = await call('GET', '/api/does-not-exist');
    expectStatus('Unknown route returns 404', r, 404);

    console.log('\nAuthors');
    r = await call('POST', '/api/authors', { bio: 'no name' });
    expectStatus('POST /api/authors without name returns 400', r, 400);
    r = await call('POST', '/api/authors', {
      name: `Smoke Test Author ${tag}`,
      bio: 'Created by the smoke test.',
      birthYear: 1903,
      nationality: 'British',
      website: '',
    });
    expectStatus('POST /api/authors returns 201 (empty website allowed)', r, 201);
    authorId = r.body && r.body.data && r.body.data._id;
    check('Created author has an _id', Boolean(authorId));

    r = await call('GET', '/api/authors');
    check(
      'GET /api/authors lists the new author',
      r.status === 200 && Array.isArray(r.body.data) && r.body.data.some((a) => a._id === authorId),
      `status ${r.status}`
    );
    r = await call('GET', `/api/authors/${authorId}`);
    expectStatus('GET /api/authors/:id returns 200', r, 200);
    r = await call('GET', '/api/authors/not-an-id');
    expectStatus('GET /api/authors/<bad id> returns 400', r, 400);
    r = await call('GET', `/api/authors/${MISSING_ID}`);
    expectStatus('GET /api/authors/<unknown id> returns 404', r, 404);
    r = await call('PUT', `/api/authors/${authorId}`, { nationality: 'English' });
    check(
      'PUT /api/authors/:id updates the author',
      r.status === 200 && r.body.data.nationality === 'English',
      `status ${r.status}`
    );
    r = await call('POST', '/api/authors', { name: 'Bad URL', website: 'not a url' });
    expectStatus('POST /api/authors with invalid website returns 400', r, 400);

    console.log('\nBooks');
    const bookBody = {
      title: `Smoke Test Book ${tag}`,
      author: authorId,
      isbn: `SMOKE-${tag}`,
      genre: 'Testing',
      publishedYear: 1949,
      pages: 328,
      rating: 4.5,
      description: 'Created by the smoke test.',
      inStock: true,
    };
    r = await call('POST', '/api/books', { ...bookBody, author: MISSING_ID });
    expectStatus('POST /api/books with unknown author returns 400', r, 400);
    r = await call('POST', '/api/books', { title: 'Only a title' });
    expectStatus('POST /api/books with missing fields returns 400', r, 400);
    r = await call('POST', '/api/books', bookBody);
    expectStatus('POST /api/books returns 201', r, 201);
    bookId = r.body && r.body.data && r.body.data._id;
    check('Created book has an _id', Boolean(bookId));
    r = await call('POST', '/api/books', bookBody);
    expectStatus('POST /api/books with duplicate ISBN returns 400', r, 400);
    r = await call('POST', '/api/books', undefined, '{ this is not json');
    expectStatus('POST /api/books with malformed JSON returns 400', r, 400);

    r = await call('GET', '/api/books');
    const listed = r.status === 200 && Array.isArray(r.body.data) && r.body.data.find((b) => b._id === bookId);
    check('GET /api/books lists the new book', Boolean(listed), `status ${r.status}`);
    check(
      'GET /api/books populates author details',
      Boolean(listed && listed.author && listed.author.name === `Smoke Test Author ${tag}`)
    );
    r = await call('GET', `/api/books/${bookId}`);
    expectStatus('GET /api/books/:id returns 200', r, 200);
    r = await call('GET', `/api/books/${MISSING_ID}`);
    expectStatus('GET /api/books/<unknown id> returns 404', r, 404);
    r = await call('PUT', `/api/books/${bookId}`, { rating: 4.9, inStock: false });
    check(
      'PUT /api/books/:id applies a partial update',
      r.status === 200 && r.body.data.rating === 4.9 && r.body.data.inStock === false,
      `status ${r.status}`
    );
    r = await call('PUT', `/api/books/${bookId}`, { rating: 9 });
    expectStatus('PUT /api/books/:id with rating 9 returns 400', r, 400);

    console.log('\nCleanup / delete');
    r = await call('DELETE', `/api/books/${bookId}`);
    expectStatus('DELETE /api/books/:id returns 200', r, 200);
    r = await call('GET', `/api/books/${bookId}`);
    expectStatus('Deleted book now returns 404', r, 404);
    bookId = null;
    r = await call('DELETE', `/api/authors/${authorId}`);
    expectStatus('DELETE /api/authors/:id returns 200', r, 200);
    r = await call('GET', `/api/authors/${authorId}`);
    expectStatus('Deleted author now returns 404', r, 404);
    authorId = null;
  } catch (err) {
    failed++;
    console.log(`\n  ERROR  ${err.message}`);
    console.log(`  Could not complete the run. Is the server running at ${BASE}?`);
  } finally {
    // Best-effort cleanup if the run stopped early
    try {
      if (bookId) await call('DELETE', `/api/books/${bookId}`);
      if (authorId) await call('DELETE', `/api/authors/${authorId}`);
    } catch (_) {
      /* ignore */
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
