# Transfer Order Item Dropdown - Pagination Feature

## Overview
The item dropdown in Transfer Order Create now uses **pagination** to handle large item lists efficiently (600+ items).

## How It Works

### Initial Load
- Shows **20 items** by default
- User can scroll through these items or search to filter

### Load More Button
- When there are more items than displayed, a "Load More" button appears
- Shows current count: `Load More (20 of 256)`
- Each click loads **20 more items**
- Button disappears when all items are loaded

### Search Integration
- When user types in search box, pagination resets to show first 20 matching items
- "Load More" button appears if there are more matching results
- Allows efficient searching through large datasets

### Performance Benefits
- ✅ Only renders visible items (20 at a time)
- ✅ Smooth scrolling without lag
- ✅ Works with 600+ items
- ✅ Search filters before pagination
- ✅ Memory efficient

## Configuration

To adjust pagination size, modify these constants in `TransferOrderCreate.jsx`:

```javascript
const [displayedCount, setDisplayedCount] = useState(20); // Initial items shown
const ITEMS_PER_PAGE = 20; // Items loaded per "Load More" click
```

### Examples:
- **Smaller lists (100 items)**: Keep as is (20 per page)
- **Medium lists (300 items)**: Change to 30 per page
- **Large lists (1000+ items)**: Change to 50 per page

## User Experience

1. **Select Warehouse** → Item dropdown opens
2. **See first 20 items** → Scroll or search
3. **Click "Load More"** → Load next 20 items
4. **Search filters** → Shows matching items with pagination
5. **Select item** → Dropdown closes

## Example Scenarios

### Scenario 1: Browse all items
```
User selects "Warehouse" → Sees 20 items
User clicks "Load More" → Sees 40 items total
User clicks "Load More" → Sees 60 items total
... continues until all 256 items loaded
```

### Scenario 2: Search for specific item
```
User types "Black" → Filters to 45 matching items
Shows first 20 matching items
User clicks "Load More" → Shows 40 matching items
User clicks "Load More" → Shows all 45 matching items
```

### Scenario 3: Large dataset (600 items)
```
User selects warehouse → Sees 20 items
User can load more as needed
Search helps narrow down to relevant items
Never loads all 600 at once unless user keeps clicking "Load More"
```

## Technical Details

### State Management
- `displayedCount`: Tracks how many items to display
- `ITEMS_PER_PAGE`: Constant for pagination size
- Resets when search term changes

### Rendering
- Uses `filteredItems.slice(0, displayedCount)` to show paginated items
- "Load More" button increments `displayedCount` by `ITEMS_PER_PAGE`
- Shows item count: "Showing all X items" when complete

### Search + Pagination
- Search filters items first
- Pagination applies to filtered results
- Resets to first page when search changes

## Benefits Over Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Pagination (Current)** | Simple, intuitive, performant | Requires clicks to see more |
| Virtualization | Smooth scrolling | Complex, harder to debug |
| Show All | See everything at once | Slow with 600+ items, memory issues |
| Server-side pagination | Scalable | More API calls, network latency |

## Future Enhancements

- [ ] Auto-load more on scroll (infinite scroll)
- [ ] Remember pagination state
- [ ] Keyboard shortcuts (arrow keys to navigate)
- [ ] Recently selected items at top
- [ ] Favorites/pinned items
