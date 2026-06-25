/**
 * Scene模式API接口
 * 
 * 用于控制实时音频处理功能
 */

// 定义Scene模式配置接口
export interface SceneConfig {
  enabled: boolean;
  noiseType: 'ultrasonic' | 'min_min' | 'both';
  noiseAmplitude: number;
  ultrasonicFreq: number;
}

// API基础URL
const API_BASE_URL_PRIMARY = '/api';
const API_BASE_URL_FALLBACK = '/api';

// 用于跟踪哪个API可用
let useBackupApi = false;

/**
 * 检查API服务器状态
 * 
 * @returns 可用的API基础URL
 */
const getApiBaseUrl = async (): Promise<string> => {
  // 如果之前已确定使用备用API，直接返回
  if (useBackupApi) {
    return API_BASE_URL_FALLBACK;
  }
  
  try {
    // 尝试访问主API
    const response = await fetch(`${API_BASE_URL_PRIMARY}/check`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      return API_BASE_URL_PRIMARY;
    }
  } catch (error) {
    console.warn('主API不可用，尝试备用API');
  }
  
  try {
    // 尝试访问备用API
    const response = await fetch(`${API_BASE_URL_FALLBACK}/check`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      useBackupApi = true;
      return API_BASE_URL_FALLBACK;
    }
  } catch (error) {
    console.error('所有API都不可用');
  }
  
  // 如果两个API都不可用，返回主API（会产生错误，但至少是一致的）
  return API_BASE_URL_PRIMARY;
};

/**
 * 发送API请求并处理可能的错误
 * 
 * @param endpoint API端点
 * @param options fetch选项
 * @returns 响应数据
 */
const apiRequest = async (endpoint: string, options: RequestInit) => {
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    
    // 重新抛出错误，添加更友好的信息
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到服务器，请确保API服务器正在运行');
      }
      throw error;
    }
    
    throw new Error('未知错误');
  }
};

/**
 * 启动Scene模式
 * 
 * @param config Scene模式配置
 * @returns 返回一个Promise，包含响应状态
 */
export const startSceneMode = async (config: SceneConfig): Promise<{ status: string }> => {
  return apiRequest('/scene/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
};

/**
 * 停止Scene模式
 * 
 * @returns 返回一个Promise，包含响应状态
 */
export const stopSceneMode = async (): Promise<{ status: string }> => {
  return apiRequest('/scene/stop', {
    method: 'POST',
  });
};

/**
 * 获取Scene模式状态
 * 
 * @returns 返回一个Promise，包含当前Scene模式状态
 */
export const getSceneStatus = async (): Promise<{ running: boolean }> => {
  return apiRequest('/scene/status', {
    method: 'GET',
  });
};
