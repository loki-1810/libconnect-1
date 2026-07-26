# LibConnect API

Base URL: `http://localhost:8000/api/v1` in development. Interactive OpenAPI documentation is automatically generated at `/docs` and `/redoc` by FastAPI.

## Authentication

`POST /auth/register` creates a student or librarian account. `POST /auth/login` returns a JWT access token and user profile. Send the token on protected requests:

```http
Authorization: Bearer <access_token>
```

`GET` and `PATCH /auth/me` read and update the current profile. Password-reset endpoints are `/auth/forgot-password` and `/auth/reset-password`.

## Main resources

| Resource | Key endpoints |
| --- | --- |
| Libraries | `GET /libraries`, `POST /libraries/apply`, admin create/update/delete at `/libraries/{id}` |
| Books | `GET /books`, `GET /books/filters`, `GET /books/{id}`, librarian/admin create/update/delete |
| Borrowing | Student `POST /borrows`, history at `/borrows/mine`; library workflow at `/borrows/library`, `/{id}/approve`, `/{id}/reject`, and `/{id}/return` |
| Reservations | Student create/list/cancel at `/reservations`; librarian queue/list and fulfill actions |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| Administration | `GET /users`, `PATCH /users/{id}`, `/dashboard`, and `/dashboard/reports/borrows` |

## Catalogue query parameters

`GET /books` supports `q`, `category`, `author`, `language`, `year`, `availability`, `library_id`, `sort`, `order`, `page`, and `page_size`. Results use a consistent envelope:

```json
{ "items": [], "total": 0, "page": 1, "page_size": 12, "pages": 0 }
```

## Circulation rules

- A student may have up to `MAX_BORROW_LIMIT` active requests/loans.
- Approval atomically decreases available copies and sets the due date from `DEFAULT_BORROW_DAYS`.
- Returns calculate the late fine using `FINE_PER_DAY` and notify the next queued reservation.
- Reservations can only be placed when no copies are currently available.

All validation errors use appropriate HTTP status codes, and all request/response field details remain available in `/docs`.
