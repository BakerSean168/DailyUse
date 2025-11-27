/**
 * Shared DTOs and types used across multiple modules.
 */
/**
 * 批量操作响应 DTO
 */
export interface BatchOperationResponseDTO<T = string> {
    successCount: number;
    failedCount: number;
    errors?: Array<{
        item: T;
        error: string;
    }>;
}
/**
 * Chart data structure
 */
export interface ChartDataDTO {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }[];
}
/**
 * Template statistics info
 */
export interface TemplateStatsInfoDTO {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    archivedTemplates: number;
    oneTimeTemplates: number;
    recurringTemplates: number;
}
//# sourceMappingURL=dtos.d.ts.map