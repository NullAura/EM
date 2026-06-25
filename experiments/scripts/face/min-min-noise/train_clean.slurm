#!/bin/bash
#SBATCH --nodes 1
#SBATCH --job-name="WebFace-Clean"
#SBATCH --output=slurm-%A-%x.out
#SBATCH --account="punim0784"
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time 168:00:00
#SBATCH --mail-type=ALL
#SBATCH --mail-user=pineappleorcas@gmail.com

# check that the script is launched with sbatch
if [ "x$SLURM_JOB_ID" == "x" ]; then
   echo "You need to submit your job to the queuing system with sbatch"
   exit 1
fi

# Training Setting
model_name=$1
scripts_path=$2

# Run the job from this directory:

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
