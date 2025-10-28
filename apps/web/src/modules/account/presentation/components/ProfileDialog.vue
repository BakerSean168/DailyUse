<template>
  <v-dialog :model-value="modelValue" width="500">
    <v-card class="pa-4">
      <v-card-title class="text-h5 text-center">用户信息</v-card-title>
      <v-card-text> </v-card-text>
      <v-form ref="formRef">
        <v-list>
          <v-list-item class="text-center">
            <v-avatar size="96" class="mb-4" color="primary">
              <template v-if="formData.avatar">
                <img :src="formData.avatar" alt="用户头像" />
              </template>
              <template v-else>
                <span class="default-avatar-text">
                  {{ '?' }}
                </span>
              </template>
            </v-avatar>
          </v-list-item>
          <v-list-item>
            <v-textarea
              v-model="formData.bio"
              label="个人简介"
              clearable
              prepend-inner-icon="mdi-account-details"
              density="comfortable"
            />
          </v-list-item>

          <v-list-item>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.displayName"
                  label="显示名称"
                  clearable
                  prepend-inner-icon="mdi-account"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formData.gender"
                  :items="sexOptions"
                  item-title="text"
                  item-value="value"
                  label="性别"
                  clearable
                  prepend-inner-icon="mdi-gender-male-female"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.location"
                  label="位置"
                  clearable
                  prepend-inner-icon="mdi-map-marker"
                  density="comfortable"
                />
              </v-col>
            </v-row>
          </v-list-item>
        </v-list>
      </v-form>

      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="handleSaveProfile">保存</v-btn>
        <v-btn text @click="$emit('update:modelValue', false)">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';

import type { AccountContracts } from '@dailyuse/contracts';
import { Gender } from '@dailyuse/contracts';

type ProfileData = {
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: number;
  gender?: Gender;
};

const props = defineProps<{
  modelValue: boolean;
  account: AccountContracts.AccountDTO | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'handle-update-profile', formData: AccountContracts.UpdateAccountProfileRequestDTO): void;
}>();

const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);

const isFormValid = computed(() => {
  if (!formRef.value) return false;
  return formRef.value.checkValidity();
});

const formData = reactive<ProfileData>({
  displayName: '',
  avatar: undefined,
  bio: undefined,
  location: undefined,
  dateOfBirth: undefined,
  gender: undefined,
});

const sexOptions = [
  { text: '男', value: Gender.MALE },
  { text: '女', value: Gender.FEMALE },
  { text: '其他', value: Gender.OTHER },
  { text: '不透露', value: Gender.PREFER_NOT_TO_SAY },
];

const handleSaveProfile = () => {
  if (isFormValid.value) {
    if (formData) {
      emit('handle-update-profile', formData);
    }
    closeDialog();
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
};

// const formattedBirthday = computed(() => {
//     if (!userBasicInfo.birthday) return '';
//     const date = new Date(userBasicInfo.birthday);
//     console.log('formatter值变化', formattedBirthday.value);
//     return date.toLocaleDateString('zh-CN', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//     });
// });
// function onDateSelected(val: string) {
//     userBasicInfo.birthday = val;
//     dateMenu.value = false;
// }
// watch(() => userBasicInfo.birthday, (newVal) => {
//     if (newVal) {
//         console.log('生日变化:', newVal);
//         const date = new Date(newVal);
//         userBasicInfo.birthday = date.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
//     }
// });

watch([() => props.account, () => props.modelValue], ([account, modelValue]) => {
  if (modelValue && account) {
    Object.assign(formData, {
      displayName: account.profile?.displayName ?? '',
      avatar: account.profile?.avatar ?? undefined,
      bio: account.profile?.bio ?? undefined,
      location: account.profile?.location ?? undefined,
      dateOfBirth: account.profile?.dateOfBirth ?? undefined,
      gender: account.profile?.gender ?? undefined,
    });
  }
});
</script>
