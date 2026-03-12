# SA Bookkeeper AI Deployment Guide

## Introduction

This guide provides instructions for deploying the SA Bookkeeper AI application. The application now consists of two main parts:

1.  **Frontend**: A React application built with Vite.
2.  **Backend**: A Node.js (Express) server (Optional, primarily for local testing or specific non-Firebase features).

We will cover running the application locally for development and provide a high-level strategy for deploying to a production environment like Google Cloud Run.

---

## Part 1: Local Development Setup

To run the application on your local machine, you will need to run both the frontend and backend servers simultaneously.

### Prerequisites

-   **Node.js and npm**: [Download Node.js](https://nodejs.org/) (npm is included).
-   **Firebase CLI**: Install globally via `npm install -g firebase-tools`.

### Step 1: Install Dependencies

You need to install dependencies for both the frontend and the backend.

1.  **Frontend Dependencies (Root Directory)**:
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Backend Dependencies (`backend` Directory)**:
    Navigate into the `backend` directory and run:
    ```bash
    cd backend
    npm install
    cd ..
    ```

### Step 2: Configure Environment Variables

1.  **Backend Configuration**:
    -   In the `backend` directory, create a file named `.env`.
    -   Add the following content to it.
    ```env
    # Database configuration
    ```

2.  **Frontend Configuration**:
    -   In the root directory, create a file named `.env.local`.
    -   Add your Gemini API key:
    ```env
    # Your Google Gemini API Key
    API_KEY=your_gemini_api_key_here
    ```

### Step 3: Deploy Security Rules (Critical)

Before the application works correctly with Firebase (fixing "Permission Denied" errors), you must deploy the security rules.

1.  Login to Firebase:
    ```bash
    firebase login
    ```
2.  Initialize Firebase in your project directory (if not already done):
    ```bash
    firebase init
    ```
    - Select **Firestore** and **Storage**.
    - Use the existing files `firestore.rules` and `storage.rules` provided in the codebase.
3.  Deploy the rules:
    ```bash
    firebase deploy --only firestore:rules,storage
    ```

### Step 4: Run the Servers

Open two separate terminal windows.

1.  **Terminal 1: Start the Backend Server**:
    In the root directory, run:
    ```bash
    cd backend
    npm run dev
    ```
    This will start the backend server on `http://localhost:3001`. It will also watch for file changes and automatically restart.

2.  **Terminal 2: Start the Frontend Server**:
    In the root directory, run:
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`. The application will be accessible here, and any API requests will be automatically proxied to your backend server.

You can now open `http://localhost:5173` in your browser to use the application.

---

## Part 2: Production Deployment (High-Level Guide)

Deploying a full-stack application involves deploying both the frontend and backend. A common and robust pattern is to containerize both and deploy them as separate services.

### General Strategy: Google Cloud Run

1.  **Containerize the Backend**:
    -   Create a `Dockerfile` in the `backend` directory.
    -   This Dockerfile should:
        -   Use a Node.js base image.
        -   Copy `package.json` and `package-lock.json`, and run `npm install`.
        -   Copy the compiled JavaScript code from the `dist` directory.
        -   Expose the server port (e.g., 3001).
        -   Set the `CMD` to run the server (`node dist/server.js`).
    -   Build and push this image to a container registry (e.g., Google Artifact Registry).

2.  **Containerize the Frontend**:
    -   Create a `Dockerfile` in the root directory for the frontend.
    -   This Dockerfile should:
        -   Use a Node.js base image to build the static files (`npm run build`).
        -   Use a lightweight web server image (like `nginx`) for the final stage.
        -   Copy the static files from the `dist` folder into the `nginx` public directory.
    -   Build and push this image to the container registry.

3.  **Deploy to Cloud Run**:
    -   Create two Cloud Run services: one for the backend and one for the frontend.
    -   **Backend Service**:
        -   Deploy using the backend container image.
        -   Configure CORS to allow requests from your frontend's domain.
    -   **Frontend Service**:
        -   Deploy using the frontend container image.
        -   Set the `API_KEY` as a build-time argument or environment variable.
        -   Crucially, you'll need to configure the frontend to know the URL of your deployed backend service. This is often done by passing an environment variable during the build step.

4.  **Networking**:
    -   Ensure your frontend service can make network requests to your backend service.
    -   Set up a custom domain and configure DNS to point to your frontend service.

This approach creates a secure, scalable, and decoupled architecture suitable for production workloads.
