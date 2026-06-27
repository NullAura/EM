# 基于音频不可学习的隐私保护

本项目面向机器学习课程实践，复现并改造 Error-Minimizing Noise / Unlearnable Examples 思路，将音频样本转换为模型难以有效学习的受保护样本。项目重点是理解不可学习样本的生成机制、构造音频分类实验流程，并通过训练对比验证干扰是否有效。

## 项目目标

常规音频分类模型会从训练音频中学习到稳定的类别特征。隐私保护的目标不是提升分类准确率，而是在尽量保持音频可用性的前提下，为样本加入针对学习过程设计的扰动，使模型更容易拟合扰动诱导的捷径，从而降低其对真实音频语义特征的泛化学习能力。

## 核心原理

Error-Minimizing 方法为训练样本维护样本级扰动。训练过程中交替进行两类优化：

1. 使用当前带噪样本训练基础模型，使模型适应当前扰动。
2. 固定模型参数，更新样本级扰动，使模型在带噪训练样本上的损失进一步降低。

这种扰动会让模型在训练阶段快速拟合受保护样本，但拟合目标会偏向扰动模式，而不是稳定的类别特征。验证时，如果模型在干净数据上可以正常学习，但在受保护数据上训练后对干净测试集的准确率明显下降，就说明不可学习干扰起到了作用。

## 技术路线

```text
原始音频
  -> Mel 频谱图
  -> 图像张量
  -> ResNet18 分类模型
  -> 样本级 EM 噪声
  -> 受保护训练集
  -> 重新训练并评估 Clean Accuracy
```

## 前端演示

前端提供音频上传、保护类型选择和处理结果下载入口，用于展示音频保护流程。实验结论仍以离线训练与 Clean Accuracy 对比为依据，前端主要承担演示和交互封装。

![前端首页](docs/assets/frontend-home.png)

![音频上传界面](docs/assets/frontend-upload.png)

前端请求统一使用同源 `/api` 路由，部署时由 Flask 服务同时提供静态页面和后端接口，避免固定端口导致的跨域或网络访问问题。

## 数据与任务

当前训练流程使用 GTZAN 音乐数据集。该数据集包含 10 类音乐风格，项目会将音频转换为 Mel 频谱图，再送入图像分类模型。10 类设置来自 GTZAN 的类别数量，也便于复用原 EM 实验中接近 CIFAR-10 的训练配置。

数据处理后的典型结构：

```text
images: [batch_size, 3, 32, 32] 或 [batch_size, 3, resize, resize]
labels: [batch_size]
logits: [batch_size, num_classes]
noise:  [num_samples, 3, 32, 32]
```

## 目录结构

```text
EM/
├── ml/                         # 机器学习与不可学习样本实验核心
│   ├── train.py                # GTZAN 音频分类训练入口
│   ├── perturbation.py         # EM 扰动生成与样本保护实验入口
│   ├── main.py                 # 使用干净/受保护数据训练并评估
│   ├── dataset.py              # 数据集加载与预处理逻辑
│   ├── toolbox.py              # min-min / min-max 扰动优化工具
│   ├── trainer.py              # 训练循环封装
│   ├── evaluator.py            # 测试集与鲁棒性评估逻辑
│   ├── util.py                 # 模型保存、加载和训练辅助函数
│   └── models/                 # ResNet、DenseNet、ToyModel 等模型
├── backend/api/                # Flask 后端接口
│   ├── server.py               # 当前部署使用的 API 服务
│   ├── func.py                 # 后端音频扰动处理函数
│   └── check_server.py         # API 连通性检查脚本
├── web/                        # React 前端演示页面
├── notebooks/                  # 课程演示和快速验证 notebook
├── experiments/                # 机器学习实验配置与命令脚本
│   ├── configs/                # mlconfig 训练配置
│   └── scripts/                # 命令行实验脚本
├── data/                       # 数据集与预处理结果
│   ├── datasets/               # 原始数据集与数据集元信息，不提交真实数据文件
│   └── processed/              # 已生成的频谱图、二进制数据等
├── outputs/                    # 训练输出、临时文件和实验结果
├── third_party/                # 第三方实验代码
├── deploy/                     # 部署入口
├── docs/                       # 结构、训练、部署说明与 README 图片资源
└── archive/legacy-next-demo/   # 归档的旧前端 demo 源码
```

根目录不再保留旧版兼容入口。训练、扰动、模型、后端、前端和部署脚本都从各自目录直接运行。

## 运行方式

### 一体化前后端部署

```bash
cd /root/EM
/root/EM/.venv/bin/python deploy/run_frontend_api_5001.py
```

访问：

```text
http://服务器地址:5001/
```

### 训练快速验证

```bash
SWANLAB_MODE=offline \
RESNET18_WEIGHTS=none \
TRAIN_EPOCHS=1 \
TRAIN_RESIZE=32 \
TRAIN_BATCH_SIZE=16 \
python -m ml.train
```

GTZAN 原始音频默认放在 `data/datasets/gtzan/raw/genres_original`，训练索引默认生成到 `data/datasets/gtzan/metadata/audio_dataset.csv`。

## 验证标准

本项目的关键验证不是单次上传音频是否“听起来变化明显”，而是模型训练行为是否发生变化。推荐从以下角度说明：

- 干净数据训练时，模型准确率应明显高于随机猜测。
- 受保护数据训练时，模型在干净测试集上的泛化表现应下降。
- 噪声生成过程应保持样本级扰动结构。
- 前端上传功能用于展示保护入口，实验结论应以训练对比结果为依据。

## 更多说明

- 项目结构说明见 `docs/architecture.md`。
- 训练与验证流程见 `docs/training.md`。
- 服务器部署说明见 `docs/deployment.md`。
