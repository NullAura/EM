import React, { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  processedAudio: string | null;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ processedAudio }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

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
  }, [processedAudio]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
    />
  );
};

export default WaveformCanvas; 