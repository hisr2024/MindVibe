# Mobile API Integration Guide

This guide explains how to integrate MindVibe's backend API with the Android and iOS mobile applications.

## 📡 API Overview

### Base URLs
- **Development**: `http://localhost:8000` (Android emulator: `http://10.0.2.2:8000`)
- **Staging**: `https://staging-api.mindvibe.com`
- **Production**: `https://api.mindvibe.com`

### Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### API Documentation
Interactive API documentation is available at:
- Swagger UI: `{BASE_URL}/docs`
- ReDoc: `{BASE_URL}/redoc`

## 🔐 Authentication Flow

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### 2. Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## 🗣️ KIAAN Chat API

### Send Message
```http
POST /api/chat/message
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "I'm feeling anxious about work",
  "language": "en",
  "context": {
    "mood_score": 5,
    "recent_moods": ["anxious", "stressed"]
  }
}
```

**Response**:
```json
{
  "response": "I understand you're feeling anxious about work...",
  "session_id": "uuid",
  "wisdom_verses": [
    {
      "verse_id": "2.47",
      "text": "You have the right to perform your duties...",
      "relevance": "outcome_detachment"
    }
  ],
  "suggestions": [
    "Try the breathing exercise",
    "Journal about your worries"
  ]
}
```

### Get Chat History
```http
GET /api/chat/history/{session_id}
Authorization: Bearer <access_token>
```

## 📊 Mood Tracking API

### Create Mood Entry
```http
POST /moods
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "score": 7,
  "tags": ["happy", "energetic"],
  "note": "Had a great day!",
  "timestamp": "2024-01-02T19:45:00Z"
}
```

**Response**:
```json
{
  "id": "uuid",
  "score": 7,
  "tags": ["happy", "energetic"],
  "note": "Had a great day!",
  "timestamp": "2024-01-02T19:45:00Z",
  "user_id": "uuid"
}
```

### Get Mood History
```http
GET /moods?limit=30&offset=0
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "moods": [...],
  "total": 100,
  "limit": 30,
  "offset": 0
}
```

## 📝 Journal API (Encrypted)

### Upload Encrypted Entry
```http
POST /journal/upload
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "encrypted_data": "base64_encoded_encrypted_content",
  "encryption_metadata": {
    "algorithm": "AES-256-GCM",
    "key_id": "user_key_id"
  }
}
```

### Retrieve Encrypted Entries
```http
GET /journal/blobs
Authorization: Bearer <access_token>
```

## 🕉️ Bhagavad Gita API

### Get Verses
```http
GET /api/gita/verses?chapter=2&limit=10
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "verses": [
    {
      "id": "2.1",
      "chapter": 2,
      "verse_number": 1,
      "sanskrit": "संजय उवाच...",
      "transliteration": "sañjaya uvāca...",
      "translation_en": "Sanjaya said...",
      "translation_hi": "संजय ने कहा...",
      "commentary": "...",
      "mental_health_tags": ["anxiety", "depression"]
    }
  ],
  "total": 700,
  "chapter_info": {
    "number": 2,
    "title_en": "The Yoga of Knowledge",
    "title_hi": "साङ्ख्ययोग"
  }
}
```

### Search Verses
```http
POST /api/wisdom/search
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "query": "anxiety and worry",
  "language": "en",
  "limit": 5
}
```

## 📈 Analytics API

### Get User Analytics
```http
GET /analytics/dashboard
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "mood_trends": {
    "average_score": 6.5,
    "weekly_change": 0.5,
    "monthly_summary": {...}
  },
  "usage_stats": {
    "total_sessions": 45,
    "total_messages": 230,
    "journal_entries": 12
  },
  "insights": [...]
}
```

## 🌐 Multi-Language Support

All API endpoints support the `Accept-Language` header:
```http
GET /api/wisdom/verses
Authorization: Bearer <access_token>
Accept-Language: hi
```

Supported languages: `en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`, `pa`, `sa`, `es`, `fr`, `de`, `pt`, `ja`, `zh`

## 🔄 Pagination

List endpoints support pagination:
```http
GET /moods?limit=20&offset=40
```

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "reason": "Format validation failed"
    }
  }
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 📱 Platform-Specific Implementation

### Android (Kotlin + Retrofit)

```kotlin
// API Service Interface
interface MindVibeApi {
    @POST("api/auth/login")
    suspend fun login(@Body credentials: LoginRequest): Response<AuthResponse>
    
    @GET("moods")
    suspend fun getMoods(
        @Query("limit") limit: Int = 30,
        @Query("offset") offset: Int = 0
    ): Response<MoodListResponse>
    
    @POST("api/chat/message")
    suspend fun sendMessage(@Body request: ChatRequest): Response<ChatResponse>
}

// Retrofit Setup
val retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.API_BASE_URL)
    .addConverterFactory(GsonConverterFactory.create())
    .client(okHttpClient)
    .build()

val api = retrofit.create(MindVibeApi::class.java)
```

### iOS (Swift + URLSession)

```swift
// API Client
class MindVibeAPIClient {
    private let baseURL = Config.apiBaseURL
    private let session = URLSession.shared
    
    func login(email: String, password: String) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/api/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = LoginRequest(email: email, password: password)
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
        
        return try JSONDecoder().decode(AuthResponse.self, from: data)
    }
}
```

## 🔒 Security Best Practices

### 1. Token Storage
- **Android**: Use EncryptedSharedPreferences or Android Keystore
- **iOS**: Use Keychain Services

### 2. Certificate Pinning
Implement certificate pinning to prevent man-in-the-middle attacks:

**Android (OkHttp)**:
```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.mindvibe.com", "sha256/AAAAAAAAAA...")
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

**iOS (URLSession)**:
```swift
func urlSession(_ session: URLSession,
                didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    // Implement certificate pinning
}
```

### 3. Request Timeout
Set appropriate timeouts:
- Connect timeout: 10 seconds
- Read timeout: 30 seconds
- Write timeout: 30 seconds

### 4. Retry Logic
Implement exponential backoff for failed requests:
```kotlin
class RetryInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var attempt = 0
        var response: Response? = null
        
        while (attempt < MAX_RETRIES) {
            response = chain.proceed(chain.request())
            if (response.isSuccessful) break
            
            attempt++
            Thread.sleep((2.0.pow(attempt) * 1000).toLong())
        }
        
        return response ?: throw IOException("Max retries exceeded")
    }
}
```

## 📊 Rate Limiting

API rate limits:
- Authentication: 10 requests/minute
- Chat messages: 60 requests/minute
- Mood entries: 100 requests/minute
- General API: 300 requests/minute

Handle rate limit errors:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

## 🧪 Testing

### Mock API Responses
Use mock responses for unit tests:

```kotlin
@Test
fun `test login success`() = runTest {
    val mockApi = mockk<MindVibeApi>()
    coEvery { mockApi.login(any()) } returns Response.success(
        AuthResponse(accessToken = "token", user = mockUser)
    )
    
    val repository = AuthRepository(mockApi)
    val result = repository.login("test@example.com", "password")
    
    assertTrue(result.isSuccess)
}
```

## 📚 Additional Resources

- [Backend API Documentation](../../docs/MOBILE_BFF.md)
- [OpenAPI Specification](../../backend/openapi.json)
- [Postman Collection](../../postman_collection.json)

---

**Built with ❤️ for seamless mobile integration**
