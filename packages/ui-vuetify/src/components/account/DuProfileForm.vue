<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit" :loading="loading">
    <v-container>
      <!-- 错误提示 -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="$emit('clear-error')"
      >
        {{ error }}
      </v-alert>

      <!-- 成功提示 -->
      <v-alert
        v-if="success"
        type="success"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="$emit('clear-success')"
      >
        {{ success }}
      </v-alert>

      <!-- 头像部分 -->
      <v-row>
        <v-col cols="12" class="text-center">
          <DuAvatar
            :src="profileData.avatar"
            :username="profileData.username"
            :status="userStatus"
            :editable="true"
            size="96"
            @edit="handleAvatarEdit"
          />
          <div class="text-body-2 text-medium-emphasis mt-2">点击头像更换</div>
        </v-col>
      </v-row>

      <!-- 基本信息 -->
      <v-row>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.username"
            label="用户名"
            :rules="usernameRules"
            prepend-inner-icon="mdi-account"
            readonly
          >
            <template #append-inner>
              <v-tooltip text="用户名不可修改">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="small">mdi-information-outline</v-icon>
                </template>
              </v-tooltip>
            </template>
          </DuTextField>
        </v-col>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.displayName"
            label="显示名称"
            prepend-inner-icon="mdi-badge-account-horizontal"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 个人姓名 -->
      <v-row>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.firstName"
            label="姓"
            prepend-inner-icon="mdi-account-outline"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.lastName"
            label="名"
            prepend-inner-icon="mdi-account-outline"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 联系信息 -->
      <v-row>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.email"
            label="邮箱地址"
            type="email"
            :rules="emailRules"
            prepend-inner-icon="mdi-email"
          />
        </v-col>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="profileData.phoneNumber"
            label="手机号码"
            type="tel"
            :rules="phoneRules"
            prepend-inner-icon="mdi-phone"
            placeholder="+86 13800138000"
          />
        </v-col>
      </v-row>

      <!-- 个人信息 -->
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="profileData.sex"
            label="性别"
            :items="sexOptions"
            prepend-inner-icon="mdi-gender-male-female"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="profileData.birthday"
            label="生日"
            type="date"
            prepend-inner-icon="mdi-calendar"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 个人简介 -->
      <v-row>
        <v-col cols="12">
          <v-textarea
            v-model="profileData.bio"
            label="个人简介"
            prepend-inner-icon="mdi-account-details"
            density="comfortable"
            rows="4"
            :counter="500"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 状态设置 -->
      <v-row>
        <v-col cols="12">
          <v-select
            v-model="profileData.status"
            label="状态"
            :items="statusOptions"
            prepend-inner-icon="mdi-account-circle"
            clearable
          >
            <template #selection="{ item }">
              <v-chip :color="item.raw.color" size="small" class="mr-2">
                {{ item.raw.text }}
              </v-chip>
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-chip :color="item.raw.color" size="small">
                    {{ item.raw.text }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <!-- 按钮 -->
      <v-row class="mt-4">
        <v-col cols="6">
          <v-btn variant="outlined" @click="handleReset" :disabled="loading" size="large" block>
            重置
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn color="primary" type="submit" :loading="loading" size="large" block>
            <v-icon start>mdi-content-save</v-icon>
            保存
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- 头像上传对话框 -->
    <DuDialog
      v-model="showAvatarDialog"
      title="更换头像"
      title-icon="mdi-account-circle"
      max-width="400px"
    >
      <v-file-input
        v-model="avatarFile"
        label="选择头像文件"
        accept="image/*"
        prepend-icon="mdi-camera"
        clearable
        show-size
      />

      <template #actions>
        <v-btn @click="showAvatarDialog = false">取消</v-btn>
        <v-btn color="primary" :disabled="!avatarFile" @click="handleAvatarUpload"> 上传 </v-btn>
      </template>
    </DuDialog>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useFormRules } from '../../composables/useFormValidation';
import type { UserBasicInfo, SexOption } from '../../types';
import DuTextField from '../form/DuTextField.vue';
import DuDialog from '../dialog/DuDialog.vue';
import DuAvatar from './DuAvatar.vue';

interface UserProfile extends UserBasicInfo {
  username: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
}

interface StatusOption {
  text: string;
  value: string;
  color: string;
}

interface Props {
  loading?: boolean;
  error?: string;
  success?: string;
  userData: UserProfile;
}

interface Emits {
  (e: 'submit', data: UserProfile): void;
  (e: 'reset'): void;
  (e: 'avatar-upload', file: File): void;
  (e: 'clear-error'): void;
  (e: 'clear-success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 表单引用和状态
const formRef = ref<InstanceType<typeof HTMLFormElement>>();
const showAvatarDialog = ref(false);
const avatarFile = ref<File[]>([]);

// 表单数据
const profileData = reactive<UserProfile>({
  ...props.userData,
  displayName: props.userData.displayName || '',
  firstName: props.userData.firstName || '',
  lastName: props.userData.lastName || '',
  email: props.userData.email || '',
  phoneNumber: props.userData.phoneNumber || '',
  avatar: props.userData.avatar || '',
  bio: props.userData.bio || '',
  sex: props.userData.sex || '',
  birthday: props.userData.birthday || '',
  status: props.userData.status || '',
} as UserProfile);

// 表单验证规则
const { usernameRules, emailRules, phoneRules } = useFormRules();

// 性别选项
const sexOptions: SexOption[] = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '其他', value: 'other' },
];

// 状态选项
const statusOptions: StatusOption[] = [
  { text: '在线', value: 'online', color: 'success' },
  { text: '忙碌', value: 'busy', color: 'warning' },
  { text: '离开', value: 'away', color: 'orange' },
  { text: '隐身', value: 'invisible', color: 'grey' },
];

// 当前用户状态
const userStatus = computed(() => {
  const status = statusOptions.find((s) => s.value === profileData.status);
  return (status?.value as 'online' | 'busy' | 'away' | 'offline') || 'offline';
});

// 处理头像编辑
const handleAvatarEdit = () => {
  showAvatarDialog.value = true;
};

// 处理头像上传
const handleAvatarUpload = () => {
  if (avatarFile.value.length > 0) {
    emit('avatar-upload', avatarFile.value[0]);
    showAvatarDialog.value = false;
    avatarFile.value = [];
  }
};

// 处理表单提交
const handleSubmit = () => {
  emit('submit', { ...profileData });
};

// 处理表单重置
const handleReset = () => {
  Object.assign(profileData, props.userData);
  formRef.value?.resetValidation();
  emit('reset');
};
</script>

<style scoped>
.v-chip {
  font-size: 0.75rem;
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
