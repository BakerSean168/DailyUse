<template>
  <v-dialog v-model="visible" max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">分组编辑</span>
      </v-card-title>
      <v-card-text>
        <v-alert type="info">
          分组创建/编辑功能开发中...
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);

const open = () => {
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

defineExpose({
  open,
  close,
});
</script>
