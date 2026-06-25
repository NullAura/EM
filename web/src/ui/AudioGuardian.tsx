import React, { useState, useEffect } from 'react';
import {
  WaveformCanvas,
  AudioUploader,
  TitleSection,
  StartButton,
  SceneButton,
  ToggleSwitch,
  Navbar
} from './components';
import { startSceneMode, stopSceneMode, getSceneStatus, SceneConfig } from '../api/sceneAPI';

const AudioGuardian: React.FC = () => {
  // 状态管理
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [processedAudio, setProcessedAudio] = useState<string | null>(null);
  
  // Scene模式状态
  const [showToggle, setShowToggle] = useState<boolean>(false);
  const [isSceneEnabled, setIsSceneEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const showPrimaryActions = !showUpload && !showToggle;
  
  // Scene配置
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    enabled: false,
    noiseType: 'both',
    noiseAmplitude: 0.005,  // 使用较高的噪声量以便听到效果
    ultrasonicFreq: 20000,
  });

  // 检查Scene状态
  useEffect(() => {
    const checkSceneStatus = async () => {
      try {
        const status = await getSceneStatus();
        setIsSceneEnabled(status.running);
        // 如果Scene正在运行但我们的状态不知道，则更新状态
        if (status.running && !showToggle) {
          setShowToggle(true);
        }
      } catch (error) {
        console.error('获取Scene状态失败:', error);
        // 非致命错误，不显示给用户
      }
    };

    // 页面加载时检查一次
    checkSceneStatus();
    
    // 定期检查状态（每10秒）
    const interval = setInterval(checkSceneStatus, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Scene按钮点击处理
  const handleSceneClick = () => {
    setShowToggle(true);
    setError(null);
  };

  // 切换Scene模式
  const handleToggleScene = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isSceneEnabled) {
        // 停止Scene模式
        await stopSceneMode();
        setIsSceneEnabled(false);
      } else {
        // 启动Scene模式
        // 更新配置状态
        const config: SceneConfig = {
          ...sceneConfig,
          enabled: true
        };
        
        await startSceneMode(config);
        setIsSceneEnabled(true);
      }
    } catch (err) {
      console.error('Scene模式切换失败:', err);
      setError(err instanceof Error ? err.message : '连接服务器失败，请确保后端服务已启动');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果用户离开页面，确保停止Scene模式
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSceneEnabled) {
        // 尝试停止Scene模式，但不等待结果
        stopSceneMode().catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // 组件卸载时停止Scene模式
      if (isSceneEnabled) {
        stopSceneMode().catch(console.error);
      }
    };
  }, [isSceneEnabled]);

  return (
    <div className="relative w-full h-screen bg-black overflow-y-auto" style={{ paddingTop: '10vh' }}>
      {/* 背景波形 */}
      <WaveformCanvas processedAudio={processedAudio} />

      {/* 导航栏 */}
      <Navbar />
      
      {/* 标题区域 */}
      <TitleSection showUpload={showUpload || showToggle} />
      
      {/* 上传区域 */}
      <AudioUploader 
        showUpload={showUpload} 
        onClose={() => setShowUpload(false)} 
      />
      
      {/* Scene切换开关 */}
      <ToggleSwitch 
        isOn={isSceneEnabled}
        onToggle={handleToggleScene}
        showToggle={showToggle && !showUpload}
        isLoading={isLoading}
        error={error}
      />
      
      {/* 主操作按钮 */}
      {showPrimaryActions && (
        <div className="absolute left-1/2 top-[64vh] z-20 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-4 px-6 sm:flex-row sm:gap-6">
          <SceneButton
            showUpload={false}
            onClick={handleSceneClick}
          />

          <StartButton
            showUpload={false}
            onClick={() => setShowUpload(true)}
          />
        </div>
      )}
    </div>
  );
};

export default AudioGuardian;
