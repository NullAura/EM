# 部署说明

当前服务器演示使用一体化 Flask 入口，5001 端口同时提供前端静态页面和后端 API。

## 启动

```bash
cd /root/EM
/root/EM/.venv/bin/python deploy/run_frontend_api_5001.py
```

## 依赖

基础依赖：

```bash
/root/EM/.venv/bin/python -m pip install -r requirements.txt
```

如果服务器是 CPU 环境，并且 `torchvision` 或 `torchaudio` 出现 CUDA 动态库错误，可以使用 PyTorch CPU wheel 源重装这两个包：

```bash
/root/EM/.venv/bin/python -m pip uninstall -y torchvision torchaudio
/root/EM/.venv/bin/python -m pip install --no-deps --index-url https://download.pytorch.org/whl/cpu torchvision torchaudio
/root/EM/.venv/bin/python -m pip install pillow
```

## 访问

```text
http://服务器地址:5001/
```

## 健康检查

```bash
curl http://127.0.0.1:5001/api/check
```

预期返回：

```json
{"server":"scene-server","status":"online","version":"1.0.0"}
```

## 目录关系

- `deploy/run_frontend_api_5001.py` 是真实部署入口。
- 后端 API 位于 `backend/api/server.py`。
- 前端构建产物位于 `web/build`，需要先在 `web/` 下执行构建命令生成。
- 接口运行临时文件位于 `outputs/temp_files/`。
