# @dailyuse/ui-core

Framework-agnostic headless UI logic for DailyUse applications.

## Overview

This package provides pure TypeScript implementations of UI state machines and logic that can be used with any UI framework (Vue, React, Solid, etc.).

## Installation

```bash
pnpm add @dailyuse/ui-core
```

## Features

### 🎨 Color Picker
- Color format conversion (HEX, RGB, HSL, HSV)
- Color picker state machine
- Utility functions (lighten, darken, contrast)

### 📝 Form Validation
- Framework-agnostic validation rules
- Pre-built validators (email, phone, URL)
- Composable validation logic

### 🔑 Password Strength
- Password strength calculation
- Improvement suggestions
- Strong password generator

### 💬 Dialog/Modal
- Confirm/Alert/Prompt state machines
- Customizable buttons and actions
- Promise-based API

### 📢 Message/Notification
- Message queue management
- Snackbar state machine
- Auto-dismiss with configurable timeouts

### ⏳ Loading States
- Basic loading controller
- Global loading overlay
- Button-specific loading
- Table loading states

## Usage

### Form Validation

```typescript
import { 
  required, 
  minLength, 
  email, 
  validate, 
  passwordRules 
} from '@dailyuse/ui-core/form';

// Create custom rules
const nameRules = [
  required('Name is required'),
  minLength(2, 'Name must be at least 2 characters'),
];

// Use pre-built rules
const passRules = passwordRules({ minLength: 8, requireUppercase: true });

// Validate
const result = validate('test@example.com', [email()]);
if (result.isValid) {
  console.log('Valid email!');
} else {
  console.log('Errors:', result.errors);
}
```

### Password Strength

```typescript
import { 
  calculatePasswordStrength, 
  generateStrongPassword 
} from '@dailyuse/ui-core/form';

const strength = calculatePasswordStrength('MyP@ssw0rd');
console.log(strength.score);       // 0-100
console.log(strength.level);       // 'weak' | 'medium' | 'strong' | 'very-strong'
console.log(strength.suggestions); // ['Add more characters', ...]

const password = generateStrongPassword(16);
console.log(password); // 'xK9#mL2$pQ7@nR4!'
```

### Dialog Controller

```typescript
import { createDialogController } from '@dailyuse/ui-core/dialog';

const dialog = createDialogController();

// Subscribe to state changes (for UI binding)
dialog.subscribe((state) => {
  console.log('Dialog visible:', state.isVisible);
});

// Show confirmation
const confirmed = await dialog.confirm({
  title: 'Delete Item?',
  message: 'This action cannot be undone.',
});

if (confirmed) {
  // User clicked confirm
}
```

### Message Controller

```typescript
import { createMessageController } from '@dailyuse/ui-core/message';

const messages = createMessageController({ maxVisible: 5 });

messages.success('Operation completed!');
messages.error('Something went wrong', { timeout: 5000 });
messages.warning('Please check your input');
```

### Loading Controller

```typescript
import { createLoadingController, withLoading } from '@dailyuse/ui-core/loading';

const loading = createLoadingController();

// Manual control
loading.start('Loading data...');
await fetchData();
loading.stop();

// Automatic wrapper
const fetchWithLoading = withLoading(loading, async () => {
  return await api.getData();
}, 'Fetching...');
```

### Color Picker

```typescript
import { 
  createColorPickerController,
  hexToRGB,
  getContrastColor 
} from '@dailyuse/ui-core/color-picker';

const picker = createColorPickerController('#3f51b5');

picker.subscribe((state) => {
  console.log('Current color:', state.hex);
  console.log('RGB:', state.rgb);
});

picker.setHex('#ff5722');

// Utility functions
const rgb = hexToRGB('#3f51b5');
const textColor = getContrastColor('#3f51b5'); // '#ffffff'
```

## Architecture

This package follows the **Headless UI** pattern:

```
@dailyuse/ui-core     ← Pure TypeScript, no framework dependencies
       ↓
@dailyuse/ui-vue      ← Vue composables wrapping core logic
       ↓
@dailyuse/ui-vuetify  ← Vuetify-styled components
```

## License

MIT
