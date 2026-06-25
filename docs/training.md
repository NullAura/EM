# 训练与验证流程

本项目的机器学习验证重点不是让单个上传音频“听起来变化明显”，而是观察受保护训练集对模型学习行为的影响。

## 基本流程

```text
原始音频
  -> Mel 频谱图
  -> 图像张量
  -> 分类模型训练
  -> 样本级 EM 扰动生成
  -> 受保护训练集
  -> 重新训练
  -> 在干净测试集上评估准确率
```

## GTZAN 分类训练

`ml/train.py` 用于 GTZAN 音频分类的基础训练验证：

```bash
SWANLAB_MODE=offline \
RESNET18_WEIGHTS=none \
TRAIN_EPOCHS=1 \
TRAIN_RESIZE=32 \
TRAIN_BATCH_SIZE=16 \
python -m ml.train
```

该脚本默认读取 `data/datasets/gtzan/raw/genres_original`，生成 `data/datasets/gtzan/metadata/audio_dataset.csv`，再把音频转换为 Mel 频谱图输入 ResNet18。

## EM 扰动验证

`ml/perturbation.py` 负责生成扰动，`ml/main.py` 负责用干净或受保护数据重新训练模型。验证成功通常看两组对比：

- 干净训练集训练后，模型在干净测试集上能明显高于随机猜测。
- 受保护训练集训练后，模型在干净测试集上的泛化准确率下降。

10 类设置来自 GTZAN 的 10 个音乐风格类别，与 CIFAR-10 的类别数量相同，因此可以复用一部分原始 EM/CIFAR 实验代码结构。

示例命令：

```bash
python -m ml.perturbation --config_path experiments/configs/cifar10
python -m ml.main --config_path experiments/configs/cifar10
```
