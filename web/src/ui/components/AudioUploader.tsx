import React, { useEffect, useState } from 'react';
import AnimatedContent from '../../AnimatedContent';

interface AudioUploaderProps {
  showUpload: boolean;
  onClose: () => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ showUpload, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedAudio, setProcessedAudio] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 音频处理参数
  const [noiseType, setNoiseType] = useState<string>('both');
  const [noiseAmplitude, setNoiseAmplitude] = useState<number>(0.001);
  const [ultrasonicFreq, setUltrasonicFreq] = useState<number>(20000);

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
      const response = await fetch('/api/process-audio', {
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

  return (
    showUpload ? (
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
                      download={selectedFile.name.replace(/\.[^/.]+$/, '') + '_protected.wav'}
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
    ) : null
  );
};

export default AudioUploader;
