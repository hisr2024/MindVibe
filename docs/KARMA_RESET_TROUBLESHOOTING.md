# Karma Reset Troubleshooting Guide

## Quick Diagnostics

### 1. Check Backend Health
```bash
curl https://your-backend.onrender.com/api/karma-reset/health
```

**Expected (Healthy):**
```json
{
  "status": "healthy",
  "service": "Karma Reset",
  "checks": {
    "openai_configured": true,
    "openai_key_valid": true,
    "database_connected": true
  },
  "errors": []
}
```

**Degraded Example:**
```json
{
  "status": "degraded",
  "service": "Karma Reset",
  "checks": {
    "openai_configured": false,
    "openai_key_valid": false,
    "database_connected": true
  },
  "errors": ["OPENAI_API_KEY not configured"]
}
```

### 2. Test Generate Endpoint
```bash
curl -X POST https://your-backend.onrender.com/api/karma-reset/generate \
  -H "Content-Type: application/json" \
  -d '{"whatHappened":"test situation","whoFeltRipple":"friend","repairType":"apologize"}'
```

**Expected Response:**
```json
{
  "reset_guidance": {
    "breathingLine": "Take four slow breaths...",
    "rippleSummary": "You experienced a moment...",
    "repairAction": "Offer a sincere apology...",
    "forwardIntention": "Move forward with..."
  },
  "_meta": {
    "request_id": "a1b2c3d4",
    "processing_time_ms": 1250,
    "model_used": "gpt-4"
  }
}
```

## Common Issues

### ⚠️ Issue: "Service Unavailable" (503)

**Cause:** OpenAI API key not configured or invalid

**Fix:**
1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Add variable:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-...` (your actual API key)
5. Click **Save Changes**
6. Service will auto-redeploy

**Verification:**
```bash
curl https://your-backend.onrender.com/api/karma-reset/health
# Should show "openai_configured": true
```

### ⚠️ Issue: "KIAAN couldn't be reached"

**Cause:** Network connectivity or CORS issue

**Fix:**
1. Verify frontend environment variable:
   ```bash
   # In your .env.local
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

2. Check backend is running:
   ```bash
   curl https://your-backend.onrender.com/health
   ```

3. Check browser console for CORS errors
4. Verify CORS configuration in backend allows your frontend domain

### ⚠️ Issue: Fallback responses always returned

**Symptoms:**
- `_meta.fallback_used: true` in responses
- Generic guidance instead of personalized

**Cause:** OpenAI API key invalid, quota exceeded, or API down

**Fix:**
1. Check health endpoint for specific error:
   ```bash
   curl https://your-backend.onrender.com/api/karma-reset/health
   ```

2. Verify API key in [OpenAI Dashboard](https://platform.openai.com/api-keys)

3. Check OpenAI account billing/quota

4. Review backend logs for OpenAI errors

### ⚠️ Issue: Slow response times (>5 seconds)

**Cause:** OpenAI API latency or cold start

**Fix:**
1. Check `_meta.processing_time_ms` in response
2. If consistently high (>3000ms):
   - Verify OpenAI service status
   - Consider upgrading OpenAI plan for better performance
   - Check network latency to OpenAI

3. For Render.com cold starts:
   - Upgrade to paid plan (keeps service warm)
   - Implement periodic health check pings

## Monitoring

### View Backend Logs

**On Render.com:**
1. Go to your service
2. Click **"Logs"** tab
3. Look for entries with `[request_id]` format

**Example log entries:**
```
INFO: [a1b2c3d4] Karma Reset request started
INFO: [a1b2c3d4] Karma Reset completed successfully in 1250ms
```

**Error example:**
```
ERROR: [a1b2c3d4] OpenAI error: Rate limit exceeded, using fallback
```

### Check Request IDs

When errors occur, the response includes a `request_id`:
```json
{
  "_meta": {
    "request_id": "a1b2c3d4",
    "fallback_used": true,
    "error": "Rate limit exceeded"
  }
}
```

Use this ID to search backend logs for full details:
```bash
# On Render.com logs, search for: a1b2c3d4
```

### Monitoring Endpoints

**Health Check:**
- Endpoint: `GET /api/karma-reset/health`
- Frequency: Check every 5 minutes
- Alert if: `status != "healthy"` for >10 minutes

**Fallback Rate:**
- Monitor `_meta.fallback_used` in responses
- Normal: <5% of requests use fallback
- Alert if: >20% use fallback (indicates OpenAI issues)

## Feature Flags

### Fallback Responses

The system **automatically uses fallback responses** when:
- OpenAI API key is not configured
- OpenAI API is down/unavailable
- Response parsing fails
- Any OpenAI error occurs

**This ensures users always get a response, never a complete failure.**

### Response Structure

All responses follow this structure:
```json
{
  "reset_guidance": {
    "breathingLine": "...",
    "rippleSummary": "...",
    "repairAction": "...",
    "forwardIntention": "..."
  },
  "_meta": {
    "request_id": "unique-id",
    "processing_time_ms": 1234,
    "model_used": "gpt-4" | "fallback",
    "fallback_used": true | false
  }
}
```

## Troubleshooting Workflow

```
1. Issue Reported
   ↓
2. Get Request ID from user/frontend logs
   ↓
3. Check Health Endpoint
   ↓
4. Search Backend Logs for Request ID
   ↓
5. Identify Error Type:
   - OpenAI unavailable → Check API key/quota
   - Network error → Check CORS/connectivity
   - Parsing error → Check response format
   - Database error → Check connection
   ↓
6. Apply Fix
   ↓
7. Verify with Health Check
   ↓
8. Test Generate Endpoint
```

## Environment Variables Checklist

**Backend (Render.com):**
- [ ] `OPENAI_API_KEY` - Valid OpenAI API key
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] Other app-specific vars

**Frontend (Vercel):**
- [ ] `NEXT_PUBLIC_API_URL` - Backend URL (e.g., https://your-backend.onrender.com)

## Performance Benchmarks

**Target Metrics:**
- Response time: <3 seconds (p95)
- Success rate: >95% (with fallbacks counted as success)
- OpenAI usage: >80% (fallback usage <20%)
- Error rate: <1%

**Current Status:**
Check via health endpoint and response `_meta` fields.

## Support

If issues persist after following this guide:

1. **Check Health Endpoint:**
   ```bash
   curl https://your-backend.onrender.com/api/karma-reset/health
   ```

2. **Collect Request ID** from error response

3. **Review Backend Logs** on Render.com for that request ID

4. **Create GitHub Issue** with:
   - Health check output
   - Request ID
   - Frontend console errors (sanitized)
   - Backend logs (sanitized)
   - Steps to reproduce

## Additional Resources

- [OpenAI API Status](https://status.openai.com/)
- [Render.com Status](https://status.render.com/)
- [GitHub Repository Issues](https://github.com/hisr2024/MindVibe/issues)

---

**Last Updated:** 2025-12-06  
**Version:** 1.0
