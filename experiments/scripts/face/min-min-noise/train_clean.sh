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
exp_name=${exp_path}/clean_train
echo $exp_name

cd "$repo_root"
rm -rf ${exp_name}/${model_name}
python3 -u -m ml.main    --version                 $model_name                 \
                      --exp_name                $exp_name                   \
                      --config_path             $config_path                \
                      --train_data_path         $dataset_path               \
                      --test_data_path          $test_dataset_path          \
                      --train_data_type         $dataset_type               \
                      --test_data_type          $dataset_type               \
                      --train_batch_size        512                         \
                      --eval_batch_size         512                         \
                      --train --train_face --data_parallel
