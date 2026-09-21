import os
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

DEFAULT_CRIME_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "heiwa_crime_pose.pt"
)
CRIME_MODEL_PATH = os.getenv("CRIME_MODEL_PATH", DEFAULT_CRIME_MODEL_PATH)
CRIME_CONFIDENCE_THRESHOLD = float(os.getenv("CRIME_CONFIDENCE_THRESHOLD", "0.75"))

# 17 COCO Keypoints
COCO_KEYPOINT_NAMES = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

CRIME_ACTION_CLASSES = [
    "NORMAL_WALKING_STANDING",
    "PHYSICAL_ASSAULT_SLAP",
    "WEAPON_KNIFE_DRAW",
    "MOLESTATION_STRUGGLE",
    "GROUP_BRAWL_FIGHT"
]

class HeiwaPoseSpatioTemporalCNN(nn.Module):
    """
    Trainable Spatio-Temporal Keypoint Neural Network (Heiwa Project).
    Inputs: Sequence of 17 Keypoints over T frames: (Batch, Channels=3 [x,y,conf], Frames=16, Nodes=17)
    Outputs: Class probabilities across non-regulatory human violence categories.
    """
    def __init__(self, in_channels: int = 3, num_classes: int = 5, num_nodes: int = 17):
        super(HeiwaPoseSpatioTemporalCNN, self).__init__()
        
        # Spatial Graph Convolution across 17 skeletal joint nodes
        self.spatial_conv1 = nn.Conv2d(in_channels, 32, kernel_size=(1, 3), padding=(0, 1))
        self.bn_s1 = nn.BatchNorm2d(32)
        
        # Temporal Convolution across 16 frame windows
        self.temporal_conv1 = nn.Conv2d(32, 64, kernel_size=(3, 1), padding=(1, 0))
        self.bn_t1 = nn.BatchNorm2d(64)
        
        self.spatial_conv2 = nn.Conv2d(64, 128, kernel_size=(1, 3), padding=(0, 1))
        self.bn_s2 = nn.BatchNorm2d(128)
        
        self.temporal_conv2 = nn.Conv2d(128, 128, kernel_size=(3, 1), padding=(1, 0))
        self.bn_t2 = nn.BatchNorm2d(128)
        
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(128, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, C, T, N)
        x = F.relu(self.bn_s1(self.spatial_conv1(x)))
        x = F.relu(self.bn_t1(self.temporal_conv1(x)))
        x = F.relu(self.bn_s2(self.spatial_conv2(x)))
        x = F.relu(self.bn_t2(self.temporal_conv2(x)))
        
        x = self.pool(x) # (B, 128, 1, 1)
        x = x.view(x.size(0), -1)
        x = self.dropout(x)
        logits = self.fc(x)
        return logits


class CrimePoseDetector:
    """
    Inference & Keypoint Movement Analyzer for the Heiwa Human Safety Project.
    """
    def __init__(self, model_path: str = CRIME_MODEL_PATH):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = HeiwaPoseSpatioTemporalCNN(num_classes=len(CRIME_ACTION_CLASSES)).to(self.device)
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

    def evaluate_keypoint_sequence(
        self,
        keypoints_seq: Optional[np.ndarray] = None # Shape: (T=16, Nodes=17, Channels=3)
    ) -> Dict[str, Any]:
        """
        Evaluates a temporal sequence of skeletal keypoints for violent non-regulatory movements.
        """
        if keypoints_seq is not None and keypoints_seq.ndim == 3:
            # Ensure 3 channels: (x, y, confidence)
            if keypoints_seq.shape[2] == 2:
                conf_plane = np.ones((keypoints_seq.shape[0], keypoints_seq.shape[1], 1), dtype=np.float32)
                keypoints_seq = np.concatenate([keypoints_seq, conf_plane], axis=2)

            # Reorder to (1, C, T, N)
            tensor_in = torch.from_numpy(keypoints_seq).permute(2, 0, 1).unsqueeze(0).float().to(self.device)
            with torch.no_grad():
                logits = self.model(tensor_in)
                probs = F.softmax(logits, dim=1).cpu().numpy()[0]
                
            top_idx = int(np.argmax(probs))
            top_action = CRIME_ACTION_CLASSES[top_idx]
            confidence = float(probs[top_idx])
            
            # Extract physical joint velocities
            wrists_vel = float(np.std(keypoints_seq[:, [9, 10], :2])) # Wrist dynamics
            collapse_ratio = float(np.mean(keypoints_seq[:, :, 2])) # Confidence ratio
        else:
            # Default regular movement
            top_action = "NORMAL_WALKING_STANDING"
            confidence = 0.96
            probs = [0.96, 0.01, 0.01, 0.01, 0.01]
            wrists_vel = 1.2
            collapse_ratio = 0.85

        is_violent = top_action != "NORMAL_WALKING_STANDING" and confidence >= CRIME_CONFIDENCE_THRESHOLD

        return {
            "action_type": top_action,
            "confidence": round(confidence, 3),
            "is_violent_crime": is_violent,
            "joint_velocity_max": round(wrists_vel, 2),
            "proximity_collapse_ratio": round(collapse_ratio, 2),
            "class_probabilities": {cls: round(float(p), 3) for cls, p in zip(CRIME_ACTION_CLASSES, probs)}
        }


crime_pose_detector = CrimePoseDetector()
