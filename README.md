# 10x-cards

[![Project Status: In Development](https://img.shields.io/badge/status-in%20development-yellowgreen.svg)](https://github.com/jakubburkiewicz/10x-project)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A modern web application for creating and managing educational flashcards, supercharged with AI.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**10x-cards** is designed to help users quickly create and manage sets of educational flashcards. The core feature of the application is its ability to leverage Large Language Models (LLMs) to automatically generate flashcard suggestions from any pasted text, such as a textbook chapter or an article.

The primary goal is to solve the problem of manual, time-consuming flashcard creation, allowing students and learners to build high-quality study materials efficiently and embrace effective learning methods like spaced repetition with minimal effort.

## Tech Stack

This project uses a modern, full-stack technology set:

-   **Frontend**:
    -   [Astro 5](https://astro.build/): For building fast, content-focused websites with a minimal JavaScript footprint.
    -   [React 19](https://react.dev/): For creating interactive and dynamic user interface components.
    -   [TypeScript 5](https://www.typescriptlang.org/): For strong static typing and improved developer experience.
    -   [Tailwind CSS 4](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
    -   [Shadcn/ui](https://ui.shadcn.com/): A library of beautifully designed and accessible React components.

-   **Backend**:
    -   [Supabase](https://supabase.io/): An open-source Firebase alternative providing a PostgreSQL database, authentication, and a Backend-as-a-Service (BaaS) platform.

-   **AI Integration**:
    -   [OpenRouter.ai](https://openrouter.ai/): A service that provides access to a wide range of LLMs (from OpenAI, Anthropic, Google, etc.) for generating flashcard content.

-   **CI/CD & Hosting**:
    -   [GitHub Actions](https://github.com/features/actions): For continuous integration and deployment pipelines.
    -   [DigitalOcean](https://www.digitalocean.com/): For hosting the application via a Docker image.

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

-   **Node.js**: The project requires a specific version of Node.js. It's recommended to use a version manager like `nvm`.
    ```bash
    # Switch to the correct Node.js version
    nvm use
    ```
    The required version is specified in the `.nvmrc` file (`22.14.0`).

-   **Environment Variables**: You will need to create a `.env` file in the root of the project to store your credentials for Supabase and OpenRouter. An example file `.env.example` should be created and filled out.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jakubburkiewicz/10x-project.git
    cd 10x-project
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

-   `npm run dev`: Starts the Astro development server with hot-reloading.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Previews the production build locally.
-   `npm run lint`: Lints the codebase using ESLint to find and report issues.
-   `npm run lint:fix`: Automatically fixes linting issues.
-   `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features

-   **AI-Powered Flashcard Generation**: Users can paste text and receive AI-generated question-and-answer flashcards.
-   **Manual Flashcard Management**: Full CRUD (Create, Read, Update, Delete) functionality for flashcards.
-   **User Authentication**: Secure user registration and login to manage personal flashcard sets.
-   **Spaced Repetition Integration**: A simple mechanism to schedule flashcards for review based on a ready-to-use algorithm.

### Out of Scope (for MVP)

-   Advanced, custom-built spaced repetition algorithms.
-   Gamification features.
-   Native mobile applications (the project is web-only for now).
-   Importing documents in formats like PDF or DOCX.
-   A public-facing API.
-   Sharing flashcards between users.

## Project Status

**Status**: In Development

This project is currently in the Minimum Viable Product (MVP) development phase. The core functionalities are being built, and the application is not yet ready for production use.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
