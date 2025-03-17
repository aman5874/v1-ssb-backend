# Speech-to-Text Transcription Service API Commands

## Authentication APIs

### Register a New User

```bash
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Initialize Users (Creates Admin and Test User)

```bash
curl -X POST http://localhost:3000/user/initialize
```

### Test Redis Connection

```bash
curl -X GET http://localhost:3000/user/test-redis-connection
```

## User Management APIs

### Get All Users (Admin Only)

```bash
curl -X GET http://localhost:3000/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User by ID (Admin Only)

```bash
curl -X GET http://localhost:3000/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User

```bash
curl -X PATCH http://localhost:3000/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Transcription APIs

### Upload Audio File

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/audio.m4a"
```

### Transcribe Audio

```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.mp3",
    "speaker_labels": true,
    "entity_detection": true,
    "sentiment_analysis": true,
    "summarization": true,
    "webhook_url": "https://your-webhook-url.com/callback"
  }'
```

### Get Transcription by ID

```bash
curl -X GET http://localhost:3000/api/transcribe/TRANSCRIPTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List All Transcriptions

```bash
curl -X GET http://localhost:3000/api/transcribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Server Status APIs

### Get Server Status

```bash
curl -X GET http://localhost:3000
```

### Get Health Check

```bash
curl -X GET http://localhost:3000/health
```

### Get Server Metrics

```bash
curl -X GET http://localhost:3000/metrics
```

### Get API Version

```bash
curl -X GET http://localhost:3000/version
```

### Get Combined Metrics

```bash
curl -X GET http://localhost:3000/combined-metrics
```

## Notes:

1. Replace `YOUR_JWT_TOKEN` with the actual JWT token received after login.
2. Replace `USER_ID` with the actual user ID.
3. Replace `TRANSCRIPTION_ID` with the actual transcription ID.
4. Replace `/path/to/your/audio.m4a` with the actual path to your audio file.
5. The server is assumed to be running on `localhost:3000`. Adjust the URL if your server is running on a different host or port.
