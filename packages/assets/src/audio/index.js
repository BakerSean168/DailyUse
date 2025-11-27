/**
 * 音频资源导出
 *
 * 所有通知音效的统一导出
 */
// 通知音效
export const alertSound = new URL('./notifications/alert.wav', import.meta.url).href;
export const defaultSound = new URL('./notifications/default.wav', import.meta.url).href;
export const errorSound = new URL('./notifications/error.wav', import.meta.url).href;
export const notificationSound = new URL('./notifications/notification.wav', import.meta.url).href;
export const reminderSound = new URL('./notifications/reminder.wav', import.meta.url).href;
export const successSound = new URL('./notifications/success.wav', import.meta.url).href;
// 导出所有音效作为对象（可选）
export const sounds = {
    alert: alertSound,
    default: defaultSound,
    error: errorSound,
    notification: notificationSound,
    reminder: reminderSound,
    success: successSound,
};
//# sourceMappingURL=index.js.map