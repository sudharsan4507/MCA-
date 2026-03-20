"""
test_backend.py
===============
Quick smoke-test for the backend without needing a real audio file.
Run: python test_backend.py
"""

import sys
import numpy as np


def test_feature_extractor():
    print("\n[1/3] Testing FeatureExtractor...")
    try:
        from feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        print(f"  Wav2Vec2 available : {extractor.wav2vec_available}")
        print(f"  Librosa available  : {extractor.librosa_available}")

        # Build a synthetic WAV in memory and test basic extraction
        import wave, struct, tempfile, os
        samples = [int(32767 * np.sin(2 * np.pi * 440 * i / 16000)) for i in range(16000)]
        tmp = tempfile.mktemp(suffix=".wav")
        with wave.open(tmp, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            wf.writeframes(struct.pack(f"{len(samples)}h", *samples))

        features, info = extractor.extract(tmp)
        os.remove(tmp)

        print(f"  Feature shape      : {features.shape}")
        print(f"  Audio info         : {info}")
        print("  ✓ FeatureExtractor OK")
        return True
    except Exception as e:
        print(f"  ✗ FeatureExtractor FAILED: {e}")
        return False


def test_predictor():
    print("\n[2/3] Testing Predictor...")
    try:
        from predict import Predictor
        predictor = Predictor()
        print(f"  Model loaded       : {predictor.is_loaded()}")

        dummy_features = np.random.randn(128).astype(np.float32)
        prediction, confidence, probs = predictor.predict(dummy_features)

        print(f"  Test prediction    : {prediction}")
        print(f"  Confidence         : {confidence:.4f}")
        print(f"  Probabilities      : {probs}")
        assert prediction in ("Real", "Deepfake"), "Invalid prediction label"
        assert 0 <= confidence <= 1, "Confidence out of range"
        print("  ✓ Predictor OK")
        return True
    except Exception as e:
        print(f"  ✗ Predictor FAILED: {e}")
        return False


def test_history_manager():
    print("\n[3/3] Testing HistoryManager...")
    try:
        import tempfile, os
        from history_manager import HistoryManager

        tmp_file = tempfile.mktemp(suffix=".json")
        hm = HistoryManager(tmp_file)

        record = {
            "id": "test-001",
            "filename": "test.wav",
            "prediction": "Real",
            "confidence": 0.87,
            "timestamp": "2024-01-01T00:00:00Z",
        }
        hm.add(record)

        all_records = hm.get_all()
        assert len(all_records) == 1, "Expected 1 record"

        found = hm.get_by_id("test-001")
        assert found is not None, "Record not found by ID"

        hm.delete("test-001")
        assert len(hm.get_all()) == 0, "Record was not deleted"

        os.remove(tmp_file)
        print("  ✓ HistoryManager OK")
        return True
    except Exception as e:
        print(f"  ✗ HistoryManager FAILED: {e}")
        return False


def test_api_import():
    print("\n[0/3] Testing FastAPI import...")
    try:
        import fastapi, uvicorn
        print(f"  FastAPI version    : {fastapi.__version__}")
        print("  ✓ FastAPI OK")
        return True
    except ImportError as e:
        print(f"  ✗ FastAPI FAILED: {e}")
        print("    → Run: pip install fastapi uvicorn python-multipart")
        return False


if __name__ == "__main__":
    print("=" * 55)
    print("  VoiceGuard Backend — Self-Test")
    print("=" * 55)

    results = [
        test_api_import(),
        test_feature_extractor(),
        test_predictor(),
        test_history_manager(),
    ]

    passed = sum(results)
    total  = len(results)

    print("\n" + "=" * 55)
    print(f"  Results: {passed}/{total} tests passed")
    if passed == total:
        print("  ✓ All systems GO — start the server with:")
        print("    uvicorn main:app --reload")
    else:
        print("  ✗ Some tests failed — check output above")
    print("=" * 55)

    sys.exit(0 if passed == total else 1)
