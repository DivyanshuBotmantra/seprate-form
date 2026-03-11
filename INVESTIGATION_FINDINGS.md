# Investigation: Pagination Dropdown Hang Issue

## Root Cause Analysis

### Problem

When opening the pagination dropdown (Select component), the page becomes unresponsive and hangs.

## 🔴 CRITICAL FINDING: Implementation Issue

### **You ARE using the component incorrectly!**

The issue is NOT with the static data itself, but with **how the data and columns are being passed to the table**.

### Root Causes Identified

#### 0. **Data and Columns Recreated on Every Render** (PRIMARY ROOT CAUSE)

In both `src/pages/user.tsx` and `src/pages/bots/tb-vs-gl.tsx`:

**Problem 1: Data array recreated on every render**

```typescript
const userData = [  // ❌ New array reference on every render
  { id: 1, name: "John Doe", ... },
  // ...
];
```

**Problem 2: Columns recreated on every render**

```typescript
columns: UserColumn(),  // ❌ New array reference on every render
```

**Why this causes the hang:**

1. Every component re-render creates NEW array references for `data` and `columns`
2. TanStack Table sees these as "new" props (different references)
3. Table re-initializes or re-processes everything
4. When Select dropdown opens → triggers re-render → new data/columns → table re-processes → expensive operations run → hang

**This is why it worked in your other projects** - you likely had:

- Data memoized with `useMemo`
- Columns defined outside the component or memoized
- Stable references that don't change on every render

#### 1. **Expensive Table Operations Called on Every Render** (Secondary Issue - Amplified by #0)

In `src/components/common/table/table-data-pagination.tsx`:

**Lines 39-45**: Multiple expensive operations called repeatedly:

- `table.getFilteredSelectedRowModel().rows.length` - Called **TWICE** (lines 39, 41)
- `table.getFilteredRowModel().rows.length` - Called **TWICE** (lines 42, 45)

These methods:

- Iterate through ALL rows in the dataset
- Apply filters, sorting, and selection logic
- Are O(n) operations where n = total number of rows
- With large datasets (100+ rows), this becomes very expensive

**Lines 52, 58, 70**: State access on every render:

- `table.getState().pagination.pageSize` - Called **TWICE** (lines 52, 58)
- `table.getState().pagination.pageIndex` - Called once (line 70)
- `table.getPageCount()` - Called once (line 71)

#### 2. **Select Component Triggers Multiple Re-renders**

When Radix UI's Select dropdown opens:

- It triggers re-renders to measure and position the dropdown
- The `value` prop on line 52 creates a new string on every render: `` value={`${table.getState().pagination.pageSize}`} ``
- The `placeholder` prop on line 58 also accesses state on every render
- Each re-render executes all the expensive table operations above

#### 3. **Cascading Performance Issue**

The combination creates a performance death spiral:

1. User clicks to open Select dropdown
2. Select triggers re-render for positioning
3. Component re-renders and calls expensive table methods (4+ times)
4. With large datasets, this takes significant time
5. Select might trigger another re-render during this time
6. Page becomes unresponsive

#### 4. **Additional Issue in data-table.tsx**

**Line 109**: `table.getFilteredSelectedRowModel().rows.length` is also called on every render without memoization.

### Evidence

From the code analysis:

- No memoization (`useMemo`, `useCallback`) in the pagination component
- No React hooks to optimize expensive calculations
- Direct state access in render without caching
- Multiple duplicate calls to the same expensive methods

### Impact

- **Small datasets (< 50 rows)**: May work but with noticeable lag
- **Medium datasets (50-200 rows)**: Significant lag when opening dropdown
- **Large datasets (200+ rows)**: Page hangs/freezes when opening dropdown

### Solution Strategy

1. **Memoize expensive calculations** using `React.useMemo`
2. **Cache state values** to avoid repeated `getState()` calls
3. **Use stable references** for Select value prop
4. **Optimize data-table.tsx** as well

### Files Affected

1. **`src/pages/user.tsx`** - ⚠️ **CRITICAL**: Data and columns not memoized
2. **`src/pages/bots/tb-vs-gl.tsx`** - ⚠️ **CRITICAL**: Data and columns not memoized + duplicate IDs
3. `src/components/common/table/table-data-pagination.tsx` - Expensive operations not memoized
4. `src/components/common/table/data-table.tsx` - Expensive operation not memoized (line 109)

### Additional Issues Found

#### Duplicate IDs in tb-vs-gl.tsx

The `userData` array has duplicate IDs (id: 1, 2, 3, 4 repeated 3 times). This can cause:

- React key conflicts
- Table row identification issues
- Potential rendering bugs

### Solution Priority

1. **FIRST**: Memoize `userData` and `columns` in both page components
2. **SECOND**: Fix duplicate IDs in tb-vs-gl.tsx
3. **THIRD**: Optimize pagination component (already identified)
4. **FOURTH**: Optimize data-table.tsx (already identified)
