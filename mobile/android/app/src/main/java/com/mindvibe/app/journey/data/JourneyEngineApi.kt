package com.mindvibe.app.journey.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit interface for the /api/journey-engine routes defined in
 * backend/routes/journey_engine.py. Read-only endpoints are GET, state
 * changes are POST/DELETE — and `completeStep` accepts an idempotency
 * key in the body so retries never double-credit the user.
 *
 * All calls are suspend so the ViewModel can dispatch them on
 * Dispatchers.IO without callbacks.
 */
interface JourneyEngineApi {

    // -------- Templates -----------------------------------------------------

    @GET("api/journey-engine/templates")
    suspend fun listTemplates(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
        @Query("primary_enemy") primaryEnemy: String? = null,
        @Query("difficulty") difficulty: String? = null,
    ): TemplateListDto

    @GET("api/journey-engine/templates/{templateId}")
    suspend fun getTemplate(@Path("templateId") templateId: String): TemplateDto

    @GET("api/journey-engine/templates/slug/{slug}")
    suspend fun getTemplateBySlug(@Path("slug") slug: String): TemplateDto

    // -------- Journeys ------------------------------------------------------

    @GET("api/journey-engine/journeys")
    suspend fun listJourneys(
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
    ): JourneyListDto

    @POST("api/journey-engine/journeys")
    suspend fun startJourney(@Body body: StartJourneyRequest): JourneyDto

    @GET("api/journey-engine/journeys/{journeyId}")
    suspend fun getJourney(@Path("journeyId") journeyId: String): JourneyDto

    @POST("api/journey-engine/journeys/{journeyId}/pause")
    suspend fun pauseJourney(@Path("journeyId") journeyId: String): JourneyDto

    @POST("api/journey-engine/journeys/{journeyId}/resume")
    suspend fun resumeJourney(@Path("journeyId") journeyId: String): JourneyDto

    @DELETE("api/journey-engine/journeys/{journeyId}")
    suspend fun abandonJourney(@Path("journeyId") journeyId: String): JourneyDto

    // -------- Steps ---------------------------------------------------------

    @GET("api/journey-engine/journeys/{journeyId}/steps/current")
    suspend fun getCurrentStep(@Path("journeyId") journeyId: String): StepDto?

    @GET("api/journey-engine/journeys/{journeyId}/steps/{dayIndex}")
    suspend fun getStep(
        @Path("journeyId") journeyId: String,
        @Path("dayIndex") dayIndex: Int,
    ): StepDto

    @POST("api/journey-engine/journeys/{journeyId}/steps/{dayIndex}/complete")
    suspend fun completeStep(
        @Path("journeyId") journeyId: String,
        @Path("dayIndex") dayIndex: Int,
        @Body body: CompleteStepRequest,
    ): CompletionResponseDto

    // -------- Dashboard / Battleground -------------------------------------

    @GET("api/journey-engine/dashboard")
    suspend fun getDashboard(): DashboardDto

    @GET("api/journey-engine/enemies/{enemy}")
    suspend fun getEnemyProgress(@Path("enemy") enemy: String): EnemyProgressDto?
}

data class StartJourneyRequest(
    // Field name MUST stay snake_case to match the backend Pydantic
    // StartJourneyRequest.template_id at backend/routes/journey_engine.py.
    // Renaming the Kotlin property to camelCase would require an explicit
    // @SerializedName, so we keep the wire name verbatim instead.
    val template_id: String,
)
