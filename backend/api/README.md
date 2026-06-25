# 后端 API 使用说明

该目录保存 Flask 后端接口，用于课程演示中的音频上传、扰动处理和 Scene 模式状态管理。

## 功能概述

- 接收前端上传的音频文件
- 调用音频扰动函数生成受保护音频
- 返回处理后的音频文件
- 保存 Scene 模式的启动、停止和参数状态

## 所需依赖

- Python 3.10+
- Flask
- Flask-CORS
- SoundFile
- NumPy
- Librosa
- Torch

## 启动后端服务

安装必要依赖：

```bash
pip install flask flask-cors librosa numpy soundfile torch
```

只运行后端 API：

```bash
cd backend/api
python server.py
```

或使用脚本：

```bash
cd backend/api
chmod +x run_server.sh
./run_server.sh
```

服务器默认在 `http://localhost:5001` 上运行。

课程演示推荐使用仓库根目录的一体化入口，它会同时挂载 `web/build` 前端页面和后端 API：

```bash
python deploy/run_frontend_api_5001.py
```

## 使用说明

### API端点

#### 音频处理

- URL: `POST /api/process-audio`
- 表单字段:
```text
audio: 音频文件
ultrasonic_freq: 高频噪声下限，默认 20000
amplitude: 噪声幅度，默认 0.001
noise_type: ultrasonic / min_min / both
```

#### 启动Scene模式

- URL: `POST /api/scene/start`
- 请求体:
```json
{
  "noiseType": "both",
  "noiseAmplitude": 0.005,
  "ultrasonicFreq": 20000
}
```
- 响应:
```json
{
  "status": "success",
  "message": "Scene模式已启动",
  "config": {
    "noiseType": "both",
    "noiseAmplitude": 0.005,
    "ultrasonicFreq": 20000
  }
}
```

#### 停止Scene模式

- URL: `POST /api/scene/stop`
- 响应:
```json
{
  "status": "success",
  "message": "Scene模式已停止"
}
```

#### 获取Scene状态

- URL: `GET /api/scene/status`
- 响应:
```json
{
  "running": true
}
```

## 故障排除

1. **麦克风权限问题**: 确保你的浏览器授予了麦克风访问权限。
2. **端口冲突**: 如果5001端口被占用，请在server.py中修改端口号。
3. **依赖问题**: 在一些系统上，PyAudio和SoundDevice可能需要额外的系统依赖。请参考这些库的官方文档。

## 安全注意事项

在生产环境中，你应该：

1. 添加适当的认证和授权机制
2. 使用HTTPS而不是HTTP
3. 考虑麦克风数据的隐私问题
