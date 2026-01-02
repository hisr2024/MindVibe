# Mobile App Architecture Guide

This document describes the architecture patterns, design principles, and best practices for MindVibe's Android and iOS applications.

## 🏛️ Architectural Pattern

Both Android and iOS apps follow **Clean Architecture** with **MVVM (Model-View-ViewModel)** pattern.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (UI, ViewModels, State Management)     │
├─────────────────────────────────────────┤
│          Domain Layer                   │
│   (Use Cases, Business Logic, Models)   │
├─────────────────────────────────────────┤
│           Data Layer                    │
│  (Repositories, Data Sources, APIs)     │
└─────────────────────────────────────────┘
```

## 📱 Android Architecture

### Layer Structure

#### 1. Presentation Layer
```kotlin
presentation/
├── ui/
│   ├── auth/
│   │   ├── LoginScreen.kt
│   │   └── SignupScreen.kt
│   ├── dashboard/
│   │   └── DashboardScreen.kt
│   ├── chat/
│   │   └── ChatScreen.kt
│   └── common/
│       ├── components/
│       └── theme/
└── viewmodel/
    ├── AuthViewModel.kt
    ├── DashboardViewModel.kt
    └── ChatViewModel.kt
```

**Responsibilities**:
- Display UI using Jetpack Compose
- Handle user interactions
- Observe state from ViewModels
- No business logic

**Example**:
```kotlin
@Composable
fun LoginScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        TextField(
            value = uiState.email,
            onValueChange = { viewModel.updateEmail(it) },
            label = { Text("Email") }
        )
        
        TextField(
            value = uiState.password,
            onValueChange = { viewModel.updatePassword(it) },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation()
        )
        
        Button(
            onClick = { viewModel.login() },
            enabled = !uiState.isLoading
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator()
            } else {
                Text("Login")
            }
        }
    }
    
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }
}
```

#### 2. Domain Layer
```kotlin
domain/
├── model/
│   ├── User.kt
│   ├── Mood.kt
│   └── ChatMessage.kt
├── usecase/
│   ├── auth/
│   │   ├── LoginUseCase.kt
│   │   └── LogoutUseCase.kt
│   ├── mood/
│   │   └── TrackMoodUseCase.kt
│   └── chat/
│       └── SendMessageUseCase.kt
└── repository/
    ├── AuthRepository.kt
    ├── MoodRepository.kt
    └── ChatRepository.kt
```

**Responsibilities**:
- Define business logic
- Define domain models
- Define repository interfaces
- Platform-independent

**Example**:
```kotlin
// Domain Model
data class User(
    val id: String,
    val email: String,
    val name: String,
    val createdAt: Instant
)

// Use Case
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        email: String,
        password: String
    ): Result<User> {
        return try {
            // Business logic
            if (!isValidEmail(email)) {
                return Result.failure(InvalidEmailException())
            }
            
            authRepository.login(email, password)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}

// Repository Interface
interface AuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun logout(): Result<Unit>
    suspend fun getCurrentUser(): User?
}
```

#### 3. Data Layer
```kotlin
data/
├── api/
│   ├── MindVibeApi.kt
│   ├── dto/
│   │   ├── LoginRequest.kt
│   │   └── AuthResponse.kt
│   └── interceptor/
│       └── AuthInterceptor.kt
├── local/
│   ├── db/
│   │   ├── MindVibeDatabase.kt
│   │   └── dao/
│   │       ├── UserDao.kt
│   │       └── MoodDao.kt
│   └── prefs/
│       └── SecurePreferences.kt
└── repository/
    ├── AuthRepositoryImpl.kt
    └── MoodRepositoryImpl.kt
```

**Responsibilities**:
- Implement repository interfaces
- Handle API calls
- Manage local database
- Handle data caching

**Example**:
```kotlin
class AuthRepositoryImpl @Inject constructor(
    private val api: MindVibeApi,
    private val securePrefs: SecurePreferences,
    private val userDao: UserDao
) : AuthRepository {
    
    override suspend fun login(
        email: String,
        password: String
    ): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = api.login(LoginRequest(email, password))
            
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                
                // Save tokens
                securePrefs.saveAccessToken(authResponse.accessToken)
                securePrefs.saveRefreshToken(authResponse.refreshToken)
                
                // Save user to local DB
                val user = authResponse.user.toDomain()
                userDao.insertUser(user.toEntity())
                
                Result.success(user)
            } else {
                Result.failure(ApiException(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### State Management

Use `StateFlow` for reactive state management:

```kotlin
class ChatViewModel @Inject constructor(
    private val sendMessageUseCase: SendMessageUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    fun sendMessage(message: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            sendMessageUseCase(message)
                .onSuccess { response ->
                    _uiState.update { state ->
                        state.copy(
                            messages = state.messages + response,
                            isLoading = false
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update { state ->
                        state.copy(
                            error = error.message,
                            isLoading = false
                        )
                    }
                }
        }
    }
}

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

## 🍎 iOS Architecture

### Layer Structure

#### 1. Presentation Layer
```swift
Presentation/
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   └── SignupView.swift
│   ├── Dashboard/
│   │   └── DashboardView.swift
│   └── Chat/
│       └── ChatView.swift
└── ViewModels/
    ├── AuthViewModel.swift
    ├── DashboardViewModel.swift
    └── ChatViewModel.swift
```

**Example**:
```swift
struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Email", text: $viewModel.email)
                .textContentType(.emailAddress)
                .autocapitalization(.none)
            
            SecureField("Password", text: $viewModel.password)
                .textContentType(.password)
            
            Button("Login") {
                Task {
                    await viewModel.login()
                }
            }
            .disabled(viewModel.isLoading)
            
            if viewModel.isLoading {
                ProgressView()
            }
        }
        .padding()
        .onChange(of: viewModel.isLoggedIn) { isLoggedIn in
            if isLoggedIn {
                dismiss()
            }
        }
        .alert("Error", isPresented: $viewModel.hasError) {
            Button("OK") {}
        } message: {
            Text(viewModel.errorMessage ?? "Unknown error")
        }
    }
}
```

#### 2. Domain Layer
```swift
Domain/
├── Models/
│   ├── User.swift
│   ├── Mood.swift
│   └── ChatMessage.swift
├── UseCases/
│   ├── Auth/
│   │   └── LoginUseCase.swift
│   └── Chat/
│       └── SendMessageUseCase.swift
└── Repositories/
    ├── AuthRepositoryProtocol.swift
    └── ChatRepositoryProtocol.swift
```

**Example**:
```swift
// Domain Model
struct User: Identifiable {
    let id: String
    let email: String
    let name: String
    let createdAt: Date
}

// Use Case
class LoginUseCase {
    private let authRepository: AuthRepositoryProtocol
    
    init(authRepository: AuthRepositoryProtocol) {
        self.authRepository = authRepository
    }
    
    func execute(email: String, password: String) async throws -> User {
        guard isValidEmail(email) else {
            throw ValidationError.invalidEmail
        }
        
        return try await authRepository.login(email: email, password: password)
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
}
```

#### 3. Data Layer
```swift
Data/
├── Network/
│   ├── MindVibeAPIClient.swift
│   ├── DTOs/
│   │   ├── LoginRequest.swift
│   │   └── AuthResponse.swift
│   └── NetworkError.swift
├── Local/
│   ├── CoreData/
│   │   └── PersistenceController.swift
│   └── Keychain/
│       └── KeychainManager.swift
└── Repositories/
    ├── AuthRepository.swift
    └── ChatRepository.swift
```

**Example**:
```swift
class AuthRepository: AuthRepositoryProtocol {
    private let apiClient: MindVibeAPIClient
    private let keychainManager: KeychainManager
    
    init(apiClient: MindVibeAPIClient, keychainManager: KeychainManager) {
        self.apiClient = apiClient
        self.keychainManager = keychainManager
    }
    
    func login(email: String, password: String) async throws -> User {
        let request = LoginRequest(email: email, password: password)
        let response = try await apiClient.login(request: request)
        
        // Save tokens
        try keychainManager.save(token: response.accessToken, for: .accessToken)
        try keychainManager.save(token: response.refreshToken, for: .refreshToken)
        
        return response.user.toDomain()
    }
}
```

### State Management (Combine + async/await)

```swift
@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let sendMessageUseCase: SendMessageUseCase
    
    init(sendMessageUseCase: SendMessageUseCase) {
        self.sendMessageUseCase = sendMessageUseCase
    }
    
    func sendMessage(_ text: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await sendMessageUseCase.execute(message: text)
            messages.append(response)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}
```

## 🔄 Data Flow

### Request Flow
```
User Action → View → ViewModel → Use Case → Repository → API/DB
```

### Response Flow
```
API/DB → Repository → Use Case → ViewModel → View → UI Update
```

## 🗂️ Dependency Injection

### Android (Hilt)
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .connectTimeout(10, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideMindVibeApi(retrofit: Retrofit): MindVibeApi {
        return retrofit.create(MindVibeApi::class.java)
    }
}
```

### iOS (Manual DI or Resolver)
```swift
class DependencyContainer {
    static let shared = DependencyContainer()
    
    lazy var apiClient: MindVibeAPIClient = {
        MindVibeAPIClient(baseURL: Config.apiBaseURL)
    }()
    
    lazy var keychainManager: KeychainManager = {
        KeychainManager()
    }()
    
    lazy var authRepository: AuthRepositoryProtocol = {
        AuthRepository(apiClient: apiClient, keychainManager: keychainManager)
    }()
    
    lazy var loginUseCase: LoginUseCase = {
        LoginUseCase(authRepository: authRepository)
    }()
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test ViewModels with mock repositories
- Test Use Cases with mock repositories
- Test Repositories with mock APIs

### Integration Tests
- Test API integration
- Test database operations
- Test end-to-end flows

### UI Tests
- Test navigation flows
- Test user interactions
- Test accessibility

## 📊 Performance Best Practices

1. **Lazy Loading**: Load data on demand
2. **Pagination**: Use pagination for large lists
3. **Caching**: Cache API responses appropriately
4. **Image Optimization**: Use image loading libraries (Coil/Kingfisher)
5. **Background Processing**: Use WorkManager/Background Tasks
6. **Memory Management**: Avoid memory leaks, use weak references

## 🔐 Security Considerations

1. **Secure Storage**: Use Keystore/Keychain for sensitive data
2. **Network Security**: Implement certificate pinning
3. **Code Obfuscation**: Use ProGuard/R8 (Android)
4. **Input Validation**: Validate all user inputs
5. **Authentication**: Implement secure token management

---

**Built with ❤️ following industry best practices**
