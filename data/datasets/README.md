# Dataset Storage

Large datasets are kept out of Git. The default GTZAN layout is:

```text
data/datasets/
└── gtzan/
    ├── raw/
    │   └── genres_original/
    │       ├── blues/
    │       ├── classical/
    │       └── ...
    └── metadata/
        └── audio_dataset.csv
```

`ml/train.py` reads `data/datasets/gtzan/raw/genres_original` by default. Override it with `GTZAN_AUDIO_DIR` when needed.
