package com.mindvibe.app.journey.data

import com.mindvibe.app.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Hilt module that wires up the OkHttp + Retrofit stack used by the
 * Journey-engine repository (and, in follow-ups, every other backed
 * feature). All instances are @Singleton so we never pay the TLS-handshake
 * cost twice.
 *
 * The [AuthInterceptor] reads the latest Bearer token on every request, so
 * a refresh in [AuthTokenStore] is reflected in subsequent calls without
 * rebuilding Retrofit.
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenStore: AuthTokenStore): Interceptor =
        Interceptor { chain ->
            val req = chain.request().newBuilder()
                .header("Accept", "application/json")
                .apply {
                    tokenStore.bearerToken?.takeIf { it.isNotBlank() }?.let { token ->
                        header("Authorization", "Bearer $token")
                    }
                }
                .build()
            chain.proceed(req)
        }

    @Provides
    @Singleton
    fun provideOkHttp(authInterceptor: Interceptor): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        return OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttp: OkHttpClient): Retrofit {
        // BuildConfig.API_BASE_URL is wired by app/build.gradle.kts to the
        // emulator address in debug and the production host in release.
        val base = BuildConfig.API_BASE_URL.let {
            if (it.endsWith("/")) it else "$it/"
        }
        return Retrofit.Builder()
            .baseUrl(base)
            .client(okHttp)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideJourneyEngineApi(retrofit: Retrofit): JourneyEngineApi =
        retrofit.create(JourneyEngineApi::class.java)
}
