import React from 'react';
import AnimatedContent from '../../AnimatedContent';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  label?: string;
  showToggle: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  isOn, 
  onToggle, 
  label = "实时模拟", 
  showToggle,
  isLoading = false,
  error = null
}) => {
  if (!showToggle) return null;

  return (
    <div className="absolute left-1/2 top-[50%] transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
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
        <div className="bg-black/70 backdrop-blur-lg p-6 rounded-xl border border-purple-600/50 shadow-lg shadow-purple-600/30 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            {label}
          </h3>
          
          <div className="flex items-center">
            <span className={`mr-2 text-sm ${!isOn ? 'text-purple-400' : 'text-gray-400'}`}>关闭</span>
            {isLoading ? (
              <div className="inline-block w-14 h-8 bg-gray-600/40 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <button 
                onClick={onToggle}
                className="relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none"
                style={{ backgroundColor: isOn ? 'rgba(147, 51, 234, 0.8)' : 'rgba(75, 85, 99, 0.4)' }}
                disabled={isLoading}
              >
                <span 
                  className="inline-block w-6 h-6 transform rounded-full bg-white shadow-lg transition-transform duration-300"
                  style={{ transform: isOn ? 'translateX(24px)' : 'translateX(4px)' }}
                />
              </button>
            )}
            <span className={`ml-2 text-sm ${isOn ? 'text-purple-400' : 'text-gray-400'}`}>开启</span>
          </div>
          
          {error && (
            <div className="mt-3 text-red-400 text-xs p-2 bg-red-900/30 rounded-lg w-full">
              {error}
            </div>
          )}
          
          <p className="mt-4 text-xs text-gray-300 max-w-xs text-center">
            {isOn 
              ? "实时麦克风采集和噪声保护已开启。您现在可以听到添加噪声后的音频效果。" 
              : "开启后将实时模拟音频保护效果，可直接收听结果"}
          </p>
        </div>
      </AnimatedContent>
    </div>
  );
};

export default ToggleSwitch; 