// 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果

import React, { useState } from 'react';
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const [noiseValue, setNoiseValue] = useState<number>(0.001);
  const audioWaveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioWaveRef.current) {
      const chart = echarts.init(audioWaveRef.current);
      const option = {
        animation: false,
        grid: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        xAxis: {
          type: 'category',
          show: false,
          data: Array.from({ length: 50 }, (_, i) => i)
        },
        yAxis: {
          type: 'value',
          show: false
        },
        series: [{
          data: Array.from({ length: 50 }, () => Math.random() * 30),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: '#9333EA'
              }, {
                offset: 1,
                color: '#EC4899'
              }]
            }
          },
          barWidth: '60%'
        }]
      };
      chart.setOption(option as any);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-music text-2xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"></i>
            <span className="text-xl font-bold">AudioShield</span>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#" className="hover:text-purple-500 transition-colors">功能特点</a>
            <a href="#" className="hover:text-purple-500 transition-colors">工作原理</a>
            <a href="#" className="hover:text-purple-500 transition-colors">示例</a>
            <a href="#" className="hover:text-purple-500 transition-colors">定价</a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-purple-500 transition-colors whitespace-nowrap !rounded-button">登录</button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors whitespace-nowrap !rounded-button">开始使用</button>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="pt-32 pb-20 relative min-h-screen" style={{
        backgroundImage: `url('https://ai-public.mastergo.com/ai/img_res/7581b51feedf08bad37edc9fdd64bd6e.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-black/70"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6">
              让你的音频
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"> 不可被学习</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              上传你的音频文件，我们的 AI 将添加保护性噪音模式，使其在保持人耳可辨识的同时，有效防止 AI 训练学习。
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* 上传区域 */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center mb-8 hover:border-purple-500 transition-colors">
              <i className="fas fa-cloud-upload-alt text-4xl text-purple-500 mb-4"></i>
              <div className="text-xl mb-2">拖拽上传音频文件</div>
              <div className="text-gray-400 mb-2">或点击浏览</div>
              <div className="text-sm text-gray-500">支持 MP3、WAV、OGG、FLAC 格式</div>
            </div>

            {/* 控制面板 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">噪音类型</label>
                <button className="w-full px-4 py-3 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors !rounded-button">
                  <span>组合噪音</span>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">噪音强度: {noiseValue}</label>
                </div>
                <input
                  type="range"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={noiseValue}
                  onChange={(e) => setNoiseValue(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-sm text-gray-400 mt-2">
                  较低的值使噪音更不易察觉，较高的值提供更强的保护
                </p>
              </div>

              <div className="flex space-x-4">
                <button className="flex-1 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 !rounded-button">
                  <i className="fas fa-upload"></i>
                  <span>上传音频</span>
                </button>
                <button className="flex-1 px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 !rounded-button">
                  <i className="fas fa-headphones"></i>
                  <span>试听示例</span>
                </button>
              </div>
            </div>
          </div>

          {/* 音频波形图 */}
          <div className="mt-20">
            <div ref={audioWaveRef} className="w-full h-32"></div>
          </div>
        </div>

        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 transform -rotate-12">
            <i className="fas fa-music text-4xl text-purple-500/20"></i>
          </div>
          <div className="absolute top-1/3 right-1/4 transform rotate-45">
            <i className="fas fa-note-musical text-3xl text-pink-500/20"></i>
          </div>
          <div className="absolute bottom-1/4 left-1/3 transform -rotate-90">
            <i className="fas fa-music text-5xl text-purple-600/20"></i>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
