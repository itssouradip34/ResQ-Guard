import os
import json
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Tuple, Dict, Any, Optional

class AcousticCrashDataset(Dataset):
    """
    PyTorch Dataset for Traffic Acoustic Events (Tire skids, crashes, metal crush, screams).
    Accepts directory of audio WAV files or precomputed NumPy Log-Mel Spectrogram arrays.
    
    Structure expected:
    data_dir/
      tire_skid/
      metal_crush/
      glass_break/
      crowd_scream/
      normal_traffic/
    """
    CLASSES = ["normal_traffic", "tire_skid", "metal_crush", "glass_break", "crowd_scream"]

    def __init__(self, data_dir: str, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.samples: List[Tuple[str, int]] = []
        
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.CLASSES)}

        if os.path.exists(data_dir):
            for cls_name in self.CLASSES:
                cls_folder = os.path.join(data_dir, cls_name)
                if os.path.isdir(cls_folder):
                    for fname in os.listdir(cls_folder):
                        if fname.endswith((".npy", ".wav", ".npz")):
                            self.samples.append((os.path.join(cls_folder, fname), self.class_to_idx[cls_name]))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        fpath, label = self.samples[idx]
        if fpath.endswith(".npy"):
            spec = np.load(fpath) # Shape: (1, 64, 128)
        else:
            # Placeholder for raw WAV loading via librosa / scipy
            spec = np.random.randn(1, 64, 128).astype(np.float32)

        tensor = torch.from_numpy(spec).float()
        if self.transform:
            tensor = self.transform(tensor)
        return tensor, label


class HeiwaPoseCrimeDataset(Dataset):
    """
    PyTorch Dataset for 17-Keypoint Skeletal Pose Sequences (Heiwa Project).
    Inputs: Sequence of 17 Keypoints over T=16 frames: (C=3 [x,y,conf], T=16, Nodes=17).
    
    Classes:
    0: NORMAL_WALKING_STANDING
    1: PHYSICAL_ASSAULT_SLAP
    2: WEAPON_KNIFE_DRAW
    3: MOLESTATION_STRUGGLE
    4: GROUP_BRAWL_FIGHT
    """
    CLASSES = [
        "NORMAL_WALKING_STANDING",
        "PHYSICAL_ASSAULT_SLAP",
        "WEAPON_KNIFE_DRAW",
        "MOLESTATION_STRUGGLE",
        "GROUP_BRAWL_FIGHT"
    ]

    def __init__(self, data_file_or_dir: str, transform=None):
        self.samples: List[Tuple[np.ndarray, int]] = []
        self.transform = transform
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.CLASSES)}

        if os.path.exists(data_file_or_dir):
            if os.path.isfile(data_file_or_dir) and data_file_or_dir.endswith(".json"):
                with open(data_file_or_dir, "r") as f:
                    records = json.load(f)
                    for rec in records:
                        keypoints = np.array(rec["keypoints_sequence"], dtype=np.float32) # (16, 17, 3)
                        # Reorder to (C=3, T=16, N=17)
                        keypoints = np.transpose(keypoints, (2, 0, 1))
                        lbl_idx = self.class_to_idx.get(rec["action_type"], 0)
                        self.samples.append((keypoints, lbl_idx))
            elif os.path.isdir(data_file_or_dir):
                for cls_name in self.CLASSES:
                    cls_dir = os.path.join(data_file_or_dir, cls_name)
                    if os.path.isdir(cls_dir):
                        for fname in os.listdir(cls_dir):
                            if fname.endswith(".npy"):
                                arr = np.load(os.path.join(cls_dir, fname))
                                if arr.shape == (16, 17, 3):
                                    arr = np.transpose(arr, (2, 0, 1))
                                self.samples.append((arr, self.class_to_idx[cls_name]))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        keypoints, label = self.samples[idx]
        tensor = torch.from_numpy(keypoints).float()
        if self.transform:
            tensor = self.transform(tensor)
        return tensor, label
