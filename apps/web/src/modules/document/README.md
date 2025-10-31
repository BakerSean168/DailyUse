# Document Module - Version Management

## 📦 Structure (DDD Architecture)

```
document/
├── infrastructure/
│   └── api/
│       └── DocumentVersionApiClient.ts      # HTTP client for version APIs
├── presentation/
│   ├── composables/
│   │   └── useDocumentVersion.ts           # Version state management
│   ├── components/
│   │   ├── VersionHistoryList.vue          # Version history list UI
│   │   └── VersionDiffViewer.vue           # Git-style diff viewer
│   └── views/
│       └── DocumentDetailWithVersions.vue  # Integration example
```

## 🚀 Quick Start

### 1. Use the Composable

```vue
<script setup lang="ts">
import { useDocumentVersion } from './presentation/composables/useDocumentVersion';

const documentUuid = 'your-document-uuid';
const {
  // State
  versions,
  loading,
  comparison,
  hasVersions,
  hasMorePages,
  
  // Methods
  loadVersions,
  loadMore,
  compareVersions,
  restoreToVersion,
  refresh,
} = useDocumentVersion(documentUuid);

// Load versions on mount
onMounted(() => {
  loadVersions();
});
</script>
```

### 2. Use the Components

```vue
<template>
  <!-- Version History List -->
  <VersionHistoryList
    :versions="versions"
    :total-versions="totalVersions"
    :loading="loading"
    :has-versions="hasVersions"
    :has-more-pages="hasMorePages"
    @select-version="handleSelectVersion"
    @compare="handleCompareVersion"
    @restore="handleRestoreVersion"
    @load-more="loadMore"
    @refresh="refresh"
  />

  <!-- Version Diff Viewer (in dialog) -->
  <v-dialog v-model="showDiff">
    <VersionDiffViewer
      v-if="comparison"
      :comparison="comparison"
      @close="showDiff = false"
    />
  </v-dialog>
</template>
```

### 3. Integration Example

See `DocumentDetailWithVersions.vue` for a complete integration example showing:
- Document content display with version info
- Collapsible version history panel
- Version comparison dialog
- Version restore confirmation

## 🎨 Features

### Version History List
- ✅ Paginated version list with load more
- ✅ Change type badges (INITIAL/MAJOR/MINOR/PATCH/RESTORE)
- ✅ Relative timestamps (e.g., "2 小时前")
- ✅ Action menu (Compare, Restore)
- ✅ Empty state & loading indicators
- ✅ Refresh button

### Version Diff Viewer
- ✅ Side-by-side version comparison header
- ✅ Summary statistics (added/removed/unchanged lines)
- ✅ Git-style diff with color-coded lines
  - 🟢 Green: Added lines
  - 🔴 Red: Removed lines
  - 🔵 Blue: Diff headers
  - ⚪ White: Unchanged lines
- ✅ Scrollable content area

### Composable API
- ✅ Reactive state management
- ✅ Automatic pagination
- ✅ Error handling
- ✅ Loading states
- ✅ Version comparison
- ✅ Version restoration

## 🔌 API Client

### Methods

```typescript
// Get version history (paginated)
await documentVersionApi.getVersionHistory(documentUuid, { page: 1, pageSize: 20 });

// Get specific version by UUID
await documentVersionApi.getVersionByUuid(documentUuid, versionUuid);

// Get version snapshot by number
await documentVersionApi.getVersionSnapshot(documentUuid, versionNumber);

// Compare two versions
await documentVersionApi.compareVersions(documentUuid, fromVersion, toVersion);

// Restore to specific version
await documentVersionApi.restoreVersion(documentUuid, versionNumber);
```

## 🎯 Change Type Detection

The backend automatically detects change types:

| Type | Condition | Badge Color |
|------|-----------|-------------|
| **INITIAL** | First version | Blue (primary) |
| **MAJOR** | Title change OR >50% content change | Red (error) |
| **MINOR** | 10-50% content change | Orange (warning) |
| **PATCH** | <10% content change | Light Blue (info) |
| **RESTORE** | Restored from previous version | Green (success) |

## 📝 Usage Notes

1. **Auto-versioning**: Versions are automatically created when documents are created or updated
2. **Non-destructive restore**: Restoring creates a new version (type: RESTORE), doesn't delete current
3. **Pagination**: Version history supports pagination (default 20 per page)
4. **Diff algorithm**: Uses `diff-match-patch` for Git-style diffs

## 🔗 Related Backend APIs

```
GET    /documents/:uuid/versions                     # List versions
GET    /documents/:uuid/versions/:versionUuid        # Get version details
GET    /documents/:uuid/versions/number/:number      # Get version snapshot
GET    /documents/:uuid/versions/compare?from=1&to=5 # Compare versions
POST   /documents/:uuid/versions/restore             # Restore version
```

## 📚 Type Definitions

See `@dailyuse/contracts` package:
- `DocumentVersionClientDTO`
- `VersionHistoryResponseDTO`
- `VersionComparisonDTO`
- `RestoreVersionRequestDTO`

## 🐛 Troubleshooting

### Issue: "No versions found"
- Ensure the document exists and has been created/updated at least once
- Check if auto-versioning is enabled in backend

### Issue: "Comparison failed"
- Verify both version numbers exist
- Check if user has permission to access the document

### Issue: "Restore failed"
- Ensure the target version number exists
- Check if user has write permission on the document

## 🚀 Future Enhancements

- [ ] Version tags/labels
- [ ] Version annotations
- [ ] Branch and merge support
- [ ] Incremental/delta storage
- [ ] Version approval workflow
- [ ] Advanced diff options (word-level, character-level)
- [ ] Version export (PDF, Markdown)
