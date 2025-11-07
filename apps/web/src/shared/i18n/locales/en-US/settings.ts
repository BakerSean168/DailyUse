export default {
  title: 'Settings',
  
  // Navigation
  nav: {
    appearance: 'Appearance',
    locale: 'Language & Region',
    workflow: 'Workflow',
    shortcuts: 'Shortcuts',
    privacy: 'Privacy',
    experimental: 'Experimental',
    advanced: 'Advanced',
  },

  // Appearance Settings
  appearance: {
    title: 'Appearance',
    description: 'Customize the visual appearance',
    theme: {
      label: 'Theme Mode',
      description: 'Choose your preferred interface theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
    },
    accentColor: {
      label: 'Accent Color',
      description: 'Choose the app theme color',
    },
    fontSize: {
      label: 'Font Size',
      description: 'Adjust interface text size',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
    },
    fontFamily: {
      label: 'Font Family',
      description: 'Choose interface font',
      system: 'System Default',
      sansSerif: 'Sans-serif',
      serif: 'Serif',
      monospace: 'Monospace',
    },
    compactMode: {
      label: 'Compact Mode',
      description: 'Reduce spacing to show more content',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
  },

  // Language & Region Settings
  locale: {
    title: 'Language & Region',
    description: 'Set language, timezone and format preferences',
    language: {
      label: 'Interface Language',
      description: 'Choose app display language',
      zhCN: '简体中文',
      zhTW: '繁体中文',
      enUS: 'English (US)',
      ja: '日本語',
    },
    timezone: {
      label: 'Timezone',
      description: 'Choose your timezone',
      auto: 'Auto Detect',
    },
    dateFormat: {
      label: 'Date Format',
      description: 'Choose date display format',
      yyyymmdd: 'YYYY-MM-DD',
      mmddyyyy: 'MM/DD/YYYY',
      ddmmyyyy: 'DD/MM/YYYY',
      yyyymd: 'YYYY年M月D日',
    },
    timeFormat: {
      label: 'Time Format',
      description: 'Choose time display format',
      h12: '12-hour',
      h24: '24-hour',
    },
    weekStartsOn: {
      label: 'Week Starts On',
      description: 'Choose first day of week',
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
    },
    currency: {
      label: 'Currency',
      description: 'Choose default currency',
      cny: 'CNY (¥)',
      usd: 'USD ($)',
      eur: 'EUR (€)',
      jpy: 'JPY (¥)',
    },
  },

  // Workflow Settings
  workflow: {
    title: 'Workflow',
    description: 'Customize work style and default behavior',
    defaultViews: {
      label: 'Default Views',
      description: 'Set default view type for each module',
      task: {
        label: 'Task View',
        list: 'List View',
        kanban: 'Kanban View',
        calendar: 'Calendar View',
      },
      goal: {
        label: 'Goal View',
        list: 'List View',
        grid: 'Grid View',
        timeline: 'Timeline View',
      },
      schedule: {
        label: 'Schedule View',
        day: 'Day View',
        week: 'Week View',
        month: 'Month View',
      },
    },
    autoSave: {
      label: 'Auto Save',
      description: 'Automatically save your edits',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    autoSaveInterval: {
      label: 'Auto Save Interval',
      description: 'Set auto save interval (seconds)',
    },
    confirmBeforeDelete: {
      label: 'Delete Confirmation',
      description: 'Show confirmation dialog before deleting',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
  },

  // Shortcuts Settings
  shortcuts: {
    title: 'Shortcuts',
    description: 'Customize keyboard shortcuts',
    enabled: {
      label: 'Enable Shortcuts',
      description: 'Globally enable or disable shortcuts',
    },
    custom: {
      label: 'Custom Shortcuts',
      description: 'Set custom shortcuts for common actions',
      placeholder: 'Press key combination',
      reset: 'Reset',
      conflict: 'Shortcut conflict',
    },
    presets: {
      label: 'Presets',
      default: 'Default',
      vscode: 'VS Code',
      sublime: 'Sublime Text',
      vim: 'Vim',
    },
  },

  // Privacy Settings
  privacy: {
    title: 'Privacy',
    description: 'Control your privacy and data sharing',
    profileVisibility: {
      label: 'Profile Visibility',
      description: 'Control who can view your profile',
      public: 'Public',
      friendsOnly: 'Friends Only',
      private: 'Private',
    },
    showOnlineStatus: {
      label: 'Show Online Status',
      description: 'Let others see if you are online',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    allowSearchByEmail: {
      label: 'Allow Search by Email',
      description: 'Allow others to find you by email',
      enabled: 'Allowed',
      disabled: 'Not Allowed',
    },
    allowSearchByPhone: {
      label: 'Allow Search by Phone',
      description: 'Allow others to find you by phone',
      enabled: 'Allowed',
      disabled: 'Not Allowed',
    },
    shareUsageData: {
      label: 'Share Usage Data',
      description: 'Help us improve (anonymous data)',
      enabled: 'Allowed',
      disabled: 'Not Allowed',
    },
  },

  // Experimental Features
  experimental: {
    title: 'Experimental',
    description: 'Try features in development',
    warning: '⚠️ Experimental features may be unstable, please save your data',
    enabled: {
      label: 'Enable Experimental Features',
      description: 'Allow using experimental features',
    },
    features: {
      label: 'Available Features',
      description: 'Select experimental features to try',
      aiAssistant: 'AI Assistant',
      voiceInput: 'Voice Input',
      collaborativeEditing: 'Collaborative Editing',
      advancedSearch: 'Advanced Search',
      customThemes: 'Custom Themes',
    },
  },

  // Advanced
  advanced: {
    title: 'Advanced',
    description: 'Advanced settings and data management',
    dataManagement: {
      label: 'Data Management',
      export: {
        button: 'Export Settings',
        description: 'Export your settings as JSON',
        success: 'Settings exported successfully',
        error: 'Export failed',
      },
      import: {
        button: 'Import Settings',
        description: 'Import settings from JSON file',
        success: 'Settings imported successfully',
        error: 'Import failed',
        selectFile: 'Select File',
      },
      reset: {
        button: 'Reset All Settings',
        description: 'Restore all settings to defaults',
        confirm: 'Are you sure you want to reset all settings? This cannot be undone.',
        success: 'Settings reset successfully',
        error: 'Reset failed',
      },
    },
    defaults: {
      button: 'View Default Settings',
      description: 'View system default settings',
    },
  },

  // Common Actions
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    reset: 'Reset',
    apply: 'Apply',
    browse: 'Browse',
    upload: 'Upload',
    download: 'Download',
  },

  // Messages
  messages: {
    saveSuccess: 'Settings saved',
    saveFailed: 'Save failed',
    loadFailed: 'Failed to load settings',
    resetConfirm: 'Are you sure you want to reset this setting?',
    notAuthenticated: 'Please login first',
    noAccountInfo: 'Cannot get account info',
    initFailed: 'Failed to initialize settings',
  },

  // Legacy editor settings (backward compatibility)
  general: {
    title: 'General',
    theme: {
      label: 'Theme Mode',
      system: 'Follow System',
      dark: 'Dark Mode',
      light: 'Light Mode',
      blueGreen: 'Blue Green',
    },
    language: {
      label: 'Language',
      zhCN: '简体中文',
      enUS: 'English',
    },
    autoLaunch: {
      label: 'Auto Launch',
      on: 'Enable',
      off: 'Disable',
    },
  },
  editor: {
    title: 'Editor',
    fontSize: 'Font Size',
    wordWrap: {
      label: 'Word Wrap',
      on: 'On',
      off: 'Off',
    },
    lineNumbers: {
      label: 'Line Numbers',
      show: 'Show',
      hide: 'Hide',
    },
    minimap: {
      label: 'Minimap',
      show: 'Show',
      hide: 'Hide',
    },
    autoSave: {
      label: 'Auto Save',
      on: 'On',
      off: 'Off',
    },
    fontFamily: {
      label: 'Font Family',
      consolas: 'Consolas',
      sourceCodePro: 'Source Code Pro',
      firaCode: 'Fira Code',
      jetbrainsMono: 'JetBrains Mono',
    },
    tabSize: {
      label: 'Tab Size',
    },
    autoIndent: {
      label: 'Auto Indent',
      none: 'None',
      keep: 'Keep',
      brackets: 'Brackets',
      advanced: 'Advanced',
    },
    autoClosingBrackets: {
      label: 'Auto Close Brackets',
      always: 'Always',
      languageDefined: 'Language Defined',
      beforeWhitespace: 'Before Whitespace',
      never: 'Never',
    },
    renderWhitespace: {
      label: 'Show Whitespace',
      none: 'None',
      boundary: 'Boundary',
      selection: 'Selection',
      trailing: 'Trailing',
      all: 'All',
    },
    cursorStyle: {
      label: 'Cursor Style',
      line: 'Line',
      block: 'Block',
      underline: 'Underline',
      lineThin: 'Thin Line',
      blockOutline: 'Block Outline',
      underlineThin: 'Thin Underline',
    },
    cursorBlinking: {
      label: 'Cursor Blinking',
      blink: 'Blink',
      smooth: 'Smooth',
      phase: 'Phase',
      expand: 'Expand',
      solid: 'Solid',
    },
    smoothScrolling: {
      label: 'Smooth Scrolling',
      on: 'On',
      off: 'Off',
    },
    mouseWheelZoom: {
      label: 'Mouse Wheel Zoom',
      on: 'On',
      off: 'Off',
    },
    lineHeight: {
      label: 'Line Height',
    },
    insertImage: {
      label: 'Insert Image',
      embed: 'Embed',
      link: 'Link',
    },
  },
  file: {
    title: 'Files',
    showHiddenFiles: {
      label: 'Show Hidden Files',
      show: 'Show',
      hide: 'Hide',
    },
  },
  about: {
    title: 'About',
    version: 'DailyUse v1.0.0',
    description: 'A simple personal knowledge management tool',
  },
};
