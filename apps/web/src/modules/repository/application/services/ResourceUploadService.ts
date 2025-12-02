/**
 * Resource Upload Service
 * 资源上传服务 - 处理图片、音频、视频等文件上传
 */

import { useRepositoryViewStore } from '../../presentation/stores/repositoryViewStore';
import type { ResourceUploadResult } from '@dailyuse/contracts/repository';
import { RESOURCE_UPLOAD_CONFIG } from '@dailyuse/contracts/repository';
import {
  createUploadSession,
  recordUploadStart,
  recordUploadSuccess,
  recordUploadFailure,
  endUploadSession,
} from './UploadStats';

// Re-export for convenience
export type { ResourceUploadResult };

/**
 * 上传进度回调
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * 压缩图片
 */
async function compressImage(
  file: File,
  quality: number,
  maxWidth: number,
  convertToWebP: boolean
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 清理 ObjectURL 防止内存泄漏
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;

      // 按最大宽度缩放
      if (maxWidth > 0 && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = convertToWebP ? 'image/webp' : file.type;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          mimeType,
          quality / 100
        );
      } else {
        reject(new Error('无法获取 canvas context'));
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 将文件转为 Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 处理图片嵌入
 * 根据设置决定使用链接引用还是 Base64 嵌入
 */
export async function processImageForEmbed(
  file: File,
  repositoryUuid: string
): Promise<{ type: 'link' | 'base64'; content: string }> {
  const viewStore = useRepositoryViewStore();
  const settings = viewStore.repositorySettings;
  
  let processedFile: File | Blob = file;
  
  // 如果启用压缩，先压缩图片
  if (settings.imageCompression && file.type.startsWith('image/')) {
    try {
      processedFile = await compressImage(
        file,
        settings.compressionQuality,
        settings.maxImageWidth,
        settings.autoConvertToWebP
      );
    } catch (e) {
      console.warn('图片压缩失败，使用原图:', e);
    }
  }
  
  const fileSizeKB = processedFile.size / 1024;
  
  // 根据嵌入模式决定处理方式
  if (settings.imageEmbedMode === 'base64') {
    // 强制 Base64 嵌入
    const base64 = await fileToBase64(processedFile as File);
    return { type: 'base64', content: base64 };
  }
  
  if (settings.imageEmbedMode === 'auto') {
    // 小于阈值则嵌入，否则链接
    if (fileSizeKB < settings.autoEmbedThreshold) {
      const base64Auto = await fileToBase64(processedFile as File);
      return { type: 'base64', content: base64Auto };
    }
  }
  
  // link 模式或 auto 模式超过阈值 - 上传文件并返回路径
  const result = await uploadResource(processedFile as File, repositoryUuid);
  return { type: 'link', content: `![[${result.name}]]` };
}

/**
 * 上传资源到服务器
 */
export async function uploadResource(
  file: File | Blob,
  repositoryUuid: string,
  folderPath?: string,
  onProgress?: UploadProgressCallback
): Promise<ResourceUploadResult> {
  const formData = new FormData();
  
  // 如果是 Blob，创建一个带原始文件名的 File
  if (file instanceof Blob && !(file instanceof File)) {
    file = new File([file], 'image.webp', { type: file.type });
  }
  
  formData.append('file', file);
  if (folderPath) {
    formData.append('folderPath', folderPath);
  }

  console.log('📤 [Upload] 上传资源:', {
    name: (file as File).name,
    size: file.size,
    type: file.type,
    repositoryUuid,
    folderPath,
  });

  try {
    // 使用 XMLHttpRequest 支持上传进度
    const result = await new Promise<ResourceUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 上传进度
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.message || '上传失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.ontimeout = () => reject(new Error('上传超时'));

      xhr.open('POST', `/api/repositories/${repositoryUuid}/resources/upload`);
      xhr.timeout = 60000; // 60秒超时
      
      // 添加认证 token
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });

    return result;
  } catch (error) {
    console.error('📤 [Upload] 上传失败:', error);
    
    // 开发环境下回退到模拟上传
    if (import.meta.env.DEV) {
      console.warn('📤 [Upload] DEV 模式：使用模拟上传');
      
      // 模拟上传进度
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          onProgress(Math.min(progress, 100));
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 100);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        uuid: crypto.randomUUID(),
        name: (file as File).name,
        path: `assets/${(file as File).name}`,
        type: file.type,
        size: file.size,
        url: `/api/repositories/${repositoryUuid}/assets/${encodeURIComponent((file as File).name)}`,
      };
    }
    
    throw error;
  }
}

/**
 * 并行上传资源（带并发控制和统计）
 */
export async function uploadResources(
  files: File[],
  repositoryUuid: string,
  folderPath?: string,
  onProgress?: (totalProgress: number, currentFile: string) => void
): Promise<ResourceUploadResult[]> {
  const results: ResourceUploadResult[] = [];
  const total = files.length;
  let completed = 0;
  
  // 创建上传会话用于统计
  createUploadSession();
  
  /**
   * 处理单个文件上传
   */
  const processFile = async (file: File): Promise<ResourceUploadResult> => {
    // 记录上传开始
    const recordId = recordUploadStart(file.name, file.size, file.type);
    
    try {
      const result = await uploadResource(file, repositoryUuid, folderPath);
      completed++;
      
      // 记录上传成功
      recordUploadSuccess(recordId, result.size);
      
      if (onProgress) {
        onProgress(Math.round((completed / total) * 100), file.name);
      }
      
      return result;
    } catch (error) {
      // 记录上传失败
      recordUploadFailure(recordId, error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  
  // 分批并行处理
  for (let i = 0; i < files.length; i += RESOURCE_UPLOAD_CONFIG.CLIENT_MAX_CONCURRENT) {
    const batch = files.slice(i, i + RESOURCE_UPLOAD_CONFIG.CLIENT_MAX_CONCURRENT);
    
    if (onProgress) {
      const fileNames = batch.map(f => f.name).join(', ');
      onProgress(Math.round((completed / total) * 100), fileNames);
    }
    
    const batchResults = await Promise.all(batch.map(processFile));
    results.push(...batchResults);
  }
  
  // 结束上传会话
  endUploadSession();
  
  if (onProgress) {
    onProgress(100, '完成');
  }
  
  return results;
}

/**
 * 串行上传资源（用于需要严格顺序的场景）
 */
export async function uploadResourcesSequential(
  files: File[],
  repositoryUuid: string,
  folderPath?: string,
  onProgress?: (totalProgress: number, currentFile: string) => void
): Promise<ResourceUploadResult[]> {
  const results: ResourceUploadResult[] = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(Math.round((i / total) * 100), file.name);
    }
    
    const result = await uploadResource(file, repositoryUuid, folderPath);
    results.push(result);
  }
  
  if (onProgress) {
    onProgress(100, '完成');
  }
  
  return results;
}

/**
 * 生成 Markdown 嵌入语法
 */
export function generateEmbedSyntax(
  filename: string,
  type: 'image' | 'audio' | 'video' | 'link' | 'other'
): string {
  switch (type) {
    case 'image':
    case 'audio':
    case 'video':
      return `![[${filename}]]`;
    case 'link':
      return `[[${filename}]]`;
    default:
      return `[${filename}](${filename})`;
  }
}

/**
 * 根据文件扩展名判断类型
 */
export function getFileType(filename: string): 'image' | 'audio' | 'video' | 'pdf' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext)) {
    return 'audio';
  }
  if (['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'wmv'].includes(ext)) {
    return 'video';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  return 'other';
}
