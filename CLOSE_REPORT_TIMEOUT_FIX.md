# Close Report Timeout Fix

## Problem
In production, the Close Report was timing out when fetching opening balance data for stores:
```
⏱️ Timeout fetching opening balance for store 704
⏱️ Timeout fetching opening balance for store 705
...
✅ Completed 18 API calls in 5389ms
```

The timeout was set to 5 seconds, but production backend was taking longer than that to respond.

## Root Cause
**File:** `frontend/src/pages/CloseReport.jsx` (line 78)

```javascript
setTimeout(() => reject(new Error('Timeout')), 5000) // 5 second timeout
```

The Close Report fetches opening balance for all stores in parallel (18 stores), and in production:
- Network latency is higher
- Database queries are slower
- Backend processing takes longer

5 seconds was not enough time for all parallel requests to complete.

## Solution
Increased timeout from 5 seconds to 15 seconds:

```javascript
setTimeout(() => reject(new Error('Timeout')), 15000) // 15 second timeout (increased for production)
```

## Why This Works
- **Parallel execution**: All 18 API calls still run simultaneously (maximum performance)
- **Longer timeout**: Gives production backend enough time to respond
- **Graceful fallback**: If timeout still occurs, opening balance defaults to 0 (no crash)

## Alternative Solutions (Future Improvements)
1. **Remove timeout entirely**: Let fetch complete naturally
2. **Add retry logic**: Retry failed requests automatically
3. **Backend optimization**: Cache opening balance data
4. **Progressive loading**: Show stores as data arrives instead of waiting for all

## Testing
1. Open Close Report in production
2. Select a date and click "Fetch"
3. Verify all stores load without timeout errors
4. Check console - should see: `✅ Completed 18 API calls in Xms` (where X < 15000)

## Files Modified
- `frontend/src/pages/CloseReport.jsx` - Increased timeout from 5s to 15s

## Commit Message
Fix: Increase Close Report opening balance timeout to 15s for production
