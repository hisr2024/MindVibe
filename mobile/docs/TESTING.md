# Mobile Testing Guide

Comprehensive testing strategy for MindVibe Android and iOS applications.

## 🧪 Testing Pyramid

```
           /\
          /  \  UI Tests (10%)
         /    \
        /------\  Integration Tests (20%)
       /        \
      /----------\  Unit Tests (70%)
     /--------------\
```

## 📱 Android Testing

### Setup

Add test dependencies in `app/build.gradle.kts`:
```kotlin
dependencies {
    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("app.cash.turbine:turbine:1.0.0")
    testImplementation("com.google.truth:truth:1.1.5")
    
    // Android Testing
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test:rules:1.5.0")
    
    // Debug
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### 1. Unit Tests

#### ViewModel Tests
```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    private lateinit var viewModel: AuthViewModel
    private lateinit var mockLoginUseCase: LoginUseCase
    
    @Before
    fun setup() {
        mockLoginUseCase = mockk()
        viewModel = AuthViewModel(mockLoginUseCase)
    }
    
    @Test
    fun `login with valid credentials should update state to success`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password123"
        val expectedUser = User(id = "123", email = email, name = "Test")
        
        coEvery { mockLoginUseCase(email, password) } returns Result.success(expectedUser)
        
        // When
        viewModel.updateEmail(email)
        viewModel.updatePassword(password)
        viewModel.login()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(true, state.isLoggedIn)
            assertEquals(expectedUser, state.user)
            assertEquals(false, state.isLoading)
        }
    }
    
    @Test
    fun `login with invalid credentials should show error`() = runTest {
        // Given
        val email = "invalid@example.com"
        val password = "wrong"
        
        coEvery { mockLoginUseCase(email, password) } returns 
            Result.failure(AuthException("Invalid credentials"))
        
        // When
        viewModel.updateEmail(email)
        viewModel.updatePassword(password)
        viewModel.login()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(false, state.isLoggedIn)
            assertNotNull(state.error)
            assertEquals(false, state.isLoading)
        }
    }
}
```

#### Use Case Tests
```kotlin
class LoginUseCaseTest {
    
    private lateinit var useCase: LoginUseCase
    private lateinit var mockRepository: AuthRepository
    
    @Before
    fun setup() {
        mockRepository = mockk()
        useCase = LoginUseCase(mockRepository)
    }
    
    @Test
    fun `invoke with valid email should call repository`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password"
        val expectedUser = User(id = "123", email = email, name = "Test")
        
        coEvery { mockRepository.login(email, password) } returns Result.success(expectedUser)
        
        // When
        val result = useCase(email, password)
        
        // Then
        assertTrue(result.isSuccess)
        assertEquals(expectedUser, result.getOrNull())
        coVerify(exactly = 1) { mockRepository.login(email, password) }
    }
    
    @Test
    fun `invoke with invalid email should return failure`() = runTest {
        // Given
        val invalidEmail = "not-an-email"
        val password = "password"
        
        // When
        val result = useCase(invalidEmail, password)
        
        // Then
        assertTrue(result.isFailure)
        coVerify(exactly = 0) { mockRepository.login(any(), any()) }
    }
}
```

#### Repository Tests
```kotlin
class AuthRepositoryImplTest {
    
    private lateinit var repository: AuthRepositoryImpl
    private lateinit var mockApi: MindVibeApi
    private lateinit var mockSecurePrefs: SecurePreferences
    
    @Before
    fun setup() {
        mockApi = mockk()
        mockSecurePrefs = mockk(relaxed = true)
        repository = AuthRepositoryImpl(mockApi, mockSecurePrefs)
    }
    
    @Test
    fun `login successful should save tokens and return user`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password"
        val authResponse = AuthResponse(
            accessToken = "access_token",
            refreshToken = "refresh_token",
            user = UserDto(id = "123", email = email, name = "Test")
        )
        
        coEvery { mockApi.login(any()) } returns Response.success(authResponse)
        
        // When
        val result = repository.login(email, password)
        
        // Then
        assertTrue(result.isSuccess)
        verify { mockSecurePrefs.saveAccessToken("access_token") }
        verify { mockSecurePrefs.saveRefreshToken("refresh_token") }
    }
}
```

### 2. Integration Tests

```kotlin
@RunWith(AndroidJUnit4::class)
class MoodDatabaseTest {
    
    private lateinit var database: MindVibeDatabase
    private lateinit var moodDao: MoodDao
    
    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, MindVibeDatabase::class.java)
            .build()
        moodDao = database.moodDao()
    }
    
    @After
    fun tearDown() {
        database.close()
    }
    
    @Test
    fun insertAndRetrieveMood() = runTest {
        // Given
        val mood = MoodEntity(
            id = "123",
            userId = "user1",
            score = 7,
            tags = listOf("happy"),
            note = "Great day!",
            timestamp = System.currentTimeMillis()
        )
        
        // When
        moodDao.insertMood(mood)
        val retrieved = moodDao.getMoodById("123")
        
        // Then
        assertNotNull(retrieved)
        assertEquals(mood.score, retrieved?.score)
        assertEquals(mood.tags, retrieved?.tags)
    }
}
```

### 3. UI Tests (Compose)

```kotlin
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {
    
    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()
    
    @Test
    fun loginScreen_displaysAllElements() {
        composeTestRule.setContent {
            LoginScreen(
                viewModel = mockk(relaxed = true),
                onLoginSuccess = {}
            )
        }
        
        // Verify elements are displayed
        composeTestRule.onNodeWithText("Email").assertIsDisplayed()
        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Login").assertIsDisplayed()
    }
    
    @Test
    fun loginScreen_clickLoginButton_callsViewModel() {
        val mockViewModel: AuthViewModel = mockk(relaxed = true)
        
        composeTestRule.setContent {
            LoginScreen(
                viewModel = mockViewModel,
                onLoginSuccess = {}
            )
        }
        
        // Type email and password
        composeTestRule.onNodeWithText("Email")
            .performTextInput("test@example.com")
        composeTestRule.onNodeWithText("Password")
            .performTextInput("password123")
        
        // Click login button
        composeTestRule.onNodeWithText("Login")
            .performClick()
        
        // Verify login was called
        verify { mockViewModel.login() }
    }
}
```

### Running Tests

```bash
# Unit tests
./gradlew test

# Unit tests with coverage
./gradlew testDebugUnitTest jacocoTestReport

# Instrumented tests
./gradlew connectedAndroidTest

# Specific test class
./gradlew test --tests "AuthViewModelTest"
```

## 🍎 iOS Testing

### Setup

Tests are automatically included in the Xcode project.

### 1. Unit Tests

#### ViewModel Tests
```swift
import XCTest
@testable import MindVibe

class AuthViewModelTests: XCTestCase {
    
    var sut: AuthViewModel!
    var mockLoginUseCase: MockLoginUseCase!
    
    override func setUp() {
        super.setUp()
        mockLoginUseCase = MockLoginUseCase()
        sut = AuthViewModel(loginUseCase: mockLoginUseCase)
    }
    
    override func tearDown() {
        sut = nil
        mockLoginUseCase = nil
        super.tearDown()
    }
    
    func testLogin_WithValidCredentials_UpdatesStateToSuccess() async {
        // Given
        let email = "test@example.com"
        let password = "password123"
        let expectedUser = User(id: "123", email: email, name: "Test")
        
        mockLoginUseCase.result = .success(expectedUser)
        sut.email = email
        sut.password = password
        
        // When
        await sut.login()
        
        // Then
        XCTAssertTrue(sut.isLoggedIn)
        XCTAssertEqual(sut.user?.id, expectedUser.id)
        XCTAssertFalse(sut.isLoading)
    }
    
    func testLogin_WithInvalidCredentials_ShowsError() async {
        // Given
        let email = "invalid@example.com"
        let password = "wrong"
        
        mockLoginUseCase.result = .failure(AuthError.invalidCredentials)
        sut.email = email
        sut.password = password
        
        // When
        await sut.login()
        
        // Then
        XCTAssertFalse(sut.isLoggedIn)
        XCTAssertNotNil(sut.errorMessage)
        XCTAssertFalse(sut.isLoading)
    }
}
```

#### Use Case Tests
```swift
class LoginUseCaseTests: XCTestCase {
    
    var sut: LoginUseCase!
    var mockRepository: MockAuthRepository!
    
    override func setUp() {
        super.setUp()
        mockRepository = MockAuthRepository()
        sut = LoginUseCase(authRepository: mockRepository)
    }
    
    func testExecute_WithValidEmail_CallsRepository() async throws {
        // Given
        let email = "test@example.com"
        let password = "password"
        let expectedUser = User(id: "123", email: email, name: "Test")
        
        mockRepository.loginResult = .success(expectedUser)
        
        // When
        let user = try await sut.execute(email: email, password: password)
        
        // Then
        XCTAssertEqual(user.id, expectedUser.id)
        XCTAssertTrue(mockRepository.loginCalled)
    }
    
    func testExecute_WithInvalidEmail_ThrowsError() async {
        // Given
        let invalidEmail = "not-an-email"
        let password = "password"
        
        // When/Then
        do {
            _ = try await sut.execute(email: invalidEmail, password: password)
            XCTFail("Expected error to be thrown")
        } catch {
            XCTAssertTrue(error is ValidationError)
        }
    }
}
```

### 2. UI Tests

```swift
class LoginScreenUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    func testLoginScreen_DisplaysAllElements() {
        // Navigate to login screen
        let loginButton = app.buttons["Login"]
        XCTAssertTrue(loginButton.exists)
        
        loginButton.tap()
        
        // Verify elements
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
        XCTAssertTrue(app.buttons["Login"].exists)
    }
    
    func testLoginScreen_WithValidCredentials_NavigatesToDashboard() {
        // Navigate to login
        app.buttons["Login"].tap()
        
        // Enter credentials
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        
        // Tap login
        app.buttons["Login"].tap()
        
        // Verify navigation
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 5))
    }
}
```

### Running Tests

```bash
# Unit tests
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15'

# UI tests
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:MindVibeUITests

# With coverage
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15' -enableCodeCoverage YES
```

## 🎯 Best Practices

### 1. Test Naming Convention
```
[MethodName]_[Scenario]_[ExpectedResult]

Examples:
- login_WithValidCredentials_ReturnsSuccess
- sendMessage_WhenOffline_ThrowsNetworkError
- fetchMoods_WithPagination_ReturnsCorrectPage
```

### 2. AAA Pattern
```kotlin
@Test
fun testExample() {
    // Arrange (Given)
    val input = "test"
    
    // Act (When)
    val result = processInput(input)
    
    // Assert (Then)
    assertEquals("expected", result)
}
```

### 3. Mock External Dependencies
- Always mock API calls
- Mock database in unit tests
- Use in-memory database for integration tests

### 4. Test Coverage Goals
- Unit tests: 80%+ coverage
- Critical paths: 100% coverage
- UI tests: Key user flows

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Android CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up JDK
      uses: actions/setup-java@v2
      with:
        java-version: '17'
        
    - name: Run unit tests
      run: ./gradlew test
      
    - name: Generate coverage report
      run: ./gradlew jacocoTestReport
      
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

**Comprehensive testing for reliable mobile apps**
