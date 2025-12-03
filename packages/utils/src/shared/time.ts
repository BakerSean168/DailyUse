export const nowIso = () => new Date().toISOString();
export const toIso = (d: Date | number | string) => new Date(d).toISOString();
