# Meeting Summarization

## Overview

This is a robust NestJS-based transcription service that leverages AssemblyAI's powerful API for converting speech to text. The service provides advanced features like speaker diarization, sentiment analysis, content moderation, and more.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Transcription](#transcription)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Features

- 🔐 JWT-based authentication
- 🎤 Audio file upload support
- 📝 Real-time transcription
- 👥 Speaker diarization
- 🎯 Content moderation
- 💭 Sentiment analysis
- 📊 Auto chapters
- 🔍 Entity detection
- 📋 Custom vocabulary
- ⚡ Fastify for high performance
- 🗄️ PostgreSQL database
- 🚀 Redis caching

## Prerequisites

- Node.js (v14 or later)
- pnpm
- PostgreSQL
- Redis
- AssemblyAI API Key

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/v1-ssb.git
   cd v1-ssb
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up your database and Redis server.

## Environment Setup

1. Copy the `.env.sample` to `.env` and fill in the required environment variables:

   ```bash
   cp .env.sample .env
   ```

2. Update the `.env` file with your database connection details, Redis configuration, and AssemblyAI API key.

## Project Structure

- **src/**: Contains the main source code for the application.
  - **api/**: Handles API-related logic, including endpoints for creating, retrieving, updating, and deleting API resources.
  - **auth/**: Manages authentication and authorization, using JWT for secure access control.
  - **transcribe/**: Contains logic for handling transcription requests, including uploading audio files and retrieving transcription results.
    - **pipes/**: Includes custom validation pipes for processing transcription requests and responses.
  - **users/**: Manages user-related operations, such as registration, login, and user profile management.

## API Documentation

### Authentication

- **POST /user/register**: Register a new user.
- **POST /user/login**: Log in a user and receive a JWT.

### Transcription

- **POST /api/upload**: Upload an audio file for transcription.
- **POST /api/transcribe**: Start a transcription job.
- **GET /api/transcribe/:id**: Retrieve a specific transcription result.
- **GET /api/transcribe**: List all transcription jobs.

## Error Handling

The service uses NestJS's built-in exception filters to handle errors consistently. Custom exceptions are thrown for specific error cases, such as unauthorized access or invalid input.

## Best Practices

- Ensure your `.env` file is not committed to version control.
- Regularly update dependencies to patch security vulnerabilities.
- Use environment-specific configurations for development, testing, and production.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
