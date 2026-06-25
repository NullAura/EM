#!/bin/bash

# Load EXP Setting
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${REPO_ROOT:-$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || pwd)}"
if [ -n "${scripts_path:-}" ]; then
    case "$scripts_path" in
        /*) script_dir="$scripts_path" ;;
        *) script_dir="$repo_root/$scripts_path" ;;
    esac
fi
export PYTHONPATH="$repo_root:${PYTHONPATH:-}"
cd "$script_dir"
source exp_setting.sh


# Training Setting
model_name=$1
poison_rate=1.0
exp_name=${exp_path}/poison_train_${poison_rate}
echo $exp_name

# Poison Training
cd "$repo_root"
rm -rf ${exp_name}/${model_name}
python3 -u -m ml.main    --version                 $model_name                 \
                      --exp_name                experiments/cifar101_transfer \
                      --config_path          experiments/configs/cifar101            \
                      --train_data_type         PoisonCIFAR101              \
                      --test_data_type          PoisonCIFAR101              \
                      --poison_rate             $poison_rate                \
                      --perturb_type            $perturb_type               \
                      --perturb_tensor_filepath ${exp_path}/perturbation.pt \
                      --train
