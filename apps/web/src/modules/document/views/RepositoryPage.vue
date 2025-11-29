<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">知识仓库</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showEditor = true">新建文档</v-btn>
    </div>

    <v-card class="mb-4">
      <v-card-text>
        <v-text-field
          v-model="folderPath"
          label="文件夹筛选"
          prepend-icon="mdi-folder"
          clearable
          @update:model-value="handleFilter"
        />
      </v-card-text>
    </v-card>

    <DocumentList
      :documents="documents"
      :loading="loading"
      :pagination="pagination"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
    />

    <v-dialog v-model="showEditor" max-width="800">
      <DocumentEditor :document="editingDocument" :loading="loading" @save="handleSave" @cancel="closeEditor" />
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDocument } from '../composables/useDocument';
import DocumentList from '../components/DocumentList.vue';
import DocumentEditor from '../components/DocumentEditor.vue';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';


const { documents, loading, pagination, loadDocuments, createDocument, updateDocument, deleteDocument } = useDocument();

const showEditor = ref(false);
const editingDocument = ref<DocumentClientDTO | undefined>(undefined);
const folderPath = ref('');
const snackbar = ref({ show: false, message: '', color: 'success' });

onMounted(() => loadDocuments());

const handleFilter = () => loadDocuments({ folderPath: folderPath.value || undefined });
const handlePageChange = (page: number) => loadDocuments({ page, folderPath: folderPath.value || undefined });

const handleEdit = (document: DocumentClientDTO) => {
  editingDocument.value = document;
  showEditor.value = true;
};

const handleSave = async (data: any) => {
  try {
    if (editingDocument.value) {
      await updateDocument(editingDocument.value.uuid, data);
      snackbar.value = { show: true, message: '文档更新成功', color: 'success' };
    } else {
      await createDocument(data);
      snackbar.value = { show: true, message: '文档创建成功', color: 'success' };
    }
    closeEditor();
  } catch (error) {
    snackbar.value = { show: true, message: '操作失败', color: 'error' };
  }
};

const handleDelete = async (document: DocumentClientDTO) => {
  if (confirm(`确定要删除文档"${document.title}"吗？`)) {
    try {
      await deleteDocument(document.uuid);
      snackbar.value = { show: true, message: '文档删除成功', color: 'success' };
    } catch (error) {
      snackbar.value = { show: true, message: '删除失败', color: 'error' };
    }
  }
};

const closeEditor = () => {
  showEditor.value = false;
  editingDocument.value = undefined;
};
</script>

