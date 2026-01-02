package com.mindvibe.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * MindVibe Application class
 * Entry point for the Android application with Hilt dependency injection
 */
@HiltAndroidApp
class MindVibeApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize application-level components
        initializeLogging()
        initializeErrorHandling()
    }
    
    private fun initializeLogging() {
        // Setup logging (e.g., Timber in debug builds)
        if (BuildConfig.DEBUG) {
            // timber.plant(timber.DebugTree())
        }
    }
    
    private fun initializeErrorHandling() {
        // Setup crash reporting (e.g., Firebase Crashlytics)
        // Only in release builds
    }
}
