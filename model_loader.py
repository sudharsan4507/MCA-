"""
Model Loader Utility
Handles loading and caching of ML models.
"""

from pathlib import Path
import pickle
import numpy as np


class ModelLoader:
    """Utility for loading and managing ML models."""

    _instances = {}

    @classmethod
    def get_classifier(cls, model_path: str = "models/classifier_model.pkl"):
        """Load classifier with caching."""
        if model_path not in cls._instances:
            cls._instances[model_path] = cls._load_pkl(model_path)
        return cls._instances[model_path]

    @staticmethod
    def _load_pkl(path: str):
        """Load a pickle file."""
        p = Path(path)
        if not p.exists():
            return None
        try:
            with open(p, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[ModelLoader] Error loading {path}: {e}")
            return None

    @staticmethod
    def save_classifier(model, path: str = "models/classifier_model.pkl"):
        """Save a classifier to disk."""
        p = Path(path)
        p.parent.mkdir(exist_ok=True)
        with open(p, "wb") as f:
            pickle.dump(model, f)
        print(f"[ModelLoader] Saved model to {path}")


def train_on_dataset(data_dir: str, output_model_path: str = "models/classifier_model.pkl"):
    """
    Train the deepfake detection model on the FakeAVCeleb_v1.2 dataset.
    
    Dataset structure expected:
        data_dir/
            real/
                *.wav
            fake/
                *.wav
    
    Run this script separately to train the production model:
        python model_loader.py --train --data-dir /path/to/FakeAVCeleb_v1.2
    """
    from feature_extractor import FeatureExtractor
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import classification_report, accuracy_score
    import os

    extractor = FeatureExtractor()
    
    X, y = [], []
    
    # Load real samples
    real_dir = Path(data_dir) / "real"
    if real_dir.exists():
        for audio_file in real_dir.glob("*.wav"):
            try:
                features, _ = extractor.extract(str(audio_file))
                X.append(features)
                y.append(0)  # Real = 0
                print(f"  Loaded real: {audio_file.name}")
            except Exception as e:
                print(f"  Error loading {audio_file}: {e}")
    
    # Load fake samples
    fake_dir = Path(data_dir) / "fake"
    if fake_dir.exists():
        for audio_file in fake_dir.glob("*.wav"):
            try:
                features, _ = extractor.extract(str(audio_file))
                X.append(features)
                y.append(1)  # Deepfake = 1
                print(f"  Loaded fake: {audio_file.name}")
            except Exception as e:
                print(f"  Error loading {audio_file}: {e}")
    
    if not X:
        print("No training data found!")
        return
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"\nDataset: {len(X)} samples ({sum(y==0)} real, {sum(y==1)} fake)")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=4,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    clf.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test_scaled)
    print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Real", "Deepfake"]))
    
    # Save
    ModelLoader.save_classifier(clf, output_model_path)
    with open("models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    print(f"\nModel saved to {output_model_path}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train deepfake detection model")
    parser.add_argument("--train", action="store_true", help="Train new model")
    parser.add_argument("--data-dir", type=str, default="./data", help="Path to dataset")
    parser.add_argument("--output", type=str, default="models/classifier_model.pkl")
    
    args = parser.parse_args()
    
    if args.train:
        print(f"Training on dataset at: {args.data_dir}")
        train_on_dataset(args.data_dir, args.output)
    else:
        print("Use --train flag to train the model")
        print("Example: python model_loader.py --train --data-dir /path/to/FakeAVCeleb_v1.2")
