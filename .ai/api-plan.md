# REST API Plan

## 1. Resources

- **Cards**: Represents user-created flashcards. Corresponds to the `cards` table.
- **AI**: A non-CRUD resource for handling business logic related to AI operations.

## 2. Endpoints

### Cards Resource

#### `GET /api/cards`

- **Description**: Retrieves a list of the authenticated user's flashcards. Supports pagination, filtering by source, and sorting.
- **Query Parameters**:
  - `page` (optional, number, default: 1): The page number for pagination.
  - `pageSize` (optional, number, default: 10): The number of items per page.
  - `source` (optional, string, enum: 'manual', 'ai'): Filter cards by their source.
  - `sortBy` (optional, string, default: 'created_at'): Field to sort by (e.g., 'due_date', 'updated_at').
  - `order` (optional, string, enum: 'asc', 'desc', default: 'desc'): Sort order.
- **Request Body**: None.
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "c3a4b1d2-...",
        "front": "What is Astro?",
        "back": "A web framework for building fast, content-focused websites.",
        "source": "manual",
        "due_date": "2025-10-20T10:00:00Z",
        "created_at": "2025-10-12T12:00:00Z",
        "updated_at": "2025-10-12T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalCount": 50
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully retrieved the list of cards.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `400 Bad Request`: Invalid query parameters.

#### `POST /api/cards`

- **Description**: Creates a new flashcard for the authenticated user.
- **Query Parameters**: None.
- **Request Body**:
  ```json
  {
    "front": "What is the capital of Poland?",
    "back": "Warsaw",
    "source": "manual"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "d4e5f6a1-...",
    "user_id": "a1b2c3d4-...",
    "front": "What is the capital of Poland?",
    "back": "Warsaw",
    "source": "manual",
    "interval": 0,
    "repetition": 0,
    "ease_factor": 2.5,
    "due_date": "2025-10-12T14:00:00Z",
    "created_at": "2025-10-12T14:00:00Z",
    "updated_at": "2025-10-12T14:00:00Z"
  }
  ```
- **Success Codes**:
  - `201 Created`: The card was successfully created.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `400 Bad Request`: Invalid request body (e.g., missing fields, validation failed).
  - `500 Internal Server Error`: Failed to create the card in the database.

#### `GET /api/cards/{id}`

- **Description**: Retrieves a single flashcard by its ID.
- **Query Parameters**: None.
- **Request Body**: None.
- **Response Body**:
  ```json
  {
    "id": "c3a4b1d2-...",
    "front": "What is Astro?",
    "back": "A web framework...",
    "source": "manual",
    "due_date": "2025-10-20T10:00:00Z",
    "created_at": "2025-10-12T12:00:00Z",
    "updated_at": "2025-10-12T12:00:00Z"
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully retrieved the card.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No card found with the given ID for the authenticated user.

#### `PATCH /api/cards/{id}`

- **Description**: Updates an existing flashcard.
- **Query Parameters**: None.
- **Request Body**:
  ```json
  {
    "front": "What is the largest planet in our solar system?",
    "back": "Jupiter"
  }
  ```
- **Response Body**: The updated card object.
- **Success Codes**:
  - `200 OK`: The card was successfully updated.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No card found with the given ID.
  - `400 Bad Request`: Invalid request body.

#### `DELETE /api/cards/{id}`

- **Description**: Deletes a flashcard by its ID.
- **Query Parameters**: None.
- **Request Body**: None.
- **Response Body**: None.
- **Success Codes**:
  - `204 No Content`: The card was successfully deleted.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: No card found with the given ID.

### AI Resource

#### `POST /api/ai/generate-cards`

- **Description**: Generates a list of flashcard suggestions from a given text using an LLM. This does not save the cards to the database.
- **Query Parameters**: None.
- **Request Body**:
  ```json
  {
    "text": "Astro is a web framework for building fast, content-focused websites. It renders components on the server to HTML, reducing the amount of JavaScript shipped to the client."
  }
  ```
- **Response Body**:
  ```json
  {
    "suggestions": [
      {
        "front": "What is Astro?",
        "back": "A web framework for building fast, content-focused websites."
      },
      {
        "front": "How does Astro improve performance?",
        "back": "It renders components on the server to HTML, reducing client-side JavaScript."
      }
    ]
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully generated suggestions.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `400 Bad Request`: Invalid request body (e.g., text too short/long).
  - `503 Service Unavailable`: The external LLM service is unavailable or failed.

#### `POST /api/ai/save-generated-cards`

- **Description**: Saves a selection of AI-generated cards to the database and logs the generation event.
- **Query Parameters**: None.
- **Request Body**:
  ```json
  {
    "originalText": "Astro is a web framework...",
    "generatedCount": 2,
    "acceptedCards": [
      {
        "front": "What is Astro?",
        "back": "A web framework for building fast, content-focused websites."
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Successfully saved 1 cards.",
    "savedCards": [
      {
        "id": "e5f6a1b2-...",
        "front": "What is Astro?",
        "back": "A web framework...",
        "source": "ai",
        "created_at": "2025-10-12T15:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**:
  - `201 Created`: Cards were successfully created and the event logged.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `400 Bad Request`: Invalid request body.
  - `500 Internal Server Error`: Failed to save cards or log the event.

### Study Session Resource

#### `GET /api/study-session`

- **Description**: Retrieves a list of cards due for a study session based on the Spaced Repetition algorithm (`due_date` is in the past).
- **Query Parameters**:
  - `limit` (optional, number, default: 20): Maximum number of cards to return for the session.
- **Request Body**: None.
- **Response Body**:
  ```json
  {
    "sessionCards": [
      {
        "id": "c3a4b1d2-...",
        "front": "What is Astro?",
        "back": "A web framework...",
        "source": "manual"
      }
    ]
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully retrieved cards for the study session.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.

#### `POST /api/study-session/review`

- **Description**: Updates a card's Spaced Repetition System (SRS) metadata after a review.
- **Query Parameters**: None.
- **Request Body**:
  ```json
  {
    "cardId": "c3a4b1d2-...",
    "quality": 4
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Card review status updated.",
    "updatedCard": {
      "id": "c3a4b1d2-...",
      "interval": 6,
      "repetition": 1,
      "ease_factor": 2.6,
      "due_date": "2025-10-18T15:30:00Z"
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: Card SRS data was successfully updated.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: The specified card was not found.
  - `400 Bad Request`: Invalid request body (e.g., invalid quality score).

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth. The client will send the JWT in the `Authorization` header of every request (`Authorization: Bearer <SUPABASE_JWT>`).
- **Implementation**: Astro middleware (`src/middleware/index.ts`) will intercept incoming requests. It will use the JWT to authenticate the user with the Supabase client, making the user's session available in `context.locals.supabase`. All API endpoints will be protected and require a valid session.
- **Authorization**: Authorization is enforced at the database level using PostgreSQL's Row Level Security (RLS), as defined in the database plan. The policies ensure that users can only perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations on their own data. The API relies on this mechanism by using the authenticated Supabase client instance for all database queries.

## 4. Validation and Business Logic

- **Validation**: Input validation for all API endpoints will be performed using `Zod`. This ensures that all incoming data adheres to the expected schema before being processed or sent to the database.
  - `cards`: `front` (max 200 chars), `back` (max 500 chars), `source` (enum 'manual', 'ai').
  - `ai/generate-cards`: `text` (min 1000, max 10,000 chars).
  - `study-session/review`: `quality` (integer between 0-5).
- **Business Logic**:
  - **AI Card Generation**: The `POST /api/ai/generate-cards` endpoint encapsulates the logic of communicating with an external LLM API to get card suggestions.
  - **AI Metrics Logging**: The `POST /api/ai/save-generated-cards` endpoint implements the logic for batch-creating cards and simultaneously creating a corresponding entry in the `ai_generations` table to track usage metrics.
  - **Spaced Repetition**: The `POST /api/study-session/review` endpoint will contain the business logic for the Spaced Repetition System (SRS) algorithm. It will take a card ID and a user's review quality score, calculate the next `interval`, `repetition`, `ease_factor`, and `due_date`, and update the card in the database.
