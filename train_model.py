"""
train_model.py
==============
Train the deepfake detection classifier on the FakeAVCeleb_v1.2 dataset.

Usage:
    python train_model.py --data-dir ./FakeAVCeleb_v1.2 --output models/classifier_model.pkl

Dataset layout expected:
    FakeAVCeleb_v1.2/
        RealVideo-RealAudio/   (real speech)
            *.wav / *.mp4
        FakeVideo-RealAudio/   (deepfake)
            *.wav / *.mp4
        FakeVideo-FakeAudio/   (deepfake)
            *.wav / *.mp4

If your layout differs, adjust REAL_DIRS / FAKE_DIRS below.
"""

import os
import sys
import argparse
import pickle
import time
from pathlib import Path

import numpy as np

# ── configurable dirs inside the dataset root ──────────────────────────────
REAL_DIRS = ["RealVideo-RealAudio"]
FAKE_DIRS = ["FakeVideo-FakeAudio", "FakeVideo-RealAudio"]
AUDIO_EXTS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
# ───────────────────────────────────────────────────────────────────────────


def collect_files(root: Path, sub_dirs: list[str]) -> list[Path]:
    files = []
    for sub in sub_dirs:
        d = root / sub
        if not d.exists():
            print(f"  [warn] directory not found: {d}")
            continue
        for f in d.rglob("*"):
            if f.suffix.lower() in AUDIO_EXTS:
                files.append(f)
    return files


def extract_features(file_path: Path, extractor) -> np.ndarray | None:
    try:
        features, _ = extractor.extract(str(file_path))
        return features
    except Exception as e:
        print(f"  [skip] {file_path.name}: {e}")
        return None


def train(data_dir: str, output_path: str, max_per_class: int = 0):
    from feature_extractor import FeatureExtractor
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

    root = Path(data_dir)
    if not root.exists():
        sys.exit(f"[error] Data directory not found: {root}")

    print("=" * 60)
    print("  VoiceGuard — Model Training")
    print("=" * 60)

    extractor = FeatureExtractor()

    # ── collect file lists ─────────────────────────────────────────────────
    real_files = collect_files(root, REAL_DIRS)
    fake_files = collect_files(root, FAKE_DIRS)

    print(f"\nFound {len(real_files)} real files, {len(fake_files)} fake files")

    if max_per_class > 0:
        import random
        random.seed(42)
        real_files = random.sample(real_files, min(max_per_class, len(real_files)))
        fake_files = random.sample(fake_files, min(max_per_class, len(fake_files)))
        print(f"Capped to {len(real_files)} real + {len(fake_files)} fake")

    # ── extract features ───────────────────────────────────────────────────
    X, y = [], []
    t0 = time.time()

    print("\nExtracting features from REAL files...")
    for i, f in enumerate(real_files, 1):
        feat = extract_features(f, extractor)
        if feat is not None:
            X.append(feat)
            y.append(0)
        if i % 50 == 0:
            print(f"  {i}/{len(real_files)} processed ({time.time()-t0:.0f}s elapsed)")

    print("\nExtracting features from FAKE files...")
    for i, f in enumerate(fake_files, 1):
        feat = extract_features(f, extractor)
        if feat is not None:
            X.append(feat)
            y.append(1)
        if i % 50 == 0:
            print(f"  {i}/{len(fake_files)} processed ({time.time()-t0:.0f}s elapsed)")

    if not X:
        sys.exit("[error] No features extracted. Check dataset path and audio files.")

    X = np.array(X, dtype=np.float32)
    y = np.array(y)
    print(f"\nDataset shape: {X.shape}  ({sum(y==0)} real, {sum(y==1)} fake)")

    # ── pad/truncate to fixed feature size ────────────────────────────────
    TARGET_SIZE = 128
    if X.shape[1] < TARGET_SIZE:
        pad = np.zeros((X.shape[0], TARGET_SIZE - X.shape[1]), dtype=np.float32)
        X = np.hstack([X, pad])
    elif X.shape[1] > TARGET_SIZE:
        X = X[:, :TARGET_SIZE]

    # ── split ──────────────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── scale ──────────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # ── train ──────────────────────────────────────────────────────────────
    print("\nTraining RandomForest classifier...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train_s, y_train)

    # ── evaluate ───────────────────────────────────────────────────────────
    y_pred  = clf.predict(X_test_s)
    y_proba = clf.predict_proba(X_test_s)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print(f"\nTest Accuracy : {acc:.4f}  ({acc*100:.1f}%)")
    print(f"ROC-AUC       : {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Real", "Deepfake"]))

    # ── cross-val sanity check ─────────────────────────────────────────────
    cv_scores = cross_val_score(clf, X_train_s, y_train, cv=5, scoring="roc_auc", n_jobs=-1)
    print(f"5-Fold CV AUC : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── save ───────────────────────────────────────────────────────────────
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    with open(out, "wb") as f:
        pickle.dump(clf, f)

    scaler_out = out.parent / "scaler.pkl"
    with open(scaler_out, "wb") as f:
        pickle.dump(scaler, f)

    # Save metadata
    meta = {
        "accuracy": float(acc),
        "roc_auc":  float(auc),
        "n_train":  int(len(X_train)),
        "n_test":   int(len(X_test)),
        "n_features": int(X.shape[1]),
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(out.parent / "model_meta.pkl", "wb") as f:
        pickle.dump(meta, f)

    print(f"\n✓ Classifier saved  → {out}")
    print(f"✓ Scaler saved      → {scaler_out}")
    print(f"✓ Metadata saved    → {out.parent / 'model_meta.pkl'}")
    print(f"\nTotal time: {time.time()-t0:.0f}s")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train VoiceGuard deepfake classifier")
    parser.add_argument("--data-dir",   required=True, help="Path to FakeAVCeleb_v1.2 dataset root")
    parser.add_argument("--output",     default="models/classifier_model.pkl", help="Output model path")
    parser.add_argument("--max-per-class", type=int, default=0, help="Max samples per class (0 = no limit)")
    args = parser.parse_args()

    train(args.data_dir, args.output, args.max_per_class)
