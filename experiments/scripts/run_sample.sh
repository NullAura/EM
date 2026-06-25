#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${REPO_ROOT:-$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || pwd)}"
export PYTHONPATH="$repo_root:${PYTHONPATH:-}"
cd "$repo_root"

python3 -m ml.perturbation --config_path          experiments/configs/cifar10                \
                        --exp_name                samplewise_exp \
                        --version                 resnet18                       \
                        --train_data_type         CIFAR10                       \
                        --noise_shape             50000 3 32 32                  \
                        --epsilon                 8                              \
                        --num_steps               20                             \
                        --step_size               0.8                            \
                        --attack_type             min-min                        \
                        --perturb_type            samplewise                      \
                        --universal_stop_error    0.01


python3 -u -m ml.main --version                 resnet18                       \
                      --exp_name                samplewise_exp \
                      --config_path          experiments/configs/cifar10                \
                      --train_data_type         PoisonCIFAR10                  \
                      --poison_rate             1.0                            \
                      --perturb_type            samplewise                      \
                      --perturb_tensor_filepath samplewise_exp/perturbation.pt \
                      --train
