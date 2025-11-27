/**
 * 图片资源导出
 *
 * 使用 Vite 的 `new URL()` 语法导出资源路径
 * 这样可以确保在开发和生产环境都能正确处理
 */
// Logos
export const logo = new URL('./logos/DailyUse.svg', import.meta.url).href;
export const logo16 = new URL('./logos/DailyUse-16.png', import.meta.url).href;
export const logo24 = new URL('./logos/DailyUse-24.png', import.meta.url).href;
export const logo32 = new URL('./logos/DailyUse-32.png', import.meta.url).href;
export const logo48 = new URL('./logos/DailyUse-48.png', import.meta.url).href;
export const logo128 = new URL('./logos/DailyUse-128.png', import.meta.url).href;
export const logo256 = new URL('./logos/DailyUse-256.png', import.meta.url).href;
export const logoIco = new URL('./logos/DailyUse.ico', import.meta.url).href;
// Icons - 可以根据需要添加更多图标
// Avatars
export const defaultAvatar = new URL('./avatars/profile1.png', import.meta.url).href;
// 导出所有 logos 作为对象（可选）
export const logos = {
    svg: logo,
    ico: logoIco,
    png16: logo16,
    png24: logo24,
    png32: logo32,
    png48: logo48,
    png128: logo128,
    png256: logo256,
};
//# sourceMappingURL=index.js.map