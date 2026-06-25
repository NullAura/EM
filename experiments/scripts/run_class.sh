#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${REPO_ROOT:-$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || pwd)}"
export PYTHONPATH="$repo_root:${PYTHONPATH:-}"
cd "$repo_root"

python3 -m ml.perturbation --config_path          experiments/configs/cifar10                \
                        --exp_name                classwise_exp \
                        --version                 resnet18                       \
                        --train_data_type         CIFAR10                       \
                        --noise_shape             10 3 32 32                     \
                        --epsilon                 8                              \
                        --num_steps               1                              \
                        --step_size               0.8                            \
                        --attack_type             min-min                        \
                        --perturb_type            classwise                      \
                        --universal_train_target  'train_subset'                 \
                        --universal_stop_error    0.1                            \
                        --use_subset



python3 -u -m ml.main --version                 resnet18                       \
                      --exp_name                classwise_exp                  \
                      --config_path          experiments/configs/cifar10                \
                      --train_data_type         PoisonCIFAR10                  \
                      --poison_rate             1.0                            \
                      --perturb_type            classwise                      \
                      --perturb_tensor_filepath classwise_exp/perturbation.pt \
                      --train
