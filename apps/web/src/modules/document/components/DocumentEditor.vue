<template>
  <v-card>
    <v-card-title>{{ isEdit ? '编辑文档' : '创建文档' }}</v-card-title>
    
    <v-card-text>
      <v-form ref="formRef">
        <v-text-field
          v-model="formData.title"
          label="标题"
          :rules="[(v) => !!v || '标题不能为空']"
          required
        />

        <v-text-field
          v-model="formData.folderPath"
          label="文件夹路径"
          placeholder="/personal/notes"
          :rules="[(v) => !!v || '路径不能为空', (v) => v.startsWith('/') || '路径必须以 / 开头']"
          required
        />

        <v-textarea
          v-model="formData.content"
          label="内容 (Markdown)"
          rows="15"
          auto-grow
        />

        <v-combobox
          v-model="formData.tags"
          label="标签"
          chips
          multiple
          closable-chips
        />
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn @click="$emit('cancel')">取消</v-btn>
      <v-btn color="primary" @click="handleSave" :loading="loading">保存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { DocumentContracts } from '@dailyuse/contracts';

type DocumentClientDTO = DocumentContracts.DocumentClientDTO;

interface Props {
  document?: DocumentClientDTO;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  save: [data: { title: string; content: string; folderPath: string; tags: string[] }];
  cancel: [];
}>();

const formRef = ref();
const formData = ref({
  title: '',
  content: '',
  folderPath: '/',
  tags: [] as string[],
});

const isEdit = ref(false);

watch(() => props.document, (doc) => {
  if (doc) {
    isEdit.value = true;
    formData.value = {
      title: doc.title,
      content: doc.content,
      folderPath: doc.folderPath,
      tags: [...doc.tags],
    };
  } else {
    isEdit.value = false;
    formData.value = {
      title: '',
      content: '',
      folderPath: '/',
      tags: [],
    };
  }
}, { immediate: true });

const handleSave = async () => {
  const { valid } = await formRef.value.validate();
  if (valid) {
    emit('save', formData.value);
  }
};
</script>
