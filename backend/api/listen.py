#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pyaudio
import numpy as np
import soundfile as sf
import sounddevice as sd
import tempfile
import os
import time

try:
    from .func import AudioPerturbation
except ImportError:
    from func import AudioPerturbation

class MicrophoneHandler:
    def __init__(self, 
                 chunk_size=1024, 
                 format=pyaudio.paFloat32,
                 channels=1, 
                 rate=48000, 
                 record_seconds=5,
                 ultrasonic_min_freq=20000,
                 noise_amplitude=0.001,
                 noise_type='both'):
        self.chunk_size = chunk_size
        self.format = format
        self.channels = channels
        self.rate = rate
        self.record_seconds = record_seconds
        self.ultrasonic_min_freq = ultrasonic_min_freq
        self.noise_amplitude = noise_amplitude
        self.noise_type = noise_type
        
        # 初始化PyAudio
        self.audio = pyaudio.PyAudio()
        
        # 创建音频处理器
        self.perturbation = AudioPerturbation(
            ultrasonic_min_freq=ultrasonic_min_freq,
            noise_amplitude=noise_amplitude
        )
        
        self.is_running = False

    def start(self):
        """开始单次录音和处理"""
        self.is_running = True
        
        try:
            print("开始录音...")
            # 录制音频
            audio_data = self._record_audio()
            
            # 创建临时文件
            temp_input_file = tempfile.mktemp(suffix='.wav')
            temp_output_file = tempfile.mktemp(suffix='.wav')
            
            # 保存音频到临时文件
            self._save_audio(audio_data, temp_input_file)
            
            # 处理音频，只获取噪声部分
            self._process_audio_noise_only(temp_input_file, temp_output_file)
            
            # 播放噪声
            self._play_audio(temp_output_file)
            
            # 清理临时文件
            try:
                os.remove(temp_input_file)
                os.remove(temp_output_file)
            except:
                pass
                
        except Exception as e:
            print(f"处理过程出错: {e}")
        finally:
            self.stop()

    def _record_audio(self):
        """录制音频并返回音频数据"""
        stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        
        frames = []
        print(f"录音 {self.record_seconds} 秒...")
        
        for i in range(0, int(self.rate / self.chunk_size * self.record_seconds)):
            data = stream.read(self.chunk_size)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        # 将音频数据转换为numpy数组
        audio_data = np.frombuffer(b''.join(frames), dtype=np.float32)
        return audio_data

    def _save_audio(self, audio_data, filename):
        """保存音频数据到文件"""
        sf.write(filename, audio_data, self.rate)

    def _process_audio_noise_only(self, input_file, output_file):
        """处理音频文件，只提取噪声部分"""
        print("处理音频，生成纯噪声...")
        
        # 加载音频
        y, sr = sf.read(input_file)
        
        # 生成纯噪声，而不是叠加在原始音频上
        if self.noise_type == 'ultrasonic':
            # 生成与原始音频长度相同的零数组
            silent_audio = np.zeros_like(y)
            # 只添加超声波噪声
            noise = self.perturbation.add_ultrasonic_noise(silent_audio, sr) - silent_audio
        elif self.noise_type == 'min_min':
            # 只生成错误最小化噪声
            noise = self.perturbation.generate_min_min_noise(y, sr)
        else:  # 'both'
            # 生成与原始音频长度相同的零数组
            silent_audio = np.zeros_like(y)
            # 添加超声波噪声
            ultrasonic_noise = self.perturbation.add_ultrasonic_noise(silent_audio, sr) - silent_audio
            # 添加错误最小化噪声
            min_min_noise = self.perturbation.generate_min_min_noise(y, sr)
            # 合并两种噪声
            noise = ultrasonic_noise + min_min_noise
        
        # 保存噪声到文件
        sf.write(output_file, noise, sr)

    def _play_audio(self, filename):
        """播放处理后的音频文件"""
        print("播放噪声音频...")
        
        # 加载音频
        data, fs = sf.read(filename)
        
        # 阻塞播放（等待播放完成）
        sd.play(data, fs)
        sd.wait()  # 等待播放完成
    
    def stop(self):
        """停止所有操作"""
        self.is_running = False
        
        # 停止播放
        sd.stop()
        
        # 清理 PyAudio
        self.audio.terminate()
        
        print("录音和播放已停止")

def main():
    """主函数"""
    print("初始化麦克风处理...")
    
    handler = MicrophoneHandler(
        rate=48000,  # 使用更高的采样率以支持超声波频率
        record_seconds=5,
        ultrasonic_min_freq=20000,
        noise_amplitude=0.005,  # 增大噪声振幅使其更明显
        noise_type='both'
    )
    
    print("开始麦克风监听和处理...")
    handler.start()

if __name__ == "__main__":
    main()
