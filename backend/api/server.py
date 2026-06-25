#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import logging
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import soundfile as sf
import librosa

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from .func import AudioPerturbation, process_audio_with_noise
except ImportError:
    from func import AudioPerturbation, process_audio_with_noise

app = Flask(__name__)
CORS(app)  # 启用跨域请求支持

# 创建临时文件夹用于存储处理中的文件
REPO_ROOT = Path(__file__).resolve().parents[2]
TEMP_FOLDER = REPO_ROOT / "outputs" / "temp_files" / "api"
TEMP_FOLDER.mkdir(parents=True, exist_ok=True)

# 全局变量，用于存储Scene模式状态
scene_running = False
scene_config = None

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    """处理上传的音频文件"""
    try:
        logger.info("收到处理音频请求")
        
        if 'audio' not in request.files:
            logger.error("没有提供音频文件")
            return jsonify({"error": "没有提供音频文件"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            logger.error("文件名为空")
            return jsonify({"error": "文件名为空"}), 400
        
        # 获取参数
        ultrasonic_freq = int(request.form.get('ultrasonic_freq', 20000))
        amplitude = float(request.form.get('amplitude', 0.001))
        noise_type = request.form.get('noise_type', 'both')
        
        logger.info(f"处理音频: {audio_file.filename}, 参数: freq={ultrasonic_freq}, amp={amplitude}, type={noise_type}")
        
        # 获取原始文件扩展名，但始终使用WAV作为处理格式
        original_ext = os.path.splitext(audio_file.filename)[1].lower()
        base_name = os.path.splitext(audio_file.filename)[0]
        
        # 创建唯一的临时文件名，统一使用WAV格式进行处理
        input_filename = f"input_{base_name}_{os.urandom(4).hex()}.wav"
        output_filename = f"output_{base_name}_{os.urandom(4).hex()}.wav"
        
        input_path = str(TEMP_FOLDER / input_filename)
        output_path = str(TEMP_FOLDER / output_filename)
        
        # 保存上传的文件
        audio_file.save(input_path)
        
        # 处理音频文件
        try:
            # 读取时确保采样率
            y, sr = sf.read(input_path)
            if sr not in [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]:
                # 重采样到44100Hz
                y = librosa.resample(y, orig_sr=sr, target_sr=44100)
                sr = 44100

            process_audio_with_noise(
                input_path,
                output_path,
                ultrasonic_min_freq=ultrasonic_freq,
                noise_amplitude=amplitude,
                noise_type=noise_type
            )
        except Exception as process_error:
            logger.error(f"音频处理函数错误: {str(process_error)}")
            logger.error(f"错误类型: {type(process_error).__name__}")
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
            
            # 清理临时文件
            try:
                if os.path.exists(input_path):
                    os.remove(input_path)
            except:
                pass
            
            return jsonify({"error": f"音频处理失败: {str(process_error)}"}), 500
        
        # 检查输出文件是否生成
        if not os.path.exists(output_path):
            logger.error("处理后的文件未生成")
            # 清理临时文件
            try:
                if os.path.exists(input_path):
                    os.remove(input_path)
            except:
                pass
            return jsonify({"error": "处理音频失败，输出文件未生成"}), 500
        
        logger.info(f"音频处理成功，返回文件: {output_path}")
        
        # 确定下载文件名，保持原始扩展名但确保兼容性
        if original_ext in ['.mp3', '.m4a', '.aac']:
            download_name = f"protected_{base_name}.wav"  # 转换为WAV避免格式问题
        else:
            download_name = f"protected_{audio_file.filename}"
        
        # 返回处理后的文件
        return send_file(
            output_path,
            as_attachment=True,
            download_name=download_name
        )
        
    except Exception as e:
        logger.error(f"处理音频时发生错误: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # 在一个真实的应用中，我们应该实现一个定期清理临时文件的机制
        # 这里为了简单起见，我们不会自动删除文件
        pass

@app.route('/api/scene/start', methods=['POST'])
def start_scene():
    """启动Scene模式（配置存储）"""
    global scene_running, scene_config
    
    try:
        # 获取配置参数
        config = request.json
        if not config:
            return jsonify({'error': '未提供配置参数'}), 400
        
        # 提取参数
        noise_type = config.get('noiseType', 'both')
        noise_amplitude = float(config.get('noiseAmplitude', 0.001))
        ultrasonic_freq = int(config.get('ultrasonicFreq', 20000))
        
        logger.info(f"启动Scene模式: noise_type={noise_type}, amplitude={noise_amplitude}, freq={ultrasonic_freq}")
        
        # 存储配置
        scene_config = {
            'noiseType': noise_type,
            'noiseAmplitude': noise_amplitude,
            'ultrasonicFreq': ultrasonic_freq
        }
        
        scene_running = True
        
        return jsonify({
            'status': 'success',
            'message': 'Scene模式已启动',
            'config': scene_config
        }), 200
        
    except Exception as e:
        logger.error(f"启动Scene模式失败: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Scene模式启动失败'}), 500

@app.route('/api/scene/stop', methods=['POST'])
def stop_scene():
    """停止Scene模式"""
    global scene_running, scene_config
    
    try:
        logger.info("停止Scene模式")
        
        scene_running = False
        scene_config = None
        
        return jsonify({'status': 'success', 'message': 'Scene模式已停止'}), 200
        
    except Exception as e:
        logger.error(f"停止Scene模式失败: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Scene模式停止失败'}), 500

@app.route('/api/scene/status', methods=['GET'])
def get_scene_status():
    """获取Scene模式状态"""
    global scene_running, scene_config
    
    response = {'running': scene_running}
    if scene_config:
        response['config'] = scene_config
    
    return jsonify(response), 200

@app.route('/api/check', methods=['GET'])
def check_server():
    """检查服务器是否在线"""
    return jsonify({'status': 'online', 'server': 'scene-server', 'version': '1.0.0'}), 200

def main():
    """运行Flask应用"""
    port = int(os.environ.get("PORT", "5001"))
    try:
        logger.info(f"启动API服务器，监听端口{port}...")
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
    except Exception as e:
        logger.error(f"启动服务器失败: {str(e)}")
        # 尝试使用备用端口
        try:
            logger.info("尝试使用备用端口5002...")
            app.run(host='0.0.0.0', port=5002, debug=False, threaded=True)
        except Exception as e:
            logger.error(f"使用备用端口启动服务器也失败: {str(e)}")

if __name__ == '__main__':
    main()
