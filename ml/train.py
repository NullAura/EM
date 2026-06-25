import os
from pathlib import Path

import pandas as pd
import soundfile as sf
import swanlab
import torch
import torch.nn as nn
import torch.optim as optim
import torchaudio
import torchvision.models as models
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset


DEFAULT_DATASET_ROOT = Path("data/datasets")
DEFAULT_GTZAN_AUDIO_DIR = DEFAULT_DATASET_ROOT / "gtzan" / "raw" / "genres_original"
DEFAULT_GTZAN_METADATA_CSV = DEFAULT_DATASET_ROOT / "gtzan" / "metadata" / "audio_dataset.csv"
SUPPORTED_AUDIO_EXTENSIONS = {".aif", ".aiff", ".au", ".flac", ".mp3", ".wav"}


def load_audio(audio_path: str | Path):
    try:
        return torchaudio.load(str(audio_path))
    except ImportError:
        audio, sample_rate = sf.read(str(audio_path), always_2d=True, dtype="float32")
        waveform = torch.from_numpy(audio.T)
        return waveform, sample_rate


def create_dataset_csv(data_dir: str | Path, output_csv: str | Path):
    data_dir = Path(data_dir)
    output_csv = Path(output_csv)
    data = []

    if not data_dir.exists():
        raise FileNotFoundError(
            f"GTZAN audio directory not found: {data_dir}. "
            "Set GTZAN_AUDIO_DIR or place the dataset under data/datasets/gtzan/raw/genres_original."
        )

    for label in sorted(os.listdir(data_dir)):
        label_dir = data_dir / label
        if label_dir.is_dir():
            for audio_file in sorted(os.listdir(label_dir)):
                if Path(audio_file).suffix.lower() in SUPPORTED_AUDIO_EXTENSIONS:
                    audio_path = label_dir / audio_file
                    data.append([str(audio_path), label])

    df = pd.DataFrame(data, columns=["path", "label"])
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    return df


class AudioDataset(Dataset):
    def __init__(self, df, resize, train_mode=True):
        self.audio_paths = df["path"].values
        self.label_to_idx = {label: idx for idx, label in enumerate(df["label"].unique())}
        self.labels = [self.label_to_idx[label] for label in df["label"].values]
        self.resize = resize
        self.train_mode = train_mode

    def __len__(self):
        return len(self.audio_paths)

    def __getitem__(self, idx):
        waveform, sample_rate = load_audio(self.audio_paths[idx])

        transform = torchaudio.transforms.MelSpectrogram(
            sample_rate=sample_rate,
            n_fft=2048,
            hop_length=640,
            n_mels=128,
        )
        mel_spectrogram = transform(waveform)
        mel_spectrogram = torch.clamp(mel_spectrogram, min=0)
        mel_spectrogram = mel_spectrogram.repeat(3, 1, 1)

        resize = torch.nn.AdaptiveAvgPool2d((self.resize, self.resize))
        mel_spectrogram = resize(mel_spectrogram)

        return mel_spectrogram, self.labels[idx]


class AudioClassifier(nn.Module):
    def __init__(self, num_classes):
        super(AudioClassifier, self).__init__()
        weight_choice = os.environ.get("RESNET18_WEIGHTS", "none").lower()
        if weight_choice in {"imagenet", "imagenet1k_v1", "default", "true", "1"}:
            weights = models.ResNet18_Weights.IMAGENET1K_V1
        else:
            weights = None
        self.resnet = models.resnet18(weights=weights)
        self.resnet.fc = nn.Linear(512, num_classes)

    def forward(self, x):
        return self.resnet(x)


def train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs, device):
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)

            outputs = model(inputs)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

            running_loss += loss.item()

            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        train_loss = running_loss / len(train_loader)
        train_acc = 100.0 * correct / total

        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)

                val_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

        val_loss = val_loss / len(val_loader)
        val_acc = 100.0 * correct / total

        current_lr = optimizer.param_groups[0]["lr"]
        swanlab.log(
            {
                "train/loss": train_loss,
                "train/acc": train_acc,
                "val/loss": val_loss,
                "val/acc": val_acc,
                "train/epoch": epoch,
                "train/lr": current_lr,
            }
        )

        print(f"Epoch {epoch + 1}:")
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        print(f"Learning Rate: {current_lr:.6f}")


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dataset_root = Path(os.environ.get("EM_DATASET_ROOT", DEFAULT_DATASET_ROOT))
    data_dir = Path(
        os.environ.get(
            "GTZAN_AUDIO_DIR",
            dataset_root / "gtzan" / "raw" / "genres_original",
        )
    )
    dataset_csv = Path(
        os.environ.get(
            "AUDIO_DATASET_CSV",
            dataset_root / "gtzan" / "metadata" / "audio_dataset.csv",
        )
    )

    run = swanlab.init(
        project="PyTorch_Audio_Classification-simple",
        experiment_name="resnet18",
        mode=os.environ.get("SWANLAB_MODE", "offline"),
        config={
            "batch_size": int(os.environ.get("TRAIN_BATCH_SIZE", 16)),
            "learning_rate": float(os.environ.get("TRAIN_LR", 1e-4)),
            "num_epochs": int(os.environ.get("TRAIN_EPOCHS", 20)),
            "resize": int(os.environ.get("TRAIN_RESIZE", 224)),
        },
    )

    if not dataset_csv.exists():
        df = create_dataset_csv(data_dir, dataset_csv)
    else:
        df = pd.read_csv(dataset_csv)

    train_df = pd.DataFrame()
    val_df = pd.DataFrame()

    for label in df["label"].unique():
        label_df = df[df["label"] == label]
        label_train, label_val = train_test_split(label_df, test_size=0.2, random_state=42)
        train_df = pd.concat([train_df, label_train])
        val_df = pd.concat([val_df, label_val])

    train_dataset = AudioDataset(train_df, resize=run.config.resize, train_mode=True)
    val_dataset = AudioDataset(val_df, resize=run.config.resize, train_mode=False)

    train_loader = DataLoader(train_dataset, batch_size=run.config.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False)

    num_classes = len(df["label"].unique())
    print("num_classes", num_classes)
    model = AudioClassifier(num_classes).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=run.config.learning_rate)

    train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs=run.config.num_epochs, device=device)


if __name__ == "__main__":
    main()
