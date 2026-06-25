import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import AnimatedContent from '../AnimatedContent';

const App: React.FC = () => {
  // 添加状态管理上传流程
  // 定义四个React状态变量，用于管理音频处理流程：
  // 1. showUpload: 布尔值，控制是否显示上传界面
  // 2. selectedFile: 存储用户选择的音频文件，初始为null
  // 3. processedAudio: 存储处理后的音频URL，初始为null
  // 4. isProcessing: 布尔值，表示音频是否正在处理中
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedAudio, setProcessedAudio] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 添加新的状态管理
  const [noiseType, setNoiseType] = useState<string>('both');
  const [noiseAmplitude, setNoiseAmplitude] = useState<number>(0.001);
  const [ultrasonicFreq, setUltrasonicFreq] = useState<number>(20000);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 处理音频文件
  const processAudio = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setError(null); // 清除之前的错误
      
      // 创建一个 FormData 对象来上传文件
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('ultrasonic_freq', String(ultrasonicFreq));
      formData.append('amplitude', String(noiseAmplitude));
      formData.append('noise_type', noiseType);
      
      // 调用后端 API
      const response = await fetch('http://localhost:5001/api/process-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMsg = '处理音频时出错';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // 如果响应不是JSON，使用默认错误信息
        }
        throw new Error(errorMsg);
      }
      
      // 获取处理后的音频文件
      const audioBlob = await response.blob();
      const processedUrl = URL.createObjectURL(audioBlob);
      
      setProcessedAudio(processedUrl);
    } catch (error) {
      console.error("Error processing audio:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // 当选择文件后自动处理
  useEffect(() => {
    if (selectedFile) {
      processAudio();
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // 初始化音频上下文
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    // 粒子系统
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(147, 51, 234, ${Math.random() * 0.5 + 0.5})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 100;

    // 动画函数
    const animate = () => {
      if (!ctx) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);

        if (particles[i].size <= 0.2) {
          particles.splice(i, 1);
        }
      }

      // 添加新粒子
      while (particles.length < particleCount) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
      }

      // 绘制波形
      if (analyserRef.current && processedAudio) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // 如果有真实音频数据，绘制实际波形
        if (!dataArray.every(val => val === 128)) {
          const sliceWidth = canvas.width / bufferLength;
          let x = 0;
          
          // 多层波形
          const layerCount = 10; // 波形层数
          const baseAmplitude = canvas.height / 0.01; // 基础振幅
          
          for (let layer = 0; layer < layerCount; layer++) {
            // 计算每层的透明度和颜色
            const opacity = 0.8 - (layer * 0.06);
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `rgba(0, 210, 255, ${opacity * 0.7})`); // 上部颜色
            gradient.addColorStop(1, `rgba(58, 123, 213, ${opacity})`);      // 下部颜色
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5 - (layer * 0.1);
            ctx.beginPath();
            
            // 波形的垂直偏移 - 每层稍微错开一点
            const verticalOffset = 2 * layer;
            
            // 使用音频数据绘制波形
            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0; // 归一化音频数据
              // 振幅随层数减小
              const amplitude = baseAmplitude * (1 - layer * 0.08);
              const y = (v * amplitude) + (canvas.height / 2) + verticalOffset;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              
              x += sliceWidth;
            }
            
            ctx.stroke();
          }
        } else {
          // 没有实际音频数据时绘制模拟波形
          drawSimulatedWaveform(ctx, canvas);
        }
      } else {
        // 没有音频上下文时绘制模拟波形
        drawSimulatedWaveform(ctx, canvas);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 绘制模拟波形的函数
    function drawSimulatedWaveform(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.001;
      const layerCount = 12;
      
      // 多层波浪效果
      for (let layer = 0; layer < layerCount; layer++) {
        const opacity = 0.8 - (layer * 0.05);
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgba(0, 210, 255, ${opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(58, 123, 213, ${opacity})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5 - (layer * 0.1);
        ctx.beginPath();
        
        // 波形的垂直偏移 - 每层错开
        const verticalOffset = 2 * layer;
        
        // 波形频率和相位差
        const frequency = 0.005 - (layer * 0.0003);
        const phaseShift = layer * 0.7;
        const amplitude = 25 - (layer * 1.5);
        
        // 开始绘制波形路径
        for (let x = 0; x < canvas.width; x += 2) {
          // 使用多个正弦波叠加，创建复杂波形
          let y = 3*Math.sin(x * frequency + time + phaseShift) * amplitude;
          // 添加次要波形
          y += 10*Math.sin(x * frequency * 2.5 + time * 1.3) * (amplitude * 0.4);
          // 添加高频波纹
          y += Math.sin(x * frequency * 5 + time * 0.7) * (amplitude * 0.2);
          
          // 定位到画布中心
          y += centerY + verticalOffset;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-y-auto" style={{ paddingTop: '10vh' }}>
        
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      {/* 标题区域 - 使用条件样式控制位置 */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-700 text-center z-10" 
        style={{ 
          paddingTop: showUpload ? '40vh' : '60vh', 
          opacity: showUpload ? 0.7 : 1
        }}
      >
        <AnimatedContent
          distance={300}
          direction="vertical"
          reverse={true}
          config={{ tension: 80, friction: 20 }}
          initialOpacity={0.2}
          animateOpacity={true}
          scale={1.1}
          threshold={0.2}
        >
            <div className="absolute" style={{ top: '-40vh', left: '50%', transform: 'translateX(-50%)' }}>
            <h1 className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-white bg-clip-text text-transparent whitespace-nowrap">Make UR Audio</h1>
            <h1 className="text-6xl font-semibold mb-8 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">Unlearnable</h1>
          </div>
        </AnimatedContent>
      </div>

      {/* 上传区域 - 在按钮点击后显示 */}
      {showUpload && (
        <div className="absolute left-1/2 top-[60%] transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
          <AnimatedContent
            distance={300}
            direction="vertical"
            reverse={false}
            config={{ tension: 80, friction: 20 }}
            initialOpacity={0.2}
            animateOpacity={true}
            scale={1}
            threshold={0.2}
          >
            <div className="bg-black/70 backdrop-blur-lg p-10 rounded-xl border border-purple-600/50 shadow-lg shadow-purple-600/30 w-full max-w-xl">
              {!selectedFile ? (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-white">上传您的音频文件</h2>
                  <div className="border-2 border-dashed border-purple-500/50 rounded-lg p-10 hover:border-purple-500 transition-colors mb-6">
                    <input 
                      type="file" 
                      id="audio-upload" 
                      accept="audio/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="audio-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-purple-300 font-medium">点击或拖放文件到此处</span>
                      <span className="text-gray-400 text-sm mt-2">支持的格式: MP3, WAV, OGG, FLAC</span>
                    </label>
                  </div>

                  <div className="mb-3">
                      <label className="text-gray-300 text-sm block mb-1">保护类型</label>
                      <select
                        value={noiseType}
                        onChange={(e) => setNoiseType(e.target.value)}
                        className="w-full bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-white"
                      >
                        <option value="both">综合保护 (推荐)</option>
                        <option value="ultrasonic">common声波保护</option>
                        <option value="min_min">误差最小化保护</option>
                      </select>
                    </div>
                  
                  {/* 参数设置
                  <div className="bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-white text-lg font-medium mb-3">保护选项</h3>
                    
                    <div className="mb-3">
                      <label className="text-gray-300 text-sm block mb-1">保护类型</label>
                      <select
                        value={noiseType}
                        onChange={(e) => setNoiseType(e.target.value)}
                        className="w-full bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-white"
                      >
                        <option value="both">综合保护 (推荐)</option>
                        <option value="ultrasonic">超声波保护</option>
                        <option value="min_min">错误最小化保护</option>
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="text-gray-300 text-sm block mb-1">
                        噪声强度: {noiseAmplitude.toFixed(4)}
                      </label>
                      <input
                        type="range"
                        min="0.0001"
                        max="0.01"
                        step="0.0001"
                        value={noiseAmplitude}
                        onChange={(e) => setNoiseAmplitude(parseFloat(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>低(隐蔽性高)</span>
                        <span>高(强保护)</span>
                      </div>
                    </div>
                    
                    {(noiseType === 'ultrasonic' || noiseType === 'both') && (
                      <div>
                        <label className="text-gray-300 text-sm block mb-1">
                          超声波频率: {ultrasonicFreq.toFixed(0)} Hz
                        </label>
                        <input
                          type="range"
                          min="18000"
                          max="22000"
                          step="100"
                          value={ultrasonicFreq}
                          onChange={(e) => setUltrasonicFreq(parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    )}
                  </div> */}
                </>
              ) : isProcessing ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-white">处理您的音频中...</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-white">处理完成</h2>
                  <div className="bg-purple-900/30 p-4 rounded-lg mb-6">
                    <p className="text-green-400 mb-2">✓ 音频已成功处理</p>
                    <p className="text-white text-sm mb-4">{selectedFile.name}</p>
                    <audio controls className="w-full" src={processedAudio || ''}>
                      您的浏览器不支持音频元素
                    </audio>
                  </div>
                  {error && (
                    <div className="bg-red-900/30 p-4 rounded-lg mb-6">
                      <p className="text-red-400">❌ 处理出错</p>
                      <p className="text-white text-sm">{error}</p>
                    </div>
                  )}
                  <div className="flex space-x-4 justify-center">
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        setProcessedAudio(null);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-transparent border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors"
                    >
                      上传新文件
                    </button>
                    {!error && processedAudio && (
                      <a 
                        href={processedAudio} 
                        download={selectedFile.name.replace(/\.[^/.]+$/, '') + '_protected.mp3'}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        下载处理后的音频
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </AnimatedContent>
        </div>
      )}

      {/* 开始按钮区域 - 只在未显示上传区域时显示 */}
      {!showUpload && (
        <div className="relative max-w-lg mx-auto" 
          style={{ 
            minHeight: '50vh',
            paddingTop: '50vh',
            marginRight: "60px"
          }}
        >
          <AnimatedContent
            distance={100}
            direction="horizontal"
            reverse={false}
            config={{ tension: 80, friction: 20 }}
            initialOpacity={0.2}
            animateOpacity={true}
            scale={1.1}
            threshold={0.2}
            delay={0}
          >
            <div>
              <button 
                onClick={() => setShowUpload(true)}
                className="bg-transparent border border-purple-600 text-purple-600 px-8 py-3 rounded-lg hover:bg-purple-600 hover:text-white transition-colors duration-300 !rounded-button whitespace-nowrap"
              >
                <span className="bg-gradient-to-r from-blue-500 to-white bg-clip-text text-transparent font-bold text-xl">
                  Get Start
                </span>
              </button>
            </div>
          </AnimatedContent>
        </div>
      )}
      
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-music text-2xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"></i>
            <span className="text-white text-xl font-bold">AudioShield</span>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#" className="text-white hover:text-purple-500 transition-colors">功能特点</a>
            <a href="#" className="text-white hover:text-purple-500 transition-colors">工作原理</a>
            <a href="#" className="text-white hover:text-purple-500 transition-colors">示例</a>
            <a href="#" className="text-white hover:text-purple-500 transition-colors">定价</a>
          </div>
          <div className="flex items-center space-x-4">
            <text className="text-white hover:text-purple-500 transition-colors">|</text>
            <button className="text-white hover:text-purple-500 transition-colors whitespace-nowrap !rounded-button">登录</button>
            <button className="text-white font-bold px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors whitespace-nowrap !rounded-button">注册</button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default App;

