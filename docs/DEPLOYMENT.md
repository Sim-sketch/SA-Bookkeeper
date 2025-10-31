# SA Bookkeeper AI Deployment Guide

## Introduction

This guide provides instructions for deploying the SA Bookkeeper AI application to a production environment. The application is designed with a secure, developer-managed backend, meaning you (the developer) will set up the database once, and your users will simply register and use the service.

We will cover deploying to **Google Cloud Run**, a scalable, serverless platform ideal for containerized applications. This is the recommended approach for a robust and secure setup.

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

-   **Node.js and npm**: [Download Node.js](https://nodejs.org/) (npm is included).
-   **Git**: For version control and pushing to GitHub.
-   **Docker**: For containerizing the application for Cloud Run. [Install Docker](https://www.docker.com/get-started).
-   **Google Cloud SDK (gcloud CLI)**: For interacting with Google Cloud. [Install gcloud CLI](https://cloud.google.com/sdk/docs/install).
-   **Accounts**:
    -   A GitHub account.
    -   A Google Cloud Platform (GCP) account with billing enabled.
    -   A Supabase account.

---

## Part 1: Backend Setup (One-Time Task)

You need to create one Supabase project that will serve all your users.

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Run the SQL Schema**: In your new Supabase project, navigate to the **SQL Editor**, click **New query**, and run the entire script from `docs/schema.sql`. This will create the necessary tables (`transactions`, `rules`) and enable Row Level Security to ensure users can only access their own data.
3.  **Get Your Credentials**: Go to **Project Settings > API**. You will need two values:
    -   The **Project URL**.
    -   The **Project API Key** (the `anon` `public` key).

---

## Part 2: Deploying to Google Cloud Run

This method packages the app into a Docker container and runs it on a scalable, managed service. It's highly secure and production-ready. We'll use Google Cloud Build to automate the process.

### Step 1: Set Up Your Google Cloud Project

1.  **Select or Create a Project**: In the Google Cloud Console, select an existing project or create a new one.
2.  **Enable APIs**: Enable the following APIs for your project. You can find them in the "APIs & Services" dashboard.
    -   Cloud Run API
    -   Cloud Build API
    -   Artifact Registry API
    -   Secret Manager API
3.  **Store Credentials in Secret Manager**: This is the most secure way to handle your keys. Create three secrets:
    -   Go to **Security > Secret Manager** in the Cloud Console.
    -   Click **Create Secret** for each of the following:
        -   **Name**: `gemini-api-key` -> **Secret value**: Your Gemini API key.
        -   **Name**: `supabase-url` -> **Secret value**: Your Supabase Project URL.
        -   **Name**: `supabase-anon-key` -> **Secret value**: Your Supabase anon public key.
    -   After creating the secrets, you must grant the Cloud Build service account access to them. For each secret, go to its details, click the **Permissions** tab, click **Grant Access**, and add the principal `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com` with the role `Secret Manager Secret Accessor`.

### Step 2: Push Code to a GitHub Repository

Push the entire project, including the new configuration files (`Dockerfile`, `cloudbuild.yaml`, etc.), to a new GitHub repository.

### Step 3: Set Up a Cloud Build Trigger

A trigger will automatically build and deploy your application whenever you push changes to your GitHub repository.

1.  Go to **Cloud Build > Triggers** in the Cloud Console.
2.  Click **Create Trigger**.
3.  **Name**: Give your trigger a name (e.g., `deploy-on-push`).
4.  **Event**: Select `Push to a branch`.
5.  **Source**:
    -   Click the **Repository** dropdown and select `Connect new repository`.
    -   Follow the prompts to authorize and connect your GitHub repository.
    -   Select your newly connected repository.
6.  **Branch**: Enter the name of your main branch (e.g., `main` or `master`).
7.  **Configuration**:
    -   Select `Cloud Build configuration file (yaml or json)`.
    -   **Location**: `Repository`.
    -   **Cloud Build configuration file location**: `/cloudbuild.yaml`.
8.  **Advanced > Substitution Variables**:
    -   Click **Add Variable** for each of the following:
    -   `_SERVICE_NAME` = `sa-bookkeeper-ai` (or your preferred service name).
    -   `_REGION` = `us-central1` (or your preferred GCP region).
    -   `_SECRET_API_KEY_NAME` = `gemini-api-key`
    -   `_SECRET_SUPABASE_URL_NAME` = `supabase-url`
    -   `_SECRET_SUPABASE_ANON_KEY_NAME` = `supabase-anon-key`
9.  Click **Create**.

### Step 4: Run the Trigger

Push a change to your GitHub repository's main branch. This will automatically start the build process. You can monitor the progress in the **Cloud Build > History** dashboard.

Once the build is complete, your application will be deployed and accessible at the URL provided in the Cloud Run service details. Your users can now visit the URL, sign up, and use the application without any manual setup.