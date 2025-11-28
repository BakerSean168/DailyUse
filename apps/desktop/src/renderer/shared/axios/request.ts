import axios, { AxiosInstance } from 'axios';
import type { ApiResponse } from '@dailyuse/contracts/response';
import { TokenManager } from '@renderer/modules/Account/utils/tokenManagement';
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
// 创建自定义的 axios 实例类型
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> {
  // 添加调用签名，使实例可以直接调用
  (config: AxiosRequestConfig): Promise<any>;
  (url: string, config?: AxiosRequestConfig): Promise<any>;

  // 自定义方法签名
  get<T = ApiResponse>(url: string, config?: any): Promise<T>;
  post<T = ApiResponse>(url: string, data?: any, config?: any): Promise<T>;
  put<T = ApiResponse>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = ApiResponse>(url: string, config?: any): Promise<T>;
}
export const myaxios = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3000'
      : 'http://www.bakersean.cloudns.ch',
  timeout: 10000,
}) as CustomAxiosInstance;

// 请求拦截器
myaxios.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器
myaxios.interceptors.response.use(
  (response) => {
    // 只返回业务数据部分
    return Promise.resolve(response.data);
  },
  async (error) => {
    console.error('响应拦截器', error);
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    // 如果是401错误且还没有重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // // 调用刷新token的API
        // const response = await remoteAuthService.refreshToken(refreshToken);
        // if (!response || !response.data) {
        //   throw new Error("刷新token失败");
        // }
        // const { accessToken } = response.data;
        // TokenManager.setTokens(accessToken, refreshToken);

        // // 重新发送原始请求
        // originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return myaxios(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除tokens并跳转到登录页
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    if (error.response) {
      // 服务器返回错误状态码
      const { status } = error.response;
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          console.error('权限不足');
          break;
        // ... 其他状态码处理
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // 请求已发出但未收到响应
      return Promise.reject({
        success: false,
        message: '服务器无响应，请检查网络连接',
        data: null,
      });
    } else {
      // 请求配置出错
      return Promise.reject({
        success: false,
        message: '请求配置错误',
        data: null,
      });
    }
  },
);
