import { createI18n } from 'vue-i18n';

// 只导入必要的基础翻译（登录页需要的）
import zhCNAuth from './locales/zh-CN/common'; // 只包含通用文本
import enUSAuth from './locales/en-US/common';

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': {
      common: zhCNAuth,
    },
    'en-US': {
      common: enUSAuth,
    },
  },
});

/**
 * 懒加载完整的语言包（包含所有业务模块的翻译）
 * 在用户登录后调用
 */
export async function loadFullLanguageMessages(locale: 'zh-CN' | 'en-US') {
  console.log(`🌍 [i18n] 加载完整语言包: ${locale}`);
  
  let messages;
  if (locale === 'zh-CN') {
    messages = await import('./locales/zh-CN/index');
  } else {
    messages = await import('./locales/en-US/index');
  }
  
  // 合并到现有的 messages
  i18n.global.setLocaleMessage(locale, messages.default);
  console.log(`✅ [i18n] 语言包加载完成: ${locale}`);
}

export function setLanguage(locale: 'en-US' | 'zh-CN') {
  i18n.global.locale.value = locale;
}

export function initializeLanguage() {}

export default i18n;
