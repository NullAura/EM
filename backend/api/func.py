import librosa
import numpy as np
import soundfile as sf
import os
from scipy import signal
import torch

class AudioPerturbation:
    def __init__(self, ultrasonic_min_freq=20000, noise_amplitude=0.001):
        """
        初始化音频扰动工具
        
        Args:
            
            noise_amplitude: 噪声振幅,默认0.001(使人耳不可察觉）
        """
        self.ultrasonic_min_freq = ultrasonic_min_freq
        self.noise_amplitude = noise_amplitude
        
        # 根据QSforgtzan设置扰动参数
        self.epsilon = 0.03137254901960784 * 0.1
        self.num_steps = 20
        self.step_size = 0.0031372549019607846 * 0.1

    def generate_min_min_noise(self, audio, sr, num_steps=20):
        """
        Generate em noise（base on QSforgtzan的min-min method）
        
        Args:
            audio: Audio data
            sr: Sampling rate
            num_steps: Optimize steps
            
        Returns:
            Error minimization noise
        """
       
        audio_tensor = torch.FloatTensor(audio).unsqueeze(0)  # 添加batch维度
        
        # 初始化随机噪声
        noise = torch.zeros_like(audio_tensor)
        noise = noise.uniform_(-self.epsilon, self.epsilon)
        
        # 模拟min-min优化过程
        for _ in range(num_steps):
            # 生成梯度噪声模式（这里简化处理，使用随机梯度方向）
            gradient = torch.randn_like(noise)
            gradient = gradient / gradient.norm() * self.step_size
            
            # 反向更新噪声（min-min是减去梯度）
            noise = noise - gradient
            
            # 裁剪噪声到epsilon范围内
            noise = torch.clamp(noise, -self.epsilon, self.epsilon)
        
        return noise.numpy().squeeze()

    def add_ultrasonic_noise(self, audio, sr):
        """
        向音频直接添加超声波频率的噪声
        
        Args:
            audio: 音频数据
            sr: 采样率
            
        Returns:
            添加噪声后的音频数据
        """
        # 确保采样率是整数
        sr = int(sr)
        
        # 检查采样率是否足够高以支持频率
        nyquist = sr // 2  # 使用整数除法
        if nyquist <= self.ultrasonic_min_freq:
            print(f"警告：采样率 {sr}Hz 不足以支持 {self.ultrasonic_min_freq}Hz 的波频。")
            print(f"采样率至少需要 {self.ultrasonic_min_freq * 2}Hz，将使用较低频率的噪声。")
            ultrasonic_freq = int(nyquist * 0.95)  # 转换为整数
        else:
            # 使用波频率范围
            ultrasonic_freq = int(np.random.uniform(self.ultrasonic_min_freq, nyquist * 0.95))
        
        print(f"生成波噪声频率: {ultrasonic_freq}Hz")
        
        # 生成波噪声信号
        t = np.arange(len(audio)) / sr
        ultrasonic_noise = self.noise_amplitude * np.sin(2 * np.pi * ultrasonic_freq * t)
        
        # 添加额外的高频分量
        for _ in range(3):
            # 在波范围内选择随机频率
            freq = int(np.random.uniform(self.ultrasonic_min_freq, nyquist * 0.95))
            # 生成随机相位
            phase = np.random.uniform(0, 2 * np.pi)
            # 添加到噪声中
            ultrasonic_noise += (self.noise_amplitude * 0.5) * np.sin(2 * np.pi * freq * t + phase)
        
        # 设计一个高通滤波器，只允许指定波频率通过
        normalized_cutoff = float(self.ultrasonic_min_freq) / float(nyquist)  # 确保是浮点数
        b, a = signal.butter(8, normalized_cutoff, 'high')
        
        # 应用滤波器
        ultrasonic_noise = signal.filtfilt(b, a, ultrasonic_noise)
        
        # 将波噪声添加到原始音频
        noised_audio = audio + ultrasonic_noise
        
        # 确保音频值在合理范围内
        noised_audio = np.clip(noised_audio, -1.0, 1.0)
        
        return noised_audio

    def add_min_min_and_ultrasonic_noise(self, audio, sr):
        """
        同时添加错误最小化噪声和超声波噪声
        
        Args:
            audio: 音频数据
            sr: 采样率
            
        Returns:
            添加噪声后的音频数据
        """
        # 生成错误最小化噪声
        min_min_noise = self.generate_min_min_noise(audio, sr)
        
        # 添加错误最小化噪声
        audio_with_min_min = audio + min_min_noise
        audio_with_min_min = np.clip(audio_with_min_min, -1.0, 1.0)
        
        # 添加波噪声
        audio_with_both = self.add_ultrasonic_noise(audio_with_min_min, sr)
        
        return audio_with_both

def process_audio_with_noise(audio_path, output_path, ultrasonic_min_freq=20000, noise_amplitude=0.001, noise_type='both'):
    """
    处理音频，添加噪声，然后保存
    
    Args:
        audio_path: 输入音频文件路径
        output_path: 输出音频文件路径
        noise_amplitude: 噪声振幅,默认0.001(使人耳不可察觉）
        noise_type: 噪声类型，可选'ultrasonic'、'min_min'或'both'
    """
    # 确保参数是正确的类型
    ultrasonic_min_freq = int(ultrasonic_min_freq)
    noise_amplitude = float(noise_amplitude)
    
    perturbation = AudioPerturbation(
        ultrasonic_min_freq=ultrasonic_min_freq,
        noise_amplitude=noise_amplitude
    )
    
    # 加载音频
    print(f"加载音频文件: {audio_path}")
    y, sr = librosa.load(audio_path, sr=None)  # 使用文件的原始采样率
    sr = int(sr)  # 确保采样率是整数
    
    # 检查采样率
    if noise_type in ['ultrasonic', 'both'] and sr < ultrasonic_min_freq * 2:
        print(f"警告：原始采样率 {sr}Hz 不足以表示 {ultrasonic_min_freq}Hz 的波")
        print(f"重新以更高采样率加载音频...")
        # 使用更高的采样率重新加载
        new_sr = int(max(ultrasonic_min_freq * 2.5, 44100))  
        y, sr = librosa.load(audio_path, sr=new_sr)
        sr = int(sr)  # 确保是整数
    
    # 根据噪声类型添加不同噪声
    if noise_type == 'ultrasonic':
        print(f"添加声波频率噪声 (>{ultrasonic_min_freq}Hz)...")
        y_with_noise = perturbation.add_ultrasonic_noise(y, sr)
    elif noise_type == 'min_min':
        print("添加错误最小化噪声...")
        min_min_noise = perturbation.generate_min_min_noise(y, sr)
        y_with_noise = y + min_min_noise
        y_with_noise = np.clip(y_with_noise, -1.0, 1.0)
    else:  # 'both'
        print(f"同时添加错误最小化噪声和超声波噪声...")
        y_with_noise = perturbation.add_min_min_and_ultrasonic_noise(y, sr)
    
    # 保存音频
    print(f"保存处理后的音频到: {output_path}")
    sf.write(output_path, y_with_noise, sr)
    
    print("完成！")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="给音频添加不可察觉噪声")
    parser.add_argument("input_audio", help="输入音频文件路径")
    parser.add_argument("output_audio", help="输出音频文件路径")
    parser.add_argument("--ultrasonic_freq", type=int, default=20000, help="声波默认频率高")
    parser.add_argument("--amplitude", type=float, default=0.001, help="噪声振幅,默认为0.001(降低为原来的1/10,使人耳不可察觉）")
    parser.add_argument("--noise_type", type=str, default="both", choices=["ultrasonic", "min_min", "both"], 
                        help="噪声类型：超声波(ultrasonic)、错误最小化(min_min)或两者都有(both)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_audio):
        print(f"错误：输入文件 {args.input_audio} 不存在！")
        exit(1)
    
    # 确保输出目录存在
    output_dir = os.path.dirname(args.output_audio)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 处理音频
    process_audio_with_noise(
        args.input_audio, 
        args.output_audio, 
        ultrasonic_min_freq=args.ultrasonic_freq, 
        noise_amplitude=args.amplitude,
        noise_type=args.noise_type
    )

