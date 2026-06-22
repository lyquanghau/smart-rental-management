# API Documentation

Base URL:

```txt
http://localhost:5000/api
```

## Health

### GET /health

Response:

```json
{
  "status": "ok",
  "service": "smart-rental-api",
  "timestamp": "2026-06-22T00:00:00.000Z"
}
```

## Rooms

### GET /rooms

Response:

```json
{
  "data": [
    {
      "_id": "...",
      "name": "A101",
      "floor": 1,
      "price": 2500000,
      "status": "available"
    }
  ]
}
```
