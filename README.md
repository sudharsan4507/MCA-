# VoiceGuard — Deepfake Voice Detection System

> Detect AI-generated speech using Wav2Vec 2.0 neural embeddings and ensemble ML classifiers.

---

## Quick Start (Windows)

```
Double-click start.bat   (or run start.ps1 in PowerShell)
```

This installs all dependencies, runs a self-test, and launches both servers.

---

## Manual Setup

### Prerequisites
- Python 3.10+  →  https://python.org
- Node.js 18+   →  https://nodejs.org
- VS Code        →  https://code.visualstudio.com

### 1 — Open the workspace

```
File → Open Workspace from File → deepfake-detector.code-workspace
```

### 2 — Backend

```bash
cd backend
pip install -r requirements.txt
python test_backend.py       # verify everything works
uvicorn main:app --reload    # start API on http://localhost:8000
```

### 3 — Frontend

```bash
cd frontend
npm install
npm start                    # opens http://localhost:3000
```

---

## Project Structure

```
deepfake-detector/
├── start.bat / start.ps1       ← one-click startup
├── deepfake-detector.code-workspace
│
├── backend/
│   ├── main.py                 ← FastAPI app (5 endpoints)
│   ├── feature_extractor.py    ← Wav2Vec2 / librosa / numpy pipeline
│   ├── predict.py              ← RandomForest classifier
│   ├── history_manager.py      ← JSON persistence
│   ├── model_loader.py         ← model I/O helpers
│   ├── train_model.py          ← FakeAVCeleb training script
│   ├── test_backend.py         ← self-test script
│   ├── requirements.txt
│   ├── models/                 ← auto-created; stores .pkl files
│   └── uploads/                ← temp file store (auto-cleaned)
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.jsx
        ├── index.js
        ├── services/api.js         ← Axios API client
        ├── styles/globalStyles.js  ← dark futuristic theme
        ├── components/
        │   ├── Navbar.jsx           ← animated nav + server status
        │   ├── Upload.jsx           ← drag-and-drop dropzone
        │   ├── WaveformPlayer.jsx   ← WaveSurfer.js + zoom
        │   └── ResultCard.jsx       ← result display + PDF export
        └── pages/
            ├── Dashboard.jsx        ← stats + charts + history table
            ├── UploadPage.jsx       ← main analysis page
            └── HistoryPage.jsx      ← searchable paginated history
```

---

## API Reference

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/`            | API info + version                   |
| GET    | `/health`      | Health check + model status          |
| POST   | `/predict`     | Analyze audio file → prediction      |
| GET    | `/history`     | Paginated detection history          |
| GET    | `/history/:id` | Single record by ID                  |
| DELETE | `/history/:id` | Delete a record                      |
| GET    | `/stats`       | Aggregate statistics                 |

Interactive docs: **http://localhost:8000/docs**

### POST /predict — example response

```json
{
  "id": "a3f8c2d1-...",
  "filename": "speech.wav",
  "prediction": "Deepfake",
  "confidence": 0.9201,
  "probabilities": {
    "real": 0.0799,
    "deepfake": 0.9201
  },
  "audio_info": {
    "duration": 4.12,
    "sample_rate": 16000,
    "format": "WAV",
    "rms_energy": 0.0842,
    "peak_amplitude": 0.9134
  },
  "processing_time": 1.243,
  "timestamp": "2024-06-01T14:32:10Z",
  "risk_level": "critical"
}
```

---

## ML Pipeline

Feature extraction has three tiers — the best available is used automatically:

| Tier | Method | Features | Requirement |
|------|--------|----------|-------------|
| 1 | **Wav2Vec 2.0** (Facebook) | 768-dim embeddings | `torch`, `transformers` |
| 2 | **Librosa** spectral | 40 MFCCs + chroma + pitch + ZCR | `librosa` |
| 3 | **NumPy** FFT | Basic spectral statistics | Always available |

### Classifier

- **RandomForestClassifier** (100–200 estimators)
- Trained on synthetic data on first launch
- Replace with a model trained on real data for production accuracy

### Train on FakeAVCeleb_v1.2

1. Download the dataset from the official source
2. Arrange files as:
   ```
   FakeAVCeleb_v1.2/
       RealVideo-RealAudio/   ← real speech
       FakeVideo-FakeAudio/   ← deepfake
       FakeVideo-RealAudio/   ← deepfake
   ```
3. Run the training script:
   ```bash
   cd backend
   python train_model.py --data-dir /path/to/FakeAVCeleb_v1.2
   ```
4. The trained model is saved to `backend/models/` and loaded automatically.

---

## Frontend Features

### Dashboard
- Live system statistics (total analyzed, deepfakes found, avg confidence)
- Confidence trend area chart (Recharts)
- Real vs Deepfake pie chart
- Recent analysis history table

### Analyze Page
- Drag-and-drop audio upload (WAV, MP3, FLAC, OGG, M4A)
- Real-time analysis pipeline progress steps
- Result card with:
  - Verdict badge (Real / Deepfake)
  - Confidence percentage + animated bar
  - Dual probability bars
  - Audio metadata grid
  - WaveSurfer.js waveform player with zoom
  - Risk level badge (low / medium / high / critical)
  - PDF report download

### History Page
- Searchable by filename
- Filter by Real / Deepfake / All
- Load more pagination
- Per-record delete

---

## Install Deep Learning Backend (Optional, for higher accuracy)

```bash
# CPU-only
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers

# GPU (CUDA 11.8)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers
```

The Wav2Vec2 model (`facebook/wav2vec2-base`, ~360 MB) downloads automatically on first run.

---

## Environment Variables

Create `backend/.env` to override defaults:

```env
# Backend port (default: 8000)
PORT=8000

# Max upload size in MB (default: 50)
MAX_UPLOAD_MB=50

# Number of history records to keep (default: 500)
MAX_HISTORY=500
```

Create `frontend/.env` to point at a remote backend:

```env
REACT_APP_API_URL=http://your-server:8000
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `uvicorn: command not found` | `pip install uvicorn` |
| `npm: command not found` | Install Node.js from nodejs.org |
| CORS error in browser | Make sure backend is running on port 8000 |
| Model download slow | Wav2Vec2 is ~360 MB — be patient on first run |
| `librosa` install fails on Windows | `pip install librosa soundfile` (needs Visual C++ Build Tools) |
| Port 8000 already in use | `uvicorn main:app --port 8001` and update `REACT_APP_API_URL` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML model | Wav2Vec 2.0 (facebook/wav2vec2-base) |
| Classifier | RandomForest (scikit-learn) |
| Audio features | librosa, torchaudio |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 + React Router 6 |
| Animations | Framer Motion |
| Waveform | WaveSurfer.js 7 |
| Charts | Recharts |
| Styling | Styled Components |
| PDF export | jsPDF |
| HTTP client | Axios |

---

*VoiceGuard — Built for detecting AI-generated speech*
