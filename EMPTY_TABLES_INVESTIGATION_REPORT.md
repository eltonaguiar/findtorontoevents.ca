# Empty Tables Investigation Report

## Critical Issues Found

### 1. **favcreatorslogs** - WRITE OPERATION MISSING ❌

**Problem**: The table exists and has a read API (`get_logs.php`), but **NO CODE WRITES TO IT**.

**Evidence**:
- `get_logs.php` - SELECT queries exist (reads logs)
- `db_schema.php` - Table schema defined
- **NO INSERT statements found anywhere in the codebase**

**Code References**:
```php
// get_logs.php - ONLY READS
$query = "SELECT * FROM favcreatorslogs $where_clause ORDER BY created_at DESC LIMIT $limit OFFSET $offset";

// db_schema.php - Table defined but never written to
'favcreatorslogs' => "CREATE TABLE IF NOT EXISTS favcreatorslogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ...
)"
```

**Root Cause**: Logging was likely planned but the write functionality was never implemented.

---

### 2. **streamer_last_seen / streamer_check_log** - GITHUB ACTIONS NOT POPULATING ❌

**Problem**: Tables have full CRUD implementation but are empty.

**Code References Found**:
- `update_streamer_last_seen.php` - INSERT/UPDATE operations ✅
- `batch_update_streamer_last_seen.php` - Batch INSERT operations ✅
- `get_streamer_last_seen.php` - SELECT operations ✅
- `cleanup_streamer_last_seen.php` - DELETE operations ✅
- GitHub Actions workflow configured ✅

**GitHub Actions Setup**:
```yaml
# .github/workflows/check-streamer-status.yml
schedule:
  - cron: '*/5 * * * *'  # Runs every 5 minutes
```

**Python Script**:
```python
# .github/scripts/check_streamer_status.py
def update_last_seen(streamer, status):
    url = f"{API_BASE}/api/update_streamer_last_seen.php"
    payload = {
        "creator_id": streamer["creator_id"],
        "creator_name": streamer["creator_name"],
        ...
    }
    result = _http_post_json(url, payload)
```

**Root Cause Analysis**:
The workflow is configured to run every 5 minutes, but the tables are empty. Possible causes:
1. **GitHub Actions workflow is disabled** (check repository settings)
2. **API authentication failing** (the endpoint requires specific auth)
3. **Workflow runs but API returns errors** (check Actions logs)
4. **Workflow was recently added** and hasn't run yet

---

### 3. **user_link_lists** - FEATURE EXISTS BUT UNUSED ⚠️

**Problem**: Table has auto_increment=2 indicating a failed write attempt, but no data.

**Code References**:
- `save_link_list.php` - Full INSERT/UPDATE implementation ✅
- `get_link_lists.php` - Full SELECT implementation ✅
- `delete_link_list.php` - Full DELETE implementation ✅

**Evidence of Failed Write**:
```sql
-- SQL export shows:
AUTO_INCREMENT=2  -- Means an INSERT was attempted but rolled back or failed
-- But no actual data rows exist
```

**Root Cause**: The API endpoints exist but the frontend may not be calling them, or there was a database error during an early write attempt.

---

### 4. **user_content_preferences** - COMPLETELY UNUSED ⚠️

**Problem**: Table exists in schema but has NO API endpoints.

**Evidence**:
- `db_schema.php` - Table defined
- **NO PHP files reference this table for read or write**
- Truly orphaned table

---

### 5. **streamer_content** - SCHEMA ONLY ⚠️

**Problem**: Table defined in schema but not actively used.

**Evidence**:
```php
// streamer_last_seen_schema.php defines it
'streamer_content' => "CREATE TABLE IF NOT EXISTS streamer_content (...)"
```
- No INSERT operations found
- No API endpoints reference it
- Likely a planned feature for content caching that was never implemented

---

## Detailed Code Analysis

### Write Operations by Table

| Table | INSERT Operations | UPDATE Operations | DELETE Operations | Status |
|-------|------------------|-------------------|-------------------|--------|
| `streamer_last_seen` | ✅ `update_streamer_last_seen.php`<br>✅ `batch_update_streamer_last_seen.php` | ✅ `update_streamer_last_seen.php` | ✅ `cleanup_streamer_last_seen.php` | Configured but empty |
| `streamer_check_log` | ✅ `update_streamer_last_seen.php`<br>✅ `batch_update_streamer_last_seen.php` | ❌ None | ✅ `cleanup_streamer_last_seen.php` | Configured but empty |
| `favcreatorslogs` | ❌ **NONE FOUND** | ❌ None | ❌ None | **BROKEN** |
| `user_link_lists` | ✅ `save_link_list.php` | ✅ `save_link_list.php` | ✅ `delete_link_list.php` | Feature exists but unused |
| `user_content_preferences` | ❌ None | ❌ None | ❌ None | Orphaned table |
| `streamer_content` | ❌ None | ❌ None | ❌ None | Schema only |

---

## Specific Issues and Fixes

### Issue 1: favcreatorslogs - Missing Write Implementation

**Files that SHOULD write to this table** (but don't):
- `login.php` - Should log login attempts
- `save_creators.php` - Should log creator saves
- `save_note.php` - Should log note updates
- `update_streamer_last_seen.php` - Already has logging code but writes to different table

**Missing Implementation**:
```php
// This code pattern should exist but doesn't:
$log_sql = "INSERT INTO favcreatorslogs 
    (action, endpoint, user_id, user_email, status, message) 
    VALUES (?, ?, ?, ?, ?, ?)";
```

---

### Issue 2: Streamer Tables - GitHub Actions Debug

**To diagnose why tables are empty**:

1. **Check GitHub Actions Status**:
   ```bash
   # Check if workflow is enabled in repo settings
   # Look for failed runs in Actions tab
   ```

2. **Check API Accessibility**:
   The Python script calls:
   ```python
   url = f"{API_BASE}/api/update_streamer_last_seen.php"
   ```
   But the API may be returning 403 (requires authentication).

3. **Check Workflow Logs**:
   - Look for `streamer_check_log.txt` artifact
   - Check for API error responses

---

### Issue 3: user_link_lists - auto_increment=2 Mystery

**SQL Export Evidence**:
```sql
CREATE TABLE `user_link_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  ...
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
```

**Analysis**:
- `AUTO_INCREMENT=2` means an INSERT was attempted and got ID 1
- But no row with ID 1 exists in the data
- This indicates a **failed INSERT that was rolled back** or **deleted**

---

## Recommendations

### Immediate Actions (Critical)

1. **Fix favcreatorslogs**:
   - Either implement the INSERT operations in relevant APIs
   - OR drop the table if logging isn't needed
   - OR document that it's intentionally unused

2. **Debug GitHub Actions**:
   ```bash
   # Check the workflow run history
   # Download the artifact from the latest run
   # Check if API calls are succeeding
   ```

3. **Test Streamer API**:
   ```bash
   curl -X POST https://findtorontoevents.ca/fc/api/update_streamer_last_seen.php \
     -H "Content-Type: application/json" \
     -d '{"creator_id":"test","creator_name":"Test","platform":"tiktok","username":"test","is_live":false,"checked_by":"test"}'
   ```

### Optional Cleanup (Low Priority)

4. **Drop Unused Tables**:
   - `user_content_preferences` - No code references
   - `streamer_content` - Schema only, no implementation

5. **Investigate user_link_lists**:
   - Check if frontend has a "save link list" feature
   - If not, consider removing the API endpoints and table

---

## Summary Table

| Table | Has Read API | Has Write API | Has Data | Issue | Priority |
|-------|-------------|---------------|----------|-------|----------|
| `streamer_last_seen` | ✅ | ✅ | ❌ | GitHub Actions not populating | High |
| `streamer_check_log` | ✅ | ✅ | ❌ | GitHub Actions not populating | High |
| `favcreatorslogs` | ✅ | ❌ | ❌ | **NO WRITE IMPLEMENTATION** | **Critical** |
| `user_link_lists` | ✅ | ✅ | ❌ | Feature unused | Low |
| `user_content_preferences` | ❌ | ❌ | ❌ | Orphaned table | Low |
| `streamer_content` | ❌ | ❌ | ❌ | Schema only | Low |

---

## Action Items

1. [ ] Check GitHub Actions workflow runs for `check-streamer-status.yml`
2. [ ] Verify `update_streamer_last_seen.php` endpoint is accessible from GitHub Actions
3. [ ] Implement INSERT for `favcreatorslogs` OR remove the table
4. [ ] Investigate `user_link_lists` auto_increment=2 issue
5. [ ] Document unused tables or remove them