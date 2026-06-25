#!/bin/bash

# Load Exp Settings
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


# Remove previous files
exp_name=${exp_path}/search_noise
echo $exp_name

# Search Universal Perturbation and build datasets
cd "$repo_root"
# rm -rf $exp_name
pwd
python3 -m ml.perturbation --config_path             $config_path       \
                        --exp_name                $exp_name          \
                        --version                 $base_version      \
                        --train_data_type         WebFace            \
                        --test_data_type          WebFace            \
                        --train_data_path         /home/lemonbear/DriveN/data/face-search      \
                        --test_data_path          /home/lemonbear/DriveN/data/face-search      \
                        --noise_shape             150 3 112 112      \
                        --epsilon                 $epsilon           \
                        --num_steps               $num_steps         \
                        --step_size               $step_size         \
                        --attack_type             $attack_type       \
                        --perturb_type            $perturb_type      \
                        --train_step              $train_step        \
                        --train_batch_size        32                 \
                        --eval_batch_size         32                 \
                        --universal_train_target  $universal_train_target\
                        --universal_stop_error    $universal_stop_error\
