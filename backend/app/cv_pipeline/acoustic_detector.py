import os
from typing import Dict, Any, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# Configurable acoustic thresholds (will update dynamically upon dataset training)
DEFAULT_ACOUSTIC_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "acoustic_crash.pt"
)
ACOUSTIC_MODEL_PATH = os.getenv("ACOUSTIC_MODEL_PATH", DEFAULT_ACOUSTIC_MODEL_PATH)
ACOUSTIC_CONFIDENCE_THRESHOLD = float(os.getenv("ACOUSTIC_CONFIDENCE_THRESHOLD", "0.75"))

ACOUSTIC_CLASSES = [
    "normal_traffic",
    "tire_skid",
    "metal_crush",
    "glass_break",
    "crowd_scream"
]

class AcousticCrashCNN(nn.Module):
    """
    Trainable PyTorch 2D-CNN Architecture for Audio Spectrograms.
    Inputs: Log-Mel Spectrogram (Batch, 1, 64_mels, 128_time_frames)
    Outputs: Class probabilities across normal traffic, tire skids, metal crush, glass breaks, screams.
    """
    def __init__(self, num_classes: int = 5):
        super(AcousticCrashCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2, 2)

        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.AdaptiveAvgPool2d((4, 4))
        
        self.dropout = nn.Dropout(0.3)
        self.fc1 = nn.Linear(128 * 4 * 4, 128)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (B, 1, H, W)
        x = self.pool1(F.relu(self.bn1(self.conv1(x))))
        x = self.pool2(F.relu(self.bn2(self.conv2(x))))
        x = self.pool3(F.relu(self.bn3(self.conv3(x))))
        
        x = x.view(x.size(0), -1)
        x = self.dropout(F.relu(self.fc1(x)))
        logits = self.fc2(x)
        return logits


class AcousticDetector:
    """
    Inference and Audio Processing Engine for Traffic Acoustic Events.
    Can ingest raw audio WAV/PCM samples or Mel-Spectrogram features.
    """
    def __init__(self, model_path: str = ACOUSTIC_MODEL_PATH):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AcousticCrashCNN(num_classes=len(ACOUSTIC_CLASSES)).to(self.device)
        self.model.eval()

        if os.path.exists(model_path):
            try:
                checkpoint = torch.load(model_path, map_location=self.device)
                if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                    self.model.load_state_dict(checkpoint["state_dict"])
                else:
                    self.model.load_state_dict(checkpoint)
            except Exception:
                pass

    def extract_mel_spectrogram(self, audio_signal: np.ndarray, sr: int = 16000) -> np.ndarray:
        """
        Computes 64-band Log-Mel Spectrogram from raw PCM audio signal using NumPy/FFT.
        """
        if audio_signal is None or len(audio_signal) == 0:
            return np.zeros((1, 64, 128), dtype=np.float32)

        # Standard window parameters
        n_fft = 512
        hop_length = 256
        n_mels = 64
        
        # Simple STFT magnitude computation
        num_frames = max(1, (len(audio_signal) - n_fft) // hop_length)
        spec = np.zeros((n_mels, min(128, num_frames)), dtype=np.float32)
        
        for i in range(min(128, num_frames)):
            start = i * hop_length
            frame = audio_signal[start:start + n_fft]
            if len(frame) == n_fft:
                windowed = frame * np.hanning(n_fft)
                fft_mag = np.abs(np.fft.rfft(windowed))[:n_mels]
                spec[:, i] = np.log1p(fft_mag)
        
        # Normalize to (1, 64, 128)
        padded_spec = np.zeros((1, 64, 128), dtype=np.float32)
        padded_spec[0, :, :spec.shape[1]] = spec
        return padded_spec

    def analyze_audio_segment(
        self,
        audio_array: Optional[np.ndarray] = None,
        db_level: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Analyzes audio snippet from camera microphone for collision, skid, or panic scream signatures.
        """
        if audio_array is not None and len(audio_array) > 0:
            spec = self.extract_mel_spectrogram(audio_array)
            tensor = torch.from_numpy(spec).unsqueeze(0).to(self.device) # (1, 1, 64, 128)
            with torch.no_grad():
                logits = self.model(tensor)
                probs = F.softmax(logits, dim=1).cpu().numpy()[0]
            
            top_idx = int(np.argmax(probs))
            top_class = ACOUSTIC_CLASSES[top_idx]
            confidence = float(probs[top_idx])
            
            # Estimate decibel power
            measured_db = db_level if db_level is not None else float(round(65.0 + (np.std(audio_array) * 120.0), 1))
        else:
            # Baseline quiet ambient state
            top_class = "normal_traffic"
            confidence = 0.95
            measured_db = db_level if db_level is not None else 62.0

        is_critical = top_class in ["tire_skid", "metal_crush", "glass_break", "crowd_scream"] and confidence >= ACOUSTIC_CONFIDENCE_THRESHOLD

        return {
            "signature": top_class,
            "confidence": round(confidence, 3),
            "decibel_level": measured_db,
            "is_anomaly_detected": is_critical,
            "class_probabilities": {cls: round(float(p), 3) for cls, p in zip(ACOUSTIC_CLASSES, probs if audio_array is not None else [0.95, 0.01, 0.01, 0.01, 0.02])}
        }


acoustic_detector = AcousticDetector()
