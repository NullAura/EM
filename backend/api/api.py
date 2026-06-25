from flask import Flask, request, send_file, jsonify
from flask_cors import CORS  # 确保已安装: pip install flask-cors
import os
import tempfile
import uuid
import logging
from pathlib import Path

try:
    from .func import process_audio_with_noise
except ImportError:
    from func import process_audio_with_noise

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 设置允许所有源的请求

# 创建临时文件夹用于存储处理中的文件
REPO_ROOT = Path(__file__).resolve().parents[2]
TEMP_FOLDER = REPO_ROOT / "outputs" / "temp_files" / "api"
TEMP_FOLDER.mkdir(parents=True, exist_ok=True)

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    try:
        logger.info("收到处理音频请求")
        
        # 检查文件是否存在
        if 'audio' not in request.files:
            logger.error("没有提供音频文件")
            return jsonify({"error": "没有提供音频文件"}), 400
            
        audio_file = request.files['audio']
        if not audio_file or not audio_file.filename:
            logger.error("文件名为空")
            return jsonify({"error": "文件名为空"}), 400
        
        # 获取请求中的处理参数
        ultrasonic_freq = int(request.form.get('ultrasonic_freq', 20000))
        amplitude = float(request.form.get('amplitude', 0.001))
        noise_type = request.form.get('noise_type', 'both')
        
        logger.info(f"处理音频: {audio_file.filename}, 参数: freq={ultrasonic_freq}, amp={amplitude}, type={noise_type}")
        
        # 创建唯一的临时文件名
        input_filename = f"input_{uuid.uuid4()}{os.path.splitext(audio_file.filename)[1]}"
        output_filename = f"output_{uuid.uuid4()}{os.path.splitext(audio_file.filename)[1]}"
        
        input_path = str(TEMP_FOLDER / input_filename)
        output_path = str(TEMP_FOLDER / output_filename)
        
        # 保存上传的文件
        audio_file.save(input_path)
        
        # 处理音频文件
        process_audio_with_noise(
            input_path,
            output_path,
            ultrasonic_min_freq=ultrasonic_freq,
            noise_amplitude=amplitude,
            noise_type=noise_type
        )
        
        # 检查输出文件是否生成
        if not os.path.exists(output_path):
            logger.error("处理后的文件未生成")
            return jsonify({"error": "处理音频失败，输出文件未生成"}), 500
            
        # 返回处理后的文件
        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"protected_{audio_file.filename}"
        )
        
    except Exception as e:
        logger.error(f"处理音频时发生错误: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
    finally:
        # 清理临时文件（实际运行中可能需要定期清理或更复杂的清理策略）
        try:
            if 'input_path' in locals() and os.path.exists(input_path):
                os.remove(input_path)
            # 此处不删除输出文件，因为它正在被send_file使用
        except Exception as e:
            logger.warning(f"清理临时文件失败: {str(e)}")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)  # 确保端口为5002
