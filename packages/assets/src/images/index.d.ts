/**
 * 图片资源导出
 *
 * 使用 Vite 的 `new URL()` 语法导出资源路径
 * 这样可以确保在开发和生产环境都能正确处理
 */
export declare const logo: string;
export declare const logo16: string;
export declare const logo24: string;
export declare const logo32: string;
export declare const logo48: string;
export declare const logo128: string;
export declare const logo256: string;
export declare const logoIco: string;
export declare const defaultAvatar: string;
export declare const logos: {
    readonly svg: string;
    readonly ico: string;
    readonly png16: string;
    readonly png24: string;
    readonly png32: string;
    readonly png48: string;
    readonly png128: string;
    readonly png256: string;
};
export type LogoSize = keyof typeof logos;
//# sourceMappingURL=index.d.ts.map