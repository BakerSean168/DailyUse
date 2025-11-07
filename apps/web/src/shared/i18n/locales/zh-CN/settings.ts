export default {
  title: '设置',
  
  // 导航栏
  nav: {
    appearance: '外观',
    locale: '语言与区域',
    workflow: '工作流',
    shortcuts: '快捷键',
    privacy: '隐私',
    experimental: '实验性功能',
    advanced: '高级',
  },

  // 外观设置
  appearance: {
    title: '外观设置',
    description: '自定义应用的视觉效果',
    theme: {
      label: '主题模式',
      description: '选择您偏好的界面主题',
      light: '浅色',
      dark: '深色',
      auto: '跟随系统',
    },
    accentColor: {
      label: '强调色',
      description: '选择应用的主题色',
    },
    fontSize: {
      label: '字体大小',
      description: '调整界面文字大小',
      small: '小',
      medium: '中',
      large: '大',
    },
    fontFamily: {
      label: '字体',
      description: '选择界面使用的字体',
      system: '系统默认',
      sansSerif: '无衬线',
      serif: '衬线',
      monospace: '等宽',
    },
    compactMode: {
      label: '紧凑模式',
      description: '减少界面元素间距，显示更多内容',
      enabled: '开启',
      disabled: '关闭',
    },
  },

  // 语言与区域设置
  locale: {
    title: '语言与区域',
    description: '设置语言、时区和格式偏好',
    language: {
      label: '界面语言',
      description: '选择应用显示的语言',
      zhCN: '简体中文',
      zhTW: '繁体中文',
      enUS: 'English (US)',
      ja: '日本語',
    },
    timezone: {
      label: '时区',
      description: '选择您所在的时区',
      auto: '自动检测',
    },
    dateFormat: {
      label: '日期格式',
      description: '选择日期的显示格式',
      yyyymmdd: 'YYYY-MM-DD',
      mmddyyyy: 'MM/DD/YYYY',
      ddmmyyyy: 'DD/MM/YYYY',
      yyyymd: 'YYYY年M月D日',
    },
    timeFormat: {
      label: '时间格式',
      description: '选择时间的显示格式',
      h12: '12小时制',
      h24: '24小时制',
    },
    weekStartsOn: {
      label: '每周开始于',
      description: '选择日历中每周的第一天',
      sunday: '星期日',
      monday: '星期一',
      tuesday: '星期二',
      wednesday: '星期三',
      thursday: '星期四',
      friday: '星期五',
      saturday: '星期六',
    },
    currency: {
      label: '货币',
      description: '选择默认货币单位',
      cny: '人民币 (¥)',
      usd: '美元 ($)',
      eur: '欧元 (€)',
      jpy: '日元 (¥)',
    },
  },

  // 工作流设置
  workflow: {
    title: '工作流设置',
    description: '自定义工作方式和默认行为',
    defaultViews: {
      label: '默认视图',
      description: '设置各模块的默认视图类型',
      task: {
        label: '任务视图',
        list: '列表视图',
        kanban: '看板视图',
        calendar: '日历视图',
      },
      goal: {
        label: '目标视图',
        list: '列表视图',
        grid: '网格视图',
        timeline: '时间线视图',
      },
      schedule: {
        label: '日程视图',
        day: '日视图',
        week: '周视图',
        month: '月视图',
      },
    },
    autoSave: {
      label: '自动保存',
      description: '自动保存您的编辑内容',
      enabled: '开启',
      disabled: '关闭',
    },
    autoSaveInterval: {
      label: '自动保存间隔',
      description: '设置自动保存的时间间隔（秒）',
    },
    confirmBeforeDelete: {
      label: '删除确认',
      description: '删除项目前显示确认对话框',
      enabled: '开启',
      disabled: '关闭',
    },
  },

  // 快捷键设置
  shortcuts: {
    title: '快捷键',
    description: '自定义键盘快捷键',
    enabled: {
      label: '启用快捷键',
      description: '全局启用或禁用快捷键功能',
    },
    custom: {
      label: '自定义快捷键',
      description: '为常用操作设置自定义快捷键',
      placeholder: '按下组合键',
      reset: '重置',
      conflict: '快捷键冲突',
    },
    presets: {
      label: '预设方案',
      default: '默认',
      vscode: 'VS Code',
      sublime: 'Sublime Text',
      vim: 'Vim',
    },
  },

  // 隐私设置
  privacy: {
    title: '隐私设置',
    description: '控制您的隐私和数据共享',
    profileVisibility: {
      label: '个人资料可见性',
      description: '控制谁可以查看您的个人资料',
      public: '公开',
      friendsOnly: '仅好友',
      private: '私密',
    },
    showOnlineStatus: {
      label: '显示在线状态',
      description: '让其他用户看到您是否在线',
      enabled: '开启',
      disabled: '关闭',
    },
    allowSearchByEmail: {
      label: '允许通过邮箱搜索',
      description: '允许其他用户通过邮箱找到您',
      enabled: '允许',
      disabled: '不允许',
    },
    allowSearchByPhone: {
      label: '允许通过手机号搜索',
      description: '允许其他用户通过手机号找到您',
      enabled: '允许',
      disabled: '不允许',
    },
    shareUsageData: {
      label: '分享使用数据',
      description: '帮助我们改进产品（匿名数据）',
      enabled: '允许',
      disabled: '不允许',
    },
  },

  // 实验性功能
  experimental: {
    title: '实验性功能',
    description: '体验尚在开发中的新功能',
    warning: '⚠️ 实验性功能可能不稳定，使用时请注意保存数据',
    enabled: {
      label: '启用实验性功能',
      description: '允许使用实验性功能',
    },
    features: {
      label: '可用功能',
      description: '选择您想尝试的实验性功能',
      aiAssistant: 'AI 助手',
      voiceInput: '语音输入',
      collaborativeEditing: '协作编辑',
      advancedSearch: '高级搜索',
      customThemes: '自定义主题',
    },
  },

  // 高级操作
  advanced: {
    title: '高级',
    description: '高级设置和数据管理',
    dataManagement: {
      label: '数据管理',
      export: {
        button: '导出设置',
        description: '导出您的设置为 JSON 文件',
        success: '设置导出成功',
        error: '导出失败',
      },
      import: {
        button: '导入设置',
        description: '从 JSON 文件导入设置',
        success: '设置导入成功',
        error: '导入失败',
        selectFile: '选择文件',
      },
      reset: {
        button: '重置所有设置',
        description: '将所有设置恢复为默认值',
        confirm: '确定要重置所有设置吗？此操作不可撤销。',
        success: '设置已重置',
        error: '重置失败',
      },
    },
    defaults: {
      button: '查看默认设置',
      description: '查看系统默认的设置值',
    },
  },

  // 通用操作
  actions: {
    save: '保存',
    cancel: '取消',
    reset: '重置',
    apply: '应用',
    browse: '浏览',
    upload: '上传',
    download: '下载',
  },

  // 消息提示
  messages: {
    saveSuccess: '设置已保存',
    saveFailed: '保存失败',
    loadFailed: '加载设置失败',
    resetConfirm: '确定要重置此设置吗？',
    notAuthenticated: '请先登录',
    noAccountInfo: '无法获取账户信息',
    initFailed: '初始化设置失败',
  },

  // 保留旧的编辑器设置（向后兼容）
  general: {
    title: '通用',
    theme: {
      label: '主题模式',
      system: '跟随系统设置',
      dark: '深色模式',
      light: '浅色模式',
      blueGreen: '蓝绿',
    },
    language: {
      label: '语言',
      zhCN: '简体中文',
      enUS: 'English',
    },
    autoLaunch: {
      label: '开机自启动',
      on: '开启',
      off: '关闭',
    },
  },
  editor: {
    title: '编辑器',
    fontSize: '字体大小',
    wordWrap: {
      label: '自动换行',
      on: '开启',
      off: '关闭',
    },
    lineNumbers: {
      label: '显示行号',
      show: '显示',
      hide: '隐藏',
    },
    minimap: {
      label: '显示小地图',
      show: '显示',
      hide: '隐藏',
    },
    autoSave: {
      label: '自动保存',
      on: '开启',
      off: '关闭',
    },
    fontFamily: {
      label: '字体',
      consolas: 'Consolas',
      sourceCodePro: 'Source Code Pro',
      firaCode: 'Fira Code',
      jetbrainsMono: 'JetBrains Mono',
    },
    tabSize: {
      label: 'Tab 大小',
    },
    autoIndent: {
      label: '自动缩进',
      none: '不启用',
      keep: '保持缩进',
      brackets: '括号缩进',
      advanced: '高级缩进',
    },
    autoClosingBrackets: {
      label: '自动闭合括号',
      always: '始终',
      languageDefined: '根据语言',
      beforeWhitespace: '空格前',
      never: '从不',
    },
    renderWhitespace: {
      label: '显示空格',
      none: '不显示',
      boundary: '边界',
      selection: '选中时',
      trailing: '尾部',
      all: '所有',
    },
    cursorStyle: {
      label: '光标样式',
      line: '竖线',
      block: '方块',
      underline: '下划线',
      lineThin: '细竖线',
      blockOutline: '空心方块',
      underlineThin: '细下划线',
    },
    cursorBlinking: {
      label: '光标闪烁',
      blink: '闪烁',
      smooth: '平滑',
      phase: '相位',
      expand: '展开',
      solid: '实心',
    },
    smoothScrolling: {
      label: '平滑滚动',
      on: '开启',
      off: '关闭',
    },
    mouseWheelZoom: {
      label: '鼠标滚轮缩放',
      on: '开启',
      off: '关闭',
    },
    lineHeight: {
      label: '行高',
    },
    insertImage: {
      label: '插入图片',
      embed: '嵌入',
      link: '链接',
    },
  },
  file: {
    title: '文件',
    showHiddenFiles: {
      label: '显示隐藏文件',
      show: '显示',
      hide: '隐藏',
    },
  },
  about: {
    title: '关于',
    version: 'DailyUse v1.0.0',
    description: '一个简单的个人知识管理工具',
  },
};
