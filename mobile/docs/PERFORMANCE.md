# Mobile Performance Optimization Guide

Best practices and techniques for optimizing MindVibe mobile applications for performance.

## 🎯 Performance Goals

### Target Metrics

#### Android
- Cold start: < 2 seconds
- Warm start: < 500ms
- Frame rate: 60 FPS (smooth scrolling)
- Memory usage (baseline): < 50 MB
- APK size: < 10 MB (without resources)
- Battery consumption: < 2% per hour (idle)

#### iOS
- Cold start: < 2 seconds
- Warm start: < 500ms
- Frame rate: 60-120 FPS (ProMotion)
- Memory usage (baseline): < 50 MB
- IPA size: < 15 MB (without resources)
- Battery consumption: < 2% per hour (idle)

## 🚀 App Startup Optimization

### Android

#### 1. Lazy Initialization
```kotlin
class MindVibeApplication : Application() {
    
    // Lazy initialization of heavy objects
    val analyticsManager by lazy { AnalyticsManager(this) }
    val imageLoader by lazy { ImageLoader.Builder(this).build() }
    
    override fun onCreate() {
        super.onCreate()
        
        // Only initialize essential components
        initLogging()
        
        // Defer non-critical initialization
        lifecycleScope.launch {
            delay(3000)
            initNonCriticalComponents()
        }
    }
    
    private fun initNonCriticalComponents() {
        // Initialize analytics, crash reporting, etc.
    }
}
```

#### 2. Startup Library
```kotlin
// Use Jetpack Startup for library initialization
class WorkManagerInitializer : Initializer<WorkManager> {
    override fun create(context: Context): WorkManager {
        val configuration = Configuration.Builder()
            .setMinimumLoggingLevel(Log.INFO)
            .build()
        WorkManager.initialize(context, configuration)
        return WorkManager.getInstance(context)
    }
    
    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
```

#### 3. Splash Screen
```kotlin
// Use Android 12+ Splash Screen API
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        
        // Keep splash screen visible while loading
        var isReady = false
        splashScreen.setKeepOnScreenCondition { !isReady }
        
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            // Load initial data
            viewModel.initialize()
            isReady = true
        }
    }
}
```

### iOS

#### 1. Lazy Properties
```swift
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    // Lazy initialization
    lazy var analyticsManager: AnalyticsManager = {
        AnalyticsManager()
    }()
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Only initialize essential components
        initializeLogging()
        
        // Defer non-critical initialization
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.initializeNonCriticalComponents()
        }
        
        return true
    }
    
    private func initializeNonCriticalComponents() {
        // Initialize analytics, crash reporting, etc.
    }
}
```

#### 2. Prewarming
```swift
// Prewarm URLSession
@main
struct MindVibeApp: App {
    init() {
        // Prewarm network stack
        URLSession.shared.dataTask(with: URL(string: "https://api.mindvibe.com")!) { _, _, _ in }
            .resume()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

## 🖼️ Image Optimization

### Android (Coil)

```kotlin
// Configure Coil for optimal performance
class MindVibeApplication : Application(), ImageLoaderFactory {
    
    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25) // 25% of available memory
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizeBytes(50 * 1024 * 1024) // 50 MB
                    .build()
            }
            .respectCacheHeaders(false)
            .build()
    }
}

// Use in Composable
@Composable
fun UserAvatar(url: String) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .size(Size.ORIGINAL) // or specific size
            .build(),
        contentDescription = "User avatar",
        modifier = Modifier.size(48.dp)
    )
}
```

### iOS (Kingfisher or Native)

```swift
// Configure Kingfisher
ImageCache.default.memoryStorage.config.totalCostLimit = 50 * 1024 * 1024 // 50 MB
ImageCache.default.diskStorage.config.sizeLimit = 100 * 1024 * 1024 // 100 MB

// Use in SwiftUI
struct UserAvatar: View {
    let url: URL
    
    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                ProgressView()
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            case .failure:
                Image(systemName: "person.circle.fill")
            @unknown default:
                EmptyView()
            }
        }
        .frame(width: 48, height: 48)
        .clipShape(Circle())
    }
}
```

## 📱 List Performance

### Android (LazyColumn)

```kotlin
@Composable
fun MoodList(moods: List<Mood>) {
    LazyColumn(
        // Increase content padding to preload items
        contentPadding = PaddingValues(vertical = 16.dp),
        // Reduce overdraw
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            items = moods,
            key = { it.id } // Important for recomposition
        ) { mood ->
            MoodItem(mood)
        }
    }
}

@Composable
fun MoodItem(mood: Mood) {
    // Keep item composables simple
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(mood.score.toString())
        Text(mood.note)
    }
}
```

### iOS (List/LazyVStack)

```swift
struct MoodListView: View {
    let moods: [Mood]
    
    var body: some View {
        List(moods) { mood in
            MoodRow(mood: mood)
                .listRowSeparator(.hidden)
        }
        .listStyle(.plain)
    }
}

struct MoodRow: View {
    let mood: Mood
    
    var body: some View {
        HStack {
            Text("\(mood.score)")
            Text(mood.note)
        }
        .padding()
    }
}
```

## 💾 Database Optimization

### Android (Room)

```kotlin
@Database(
    entities = [MoodEntity::class, UserEntity::class],
    version = 1,
    exportSchema = false
)
abstract class MindVibeDatabase : RoomDatabase() {
    
    companion object {
        @Volatile
        private var INSTANCE: MindVibeDatabase? = null
        
        fun getInstance(context: Context): MindVibeDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MindVibeDatabase::class.java,
                    "mindvibe_db"
                )
                    .setJournalMode(JournalMode.WRITE_AHEAD_LOGGING) // Better concurrency
                    .setQueryCallback(
                        { sqlQuery, bindArgs ->
                            if (BuildConfig.DEBUG) {
                                Log.d("RoomDB", "Query: $sqlQuery Args: $bindArgs")
                            }
                        },
                        Executors.newSingleThreadExecutor()
                    )
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// Optimize queries with indexes
@Entity(
    tableName = "moods",
    indices = [
        Index(value = ["user_id", "timestamp"]),
        Index(value = ["timestamp"])
    ]
)
data class MoodEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_id") val userId: String,
    val score: Int,
    val timestamp: Long
)

// Use Flow for reactive updates
@Dao
interface MoodDao {
    @Query("SELECT * FROM moods WHERE user_id = :userId ORDER BY timestamp DESC LIMIT :limit")
    fun getMoodsFlow(userId: String, limit: Int = 30): Flow<List<MoodEntity>>
}
```

### iOS (Core Data)

```swift
class PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init() {
        container = NSPersistentContainer(name: "MindVibe")
        
        // Enable persistent history tracking
        let description = container.persistentStoreDescriptions.first
        description?.setOption(true as NSNumber,
                              forKey: NSPersistentHistoryTrackingKey)
        
        // Lightweight migration
        description?.shouldInferMappingModelAutomatically = true
        description?.shouldMigrateStoreAutomatically = true
        
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data store failed to load: \(error)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}

// Fetch with batching
func fetchMoods() -> [Mood] {
    let fetchRequest: NSFetchRequest<MoodEntity> = MoodEntity.fetchRequest()
    fetchRequest.predicate = NSPredicate(format: "userId == %@", currentUserId)
    fetchRequest.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]
    fetchRequest.fetchLimit = 30
    fetchRequest.fetchBatchSize = 20 // Batch fetching
    
    do {
        return try context.fetch(fetchRequest).map { $0.toDomain() }
    } catch {
        print("Fetch failed: \(error)")
        return []
    }
}
```

## 🌐 Network Optimization

### Request Batching
```kotlin
// Android - Batch multiple requests
class ApiRepository(private val api: MindVibeApi) {
    
    suspend fun fetchDashboardData(): DashboardData = coroutineScope {
        val moods = async { api.getMoods() }
        val journal = async { api.getJournalEntries() }
        val stats = async { api.getStats() }
        
        DashboardData(
            moods = moods.await(),
            journal = journal.await(),
            stats = stats.await()
        )
    }
}
```

### Response Caching
```kotlin
// Android - Cache responses
val okHttpClient = OkHttpClient.Builder()
    .cache(Cache(cacheDir, 10 * 1024 * 1024)) // 10 MB cache
    .addInterceptor { chain ->
        var request = chain.request()
        
        // Add cache control for GET requests
        if (request.method == "GET") {
            request = request.newBuilder()
                .header("Cache-Control", "public, max-age=300") // 5 minutes
                .build()
        }
        
        chain.proceed(request)
    }
    .build()
```

### Compression
```kotlin
// Android - Enable GZIP compression
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val original = chain.request()
        val request = original.newBuilder()
            .header("Accept-Encoding", "gzip, deflate")
            .build()
        chain.proceed(request)
    }
    .build()
```

## ⚡ Memory Management

### Android

```kotlin
// Use onTrimMemory to release resources
override fun onTrimMemory(level: Int) {
    super.onTrimMemory(level)
    
    when (level) {
        TRIM_MEMORY_UI_HIDDEN -> {
            // UI hidden, release UI resources
        }
        TRIM_MEMORY_RUNNING_MODERATE,
        TRIM_MEMORY_RUNNING_LOW,
        TRIM_MEMORY_RUNNING_CRITICAL -> {
            // Release caches
            imageLoader.memoryCache?.clear()
        }
    }
}

// Use WeakReference for callbacks
class NetworkCallback(activity: Activity) {
    private val activityRef = WeakReference(activity)
    
    fun onResponse(data: Data) {
        activityRef.get()?.updateUI(data)
    }
}
```

### iOS

```swift
// Respond to memory warnings
class ImageCacheManager {
    private var cache = NSCache<NSString, UIImage>()
    
    init() {
        // Automatically evict on memory warning
        cache.totalCostLimit = 50 * 1024 * 1024
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(clearCache),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }
    
    @objc private func clearCache() {
        cache.removeAllObjects()
    }
}

// Use weak references
class NetworkManager {
    weak var delegate: NetworkManagerDelegate?
    
    func fetchData() async {
        let data = try await api.fetchData()
        await MainActor.run {
            delegate?.didFetchData(data)
        }
    }
}
```

## 🔋 Battery Optimization

### Background Work Management

#### Android
```kotlin
// Use WorkManager for background tasks
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .build()

val syncWork = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 1,
    repeatIntervalTimeUnit = TimeUnit.HOURS
)
    .setConstraints(constraints)
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        10,
        TimeUnit.SECONDS
    )
    .build()

WorkManager.getInstance(context)
    .enqueueUniquePeriodicWork(
        "sync_data",
        ExistingPeriodicWorkPolicy.KEEP,
        syncWork
    )
```

#### iOS
```swift
// Use Background Tasks
import BackgroundTasks

func scheduleAppRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.mindvibe.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
    
    do {
        try BGTaskScheduler.shared.submit(request)
    } catch {
        print("Could not schedule app refresh: \(error)")
    }
}

// Handle background task
func handleAppRefresh(task: BGAppRefreshTask) {
    scheduleAppRefresh() // Schedule next refresh
    
    task.expirationHandler = {
        task.setTaskCompleted(success: false)
    }
    
    Task {
        do {
            try await syncData()
            task.setTaskCompleted(success: true)
        } catch {
            task.setTaskCompleted(success: false)
        }
    }
}
```

## 📊 Performance Monitoring

### Android (Firebase Performance)
```kotlin
// Add custom traces
val trace = FirebasePerformance.getInstance().newTrace("chat_send_message")
trace.start()

try {
    val response = api.sendMessage(message)
    trace.putMetric("message_length", message.length.toLong())
    trace.putAttribute("success", "true")
} catch (e: Exception) {
    trace.putAttribute("success", "false")
    trace.putAttribute("error", e.message ?: "unknown")
} finally {
    trace.stop()
}
```

### iOS (Xcode Instruments)
```swift
// Use signposts for performance tracking
import os.signpost

let log = OSLog(subsystem: "com.mindvibe.app", category: "network")

func sendMessage(_ message: String) async throws {
    let signpostID = OSSignpostID(log: log)
    os_signpost(.begin, log: log, name: "Send Message", signpostID: signpostID)
    
    defer {
        os_signpost(.end, log: log, name: "Send Message", signpostID: signpostID)
    }
    
    try await api.sendMessage(message)
}
```

## 🎯 App Size Optimization

### Android
```kotlin
// build.gradle.kts
android {
    buildTypes {
        release {
            // Enable code shrinking
            isMinifyEnabled = true
            isShrinkResources = true
            
            // Remove unused resources
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    // Split APKs by ABI
    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
            isUniversalApk = false
        }
    }
}
```

### iOS
```swift
// Enable bitcode for App Store optimization
// Build Settings → Enable Bitcode → Yes

// Use on-demand resources for large assets
// Place infrequently used assets in ODR tags
```

---

**Optimized for Speed and Efficiency! ⚡**
