# Transfer Order Visibility Debug Guide

## Issue
Transfer order created from Warehouse to Kottayam Branch is not showing in Kottayam branch UI.

## Debug Steps

### Step 1: Check Browser Console (Kottayam Branch Login)
1. Log into the application as **Kottayam Branch** user
2. Navigate to **Transfer Orders** page
3. Open browser console (F12 or Right-click → Inspect → Console tab)
4. Look for these log messages:

```
🔍 Transfer Orders: Filtering by warehouse (source OR destination): "..."
🔍 Filtering for user warehouse: "..." (base: "...")
Order TO-XXX: Source="..." Dest="..." Status="..." MatchesDest=... MatchesSource=...
```

### Step 2: What to Check
Look for these specific details in the console:

1. **User's warehouse name**: What warehouse name is the Kottayam user logged in as?
   - Example: `"Kottayam Branch"`, `"G.Kottayam"`, `"Kottayam"`, etc.

2. **Transfer order details**: For each transfer order, check:
   - Source warehouse name
   - Destination warehouse name
   - Status (draft/in_transit/transferred)
   - Whether it matches destination (MatchesDest)
   - Whether it matches source (MatchesSource)

3. **Matching results**: Look for:
   - ✅ Exact match
   - ✅ Base match
   - ✅ Partial match
   - ✅ Normalized match
   - ❌ No match

### Step 3: Common Issues

#### Issue A: Warehouse Name Mismatch
**Symptom**: Console shows `❌ No match` for all comparisons

**Possible causes**:
- User logged in as `"G.Kottayam"` but transfer order has `"Kottayam Branch"`
- Extra spaces in warehouse name (e.g., `"Kottayam Branch "` with trailing space)
- Different casing (e.g., `"kottayam branch"` vs `"Kottayam Branch"`)
- Missing "Branch" suffix (e.g., `"Kottayam"` vs `"Kottayam Branch"`)

**Solution**: The code should handle these automatically, but if not, we need to add specific mapping.

#### Issue B: Draft Order at Destination
**Symptom**: Console shows `⚠️ Hiding draft order at destination`

**Explanation**: Draft orders are intentionally hidden from destination warehouse. They only show at source warehouse until status changes to "in_transit" or "transferred".

**Solution**: Change order status from "draft" to "in_transit" or "transferred" (admin can do this).

#### Issue C: User Not Logged In Correctly
**Symptom**: No console logs appear, or logs show different warehouse

**Solution**: Verify user is logged in as Kottayam Branch user (check `locCode` or `username`).

### Step 4: Report Findings
After checking the console, report:
1. What warehouse name is the Kottayam user logged in as?
2. What is the transfer order's destination warehouse name?
3. What is the transfer order's status?
4. What do the console logs show for matching?

## Current Warehouse Mapping

The system maps these location names to warehouse names:

```javascript
"G.Kottayam" → "Kottayam Branch"
"GKottayam" → "Kottayam Branch"
"Kottayam Branch" → "Kottayam Branch"
```

## Matching Logic

The system tries multiple matching strategies:
1. **Exact match**: `"Kottayam Branch"` === `"Kottayam Branch"`
2. **Base name match**: `"Kottayam"` === `"Kottayam"` (removes "Branch"/"Warehouse" suffix)
3. **Partial match**: `"Kottayam Branch"` contains `"Kottayam"`
4. **Normalized match**: Removes prefixes like `"G."`, `"Z."`, `"SG-"`

## Next Steps

Once you provide the console output, we can:
1. Add specific warehouse name mapping if needed
2. Fix any warehouse name inconsistencies in the database
3. Update the matching logic if there's a special case we're missing
