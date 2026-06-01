# Testing CSV Upload and Drag-and-Drop

## What Was Fixed

1. **Removed broken/orphaned code** that was interfering with CSV processing
2. **Completely rewrote `processMultipleCSVFiles()` function** to:
   - Properly accumulate rows from all files
   - Wait for ALL files to finish reading before rendering
   - Correctly clear and populate the data arrays
   - Add comprehensive logging at each step

3. **Enhanced drag-and-drop handlers** with:
   - Better event handling
   - Console logging for debugging
   - Null checks for safety

4. **Improved logging** to help debug any remaining issues

## How to Test

### Test 1: File Selection (Recommended First)

1. Open Chrome to `http://localhost:8000`
2. Open **Developer Console** (F12)
3. In the **Male Moth** section, click "📁 Upload CSV File(s):"
4. Navigate to this project folder and select `test_male.csv`
5. Click "Open"

**Expected Results:**
- Console should show: `✓ Page loaded - initializing...`
- Console should show: `[PROCESS] Processing 1 file(s) for male table`
- Console should show: `[PROCESS] File 1/1 loaded: test_male.csv`
- Console should show: `[PROCESS] File 1 complete: added 2 rows`
- Console should show: `[PROCESS] All files processed. Adding 2 rows to male table`
- A dialog should appear: "✅ Loaded 1 file(s) ✓ Added 2 row(s) ✓ Total: 2 rows"
- **Most importantly: Two rows should appear in the Male table with "Specimen1" and "Specimen2" in the first column**
- All data cells should have values (numbers from the CSV)

### Test 2: Drag and Drop

1. In the **Male Moth** section, find the "📂 Drag and drop CSV file here" zone
2. Open your file manager to this project folder
3. Drag `test_male.csv` onto the drop zone
4. Check console and verify same results as Test 1

**Expected Results:**
- Console should show: `[DRAG] dragover event` (as you hover)
- Console should show: `[DRAG] Adding drag-over class` (zone highlights)
- Console should show: `[DRAG] drop event triggered`
- Then same process messages as Test 1
- Dialog appears
- Two rows visible with data

### Test 3: Multiple Files

1. Create a copy of test_male.csv (e.g., test_male_2.csv)
2. Select both files using Shift+Click
3. Click "Open"

**Expected Results:**
- Console shows: `[PROCESS] Processing 2 file(s) for male table`
- Alert shows: "✅ Loaded 2 file(s) ✓ Added 4 row(s) ✓ Total: 4 rows"
- 4 rows visible in table (2 from each file)

## If It's Still Not Working

### Check Console for These Messages:

1. **On Page Load:**
   ```
   ✓ Page loaded - initializing...
   ✓ maleData array exists: true
   ✓ femaleData array exists: true
   ✓ columns defined: 31 columns
   ```
   If these don't appear, there's a JavaScript error on page load.

2. **After Selecting a File:**
   ```
   [PROCESS] Processing 1 file(s) for male table
   [PROCESS] Starting to read file 1/1: test_male.csv
   [PROCESS] File 1/1 loaded: test_male.csv
   [PROCESS] Parsed 3 total rows from test_male.csv  (header + 2 data rows)
   [PROCESS] File 1 complete: added 2 rows
   ```
   If you don't see these, the file input handler isn't being called.

3. **After All Files Processed:**
   ```
   [PROCESS] All files processed. Adding 2 rows to male table
   [PROCESS] Complete! Table now has 2 rows
   ```
   If these don't appear, files are taking too long to read.

### Troubleshooting:

**Issue:** Console shows `[PROCESS]` messages but no data appears in table
- **Fix:** Check that `renderMaleTable()` function exists and is working
- **Check:** Open browser DevTools Elements tab and verify rows appear in HTML

**Issue:** File selection works but drag-drop doesn't
- **Fix:** Make sure you're dragging CSV files from Finder, not from Chrome
- **Check:** Console should show `[DRAG] dragover event` when hovering

**Issue:** Console shows error in parseCSV or isHeaderRow
- **Fix:** Verify test_male.csv is a valid CSV file
- **Check:** Open it in a text editor to ensure it has proper comma-separated values

## Test Files Provided

- `test_male.csv` - Contains 2 male specimens with all 31 columns
- `test_female.csv` - Contains 2 female specimens with all 31 columns

Both files have a header row and proper data values for testing.
