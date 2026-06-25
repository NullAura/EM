# 项目结构说明

```text
EM/
├── ml/                         # 机器学习与不可学习样本实验核心
│   ├── train.py                # GTZAN 音频分类训练入口
│   ├── perturbation.py         # EM 扰动生成与样本保护实验入口
│   ├── main.py                 # 使用干净/受保护数据训练并评估
│   ├── dataset.py              # CIFAR、GTZAN 预处理结果等数据加载逻辑
│   ├── toolbox.py              # min-min / min-max 扰动优化工具
│   ├── trainer.py              # 训练循环封装
│   ├── evaluator.py            # 测试集与鲁棒性评估逻辑
│   ├── madrys.py               # PGD 对抗训练相关逻辑
│   ├── util.py                 # 模型保存、加载、mixup/cutmix 等工具函数
│   ├── audio_protection.py     # 上传音频的简化扰动处理工具
│   └── models/                 # ResNet、DenseNet、ToyModel 等分类模型
├── backend/api/                # Flask 后端接口
│   ├── server.py               # 当前部署使用的 API 服务
│   ├── func.py                 # 后端调用的音频扰动函数
│   ├── api.py                  # 旧版音频处理接口
│   ├── listen.py               # Scene/麦克风模式相关实验脚本
│   └── check_server.py         # API 连通性检查脚本
├── web/                        # React 前端
│   ├── src/                    # 页面、组件和前端 API 调用
│   └── package.json            # 前端依赖与构建脚本
├── notebooks/                  # 课程演示和快速验证 notebook
│   ├── QuickStart.ipynb        # 原始快速实验流程
│   └── QSforgtzan.ipynb        # GTZAN 音频任务流程
├── experiments/                # 机器学习实验配置与命令脚本
│   ├── configs/                # mlconfig 训练配置
│   └── scripts/                # 命令行实验脚本
├── data/                       # 数据集与预处理结果
│   └── processed/              # GTZAN 频谱图等已生成数据
├── outputs/                    # 训练输出、实验结果和接口临时文件
├── third_party/                # 第三方实验代码
│   └── fast_autoaugment/       # 原 FastAutoAugment 依赖代码
├── deploy/                     # 部署入口
├── docs/                       # 结构、训练、部署说明
└── archive/legacy-next-demo/   # 归档的旧 Next.js demo 源码
```

强规范化后，根目录只保留项目级文件和一级功能目录；旧版 `train.py`、`main.py`、`models/`、`fast_autoaugment/`、`configs/`、`scripts/` 等根目录入口已经移除或迁移。新代码应直接引用 `ml.*`、`backend.*`、`web/`、`deploy/` 等明确模块。
