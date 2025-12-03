<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :label="label"
    :type="computedType"
    :rules="rules"
    :counter="showCounter ? maxLength : false"
    :prepend-inner-icon="prependIcon"
    :append-inner-icon="computedAppendIcon"
    @click:append-inner="handleAppendClick"
    :clearable="clearable"
    :required="required"
    :disabled="disabled"
    :readonly="readonly"
    :loading="loading"
    :density="density"
    :variant="variant"
    :color="color"
    :placeholder="placeholder"
    :hint="hint"
    :persistent-hint="persistentHint"
    :error-messages="errorMessages"
    :class="inputClass"
  >
    <!-- 密码强度指示器或自定义详情内容 -->
    <template v-slot:details>
      <div v-if="showPasswordStrength && type === 'password' && modelValue" class="mt-2">
        <div class="text-caption mb-1">密码强度:</div>
        <v-progress-linear
          :model-value="passwordStrength.score * 25"
          :color="passwordStrength.color"
          height="4"
          rounded
        />
        <div class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
          {{ passwordStrength.text }}
        </div>
      </div>
      <slot v-else name="details" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePasswordStrength } from '../../composables/usePasswordStrength';
import type { FormRule } from '../../types';

interface Props {
  modelValue: string | undefined;
  label?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'search';
  rules?: FormRule[];
  maxLength?: number;
  showCounter?: boolean;
  prependIcon?: string;
  appendIcon?: string;
  clearable?: boolean;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  density?: 'default' | 'comfortable' | 'compact';
  variant?:
    | 'filled'
    | 'outlined'
    | 'plain'
    | 'underlined'
    | 'solo'
    | 'solo-inverted'
    | 'solo-filled';
  color?: string;
  placeholder?: string;
  hint?: string;
  persistentHint?: boolean;
  errorMessages?: string | string[];
  inputClass?: string;

  // 密码相关
  showPasswordStrength?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'append-click'): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  showCounter: false,
  clearable: true,
  required: false,
  disabled: false,
  readonly: false,
  loading: false,
  density: 'comfortable',
  variant: 'outlined',
  persistentHint: false,
  showPasswordStrength: false,
});

const emit = defineEmits<Emits>();

// 密码显示控制
const showPassword = ref(false);

// 计算属性：输入框类型
const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

// 计算属性：后缀图标
const computedAppendIcon = computed(() => {
  if (props.appendIcon) return props.appendIcon;
  if (props.type === 'password') {
    return showPassword.value ? 'mdi-eye' : 'mdi-eye-off';
  }
  return undefined;
});

// 密码强度
const passwordValue = computed(() => props.modelValue || '');
const passwordStrengthData = computed(() => {
  if (props.type === 'password' && props.showPasswordStrength) {
    return usePasswordStrength(passwordValue);
  }
  return null;
});

const passwordStrength = computed(() => {
  if (passwordStrengthData.value) {
    return {
      score: passwordStrengthData.value.score.value,
      text: passwordStrengthData.value.text.value,
      color: passwordStrengthData.value.color.value,
      percentage: passwordStrengthData.value.percentage.value,
    };
  }
  return { score: 0, text: '', color: 'grey', percentage: 0 };
});

// 后缀图标点击处理
const handleAppendClick = () => {
  if (props.type === 'password') {
    showPassword.value = !showPassword.value;
  }
  emit('append-click');
};
</script>
