# @dailyuse/ui-vue

Vue 3 composables for DailyUse headless UI.

## Overview

This package provides Vue 3 composables that wrap the framework-agnostic logic from `@dailyuse/ui-core`, making it reactive and easy to use in Vue applications.

## Installation

```bash
pnpm add @dailyuse/ui-vue
```

## Composables

### Form Validation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useFormValidation, useFormRules, email, minLength } from '@dailyuse/ui-vue';

const emailValue = ref('');
const { isValid, errors, firstError } = useFormValidation(emailValue, [
  email('Please enter a valid email'),
]);

// Or use pre-built rules
const rules = useFormRules();
// rules.email, rules.password, rules.username, rules.phone
</script>
```

### Password Strength

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePasswordStrength, generateStrongPassword } from '@dailyuse/ui-vue';

const password = ref('');
const { score, percentage, text, color, suggestions, isStrong } = usePasswordStrength(password);

function generatePassword() {
  password.value = generateStrongPassword(16);
}
</script>

<template>
  <v-text-field v-model="password" label="Password" />
  <v-progress-linear :model-value="percentage" :color="color" />
  <p>Strength: {{ text }} ({{ score }}/100)</p>
  <ul v-if="suggestions.length">
    <li v-for="s in suggestions" :key="s">{{ s }}</li>
  </ul>
</template>
```

### Dialog

```vue
<script setup lang="ts">
import { useDialog } from '@dailyuse/ui-vue';

const dialog = useDialog();

async function confirmAction() {
  const confirmed = await dialog.confirm({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  });
  
  if (confirmed) {
    // User clicked confirm
  }
}

async function deleteItem(name: string) {
  const confirmed = await dialog.confirmDelete({ itemName: name });
  if (confirmed) {
    // Delete the item
  }
}

async function promptUser() {
  const input = await dialog.prompt({
    title: 'Enter Name',
    message: 'Please enter your name:',
    inputDefaultValue: 'John',
  });
  
  if (input !== null) {
    console.log('User entered:', input);
  }
}
</script>

<template>
  <!-- Dialog UI component (implement with your UI library) -->
  <v-dialog v-model="dialog.isVisible.value">
    <v-card>
      <v-card-title>{{ dialog.title.value }}</v-card-title>
      <v-card-text>{{ dialog.message.value }}</v-card-text>
      <v-card-actions>
        <v-btn @click="dialog.handleCancel">Cancel</v-btn>
        <v-btn color="primary" @click="dialog.handleConfirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

### Message / Snackbar

```vue
<script setup lang="ts">
import { useSnackbar, useGlobalMessage } from '@dailyuse/ui-vue';

const snackbar = useSnackbar();

function showSuccess() {
  snackbar.success('Operation completed!');
}

function showError() {
  snackbar.error('Something went wrong', { timeout: 5000 });
}
</script>

<template>
  <v-snackbar
    v-model="snackbar.isVisible.value"
    :color="snackbar.color.value"
  >
    {{ snackbar.message.value }}
  </v-snackbar>
</template>
```

### Loading

```vue
<script setup lang="ts">
import { useLoading, useGlobalLoading, useButtonLoading } from '@dailyuse/ui-vue';

// Basic loading
const loading = useLoading();

async function fetchData() {
  await loading.wrap(async () => {
    // Your async operation
    await api.getData();
  }, 'Loading data...');
}

// Global loading overlay
const globalLoading = useGlobalLoading();

// Button-specific loading
const buttonLoading = useButtonLoading();

const handleSubmit = buttonLoading.createHandler('submit', async () => {
  await api.submit();
});
</script>

<template>
  <v-btn
    :loading="buttonLoading.isLoading('submit')"
    @click="handleSubmit"
  >
    Submit
  </v-btn>
</template>
```

### Color Picker

```vue
<script setup lang="ts">
import { useColorPicker, MATERIAL_COLORS } from '@dailyuse/ui-vue';

const picker = useColorPicker('#3f51b5');
</script>

<template>
  <div>
    <div 
      :style="{ 
        backgroundColor: picker.hex.value,
        color: picker.contrastColor.value 
      }"
    >
      Selected: {{ picker.hex.value }}
    </div>
    
    <div class="color-swatches">
      <button
        v-for="color in MATERIAL_COLORS"
        :key="color"
        :style="{ backgroundColor: color }"
        @click="picker.setHex(color)"
      />
    </div>
  </div>
</template>
```

## Architecture

```
@dailyuse/ui-core     ← Pure TypeScript, no framework dependencies
       ↓
@dailyuse/ui-vue      ← Vue composables wrapping core logic (this package)
       ↓
@dailyuse/ui-vuetify  ← Vuetify-styled components
```

## License

MIT
