"""
Automated Multi-Modal Dataset Acquisition and Synthesizer Pipeline for ResQ-Guard.
Prepares:
1. Acoustic Crash Dataset (Mel-Spectrogram tensors across 5 sound classes)
2. Heiwa 17-Keypoint Skeletal Pose Graph Dataset (across 5 violent/normal action classes)
"""

import os
import math
import numpy as np
import scipy.signal

# ----------------------------------------------------------------------
# 1. Acoustic Mel-Spectrogram Dataset Builder
# ----------------------------------------------------------------------
ACOUSTIC_CLASSES = ["normal_traffic", "tire_skid", "metal_crush", "glass_break", "crowd_scream"]

def generate_mel_spectrogram_features(audio_wave: np.ndarray, sample_rate: int = 16000, n_mels: int = 64, n_frames: int = 128) -> np.ndarray:
    """
    Computes a 2D Log-Mel Spectrogram (Shape: 1 x 64 x 128) from raw audio waveform.
    """
    # Short-Time Fourier Transform (STFT)
    n_fft = 512
    hop_length = max(1, len(audio_wave) // n_frames)
    
    # Compute spectrogram via STFT
    _, _, zxx = scipy.signal.stft(audio_wave, fs=sample_rate, nperseg=n_fft, noverlap=n_fft - hop_length)
    mag_spec = np.abs(zxx)
    
    # Simple Mel filterbank approximation
    freq_bins = mag_spec.shape[0]
    time_bins = mag_spec.shape[1]
    
    mel_spec = np.zeros((n_mels, time_bins), dtype=np.float32)
    # Log-spaced frequency interpolation into 64 bins
    indices = np.linspace(0, freq_bins - 1, n_mels).astype(int)
    for i, idx in enumerate(indices):
        mel_spec[i, :] = mag_spec[idx, :]
        
    # Resize or pad/crop time bins to exactly n_frames (128)
    if time_bins < n_frames:
        pad_width = n_frames - time_bins
        mel_spec = np.pad(mel_spec, ((0, 0), (0, pad_width)), mode='constant')
    elif time_bins > n_frames:
        mel_spec = mel_spec[:, :n_frames]
        
    # Log compression
    log_mel = np.log1p(mel_spec)
    # Normalize to zero mean, unit variance
    norm_mel = (log_mel - np.mean(log_mel)) / (np.std(log_mel) + 1e-6)
    return norm_mel[np.newaxis, :, :].astype(np.float32) # (1, 64, 128)


def build_acoustic_dataset(output_dir: str = "sample_data/acoustic_dataset", samples_per_class: int = 200):
    """
    Synthesizes and packages acoustic audio event samples with accurate acoustic characteristics.
    """
    print(f"[*] Building Acoustic Event Dataset at: {output_dir}")
    sr = 16000
    duration = 1.0 # 1 second window
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)

    for cls_name in ACOUSTIC_CLASSES:
        cls_dir = os.path.join(output_dir, cls_name)
        os.makedirs(cls_dir, exist_ok=True)
        print(f"  --> Generating {samples_per_class} samples for acoustic class: '{cls_name}'...")

        for i in range(samples_per_class):
            if cls_name == "normal_traffic":
                # Low frequency engine drone (80-250 Hz) + ambient rolling pink noise
                noise = np.random.normal(0, 0.15, len(t))
                drone = 0.4 * np.sin(2 * np.pi * np.random.uniform(90, 180) * t)
                wave = drone + noise

            elif cls_name == "tire_skid":
                # High frequency screeching (2000-3800 Hz) with friction harmonic modulation
                f0 = np.random.uniform(2200, 3400)
                chirp = scipy.signal.chirp(t, f0=f0, t1=duration, f1=f0 * 0.7, method='quadratic')
                friction = np.random.normal(0, 0.4, len(t)) * (np.sin(2 * np.pi * 35 * t) + 1.0)
                wave = (0.7 * chirp) + friction

            elif cls_name == "metal_crush":
                # Sharp broadband impact shockwave + heavy non-linear distortion decay
                decay = np.exp(-t * np.random.uniform(4.0, 8.0))
                impact = np.random.normal(0, 0.8, len(t)) * decay
                sub_thud = 0.8 * np.sin(2 * np.pi * 65 * t) * decay
                wave = np.clip(impact + sub_thud, -1.0, 1.0)

            elif cls_name == "glass_break":
                # High frequency burst (>4500 Hz) + sharp decaying crackle spikes
                decay = np.exp(-t * 12.0)
                crackles = (np.random.rand(len(t)) > 0.96).astype(float) * np.random.uniform(0.6, 1.0, len(t))
                high_ping = 0.5 * np.sin(2 * np.pi * np.random.uniform(4800, 7200) * t) * decay
                wave = high_ping + (crackles * decay)

            elif cls_name == "crowd_scream":
                # Human vocal panic formant resonance (1200-2600 Hz) with pitch vibrato
                vibrato = np.sin(2 * np.pi * 6 * t) * 120
                f_scream = np.random.uniform(1400, 2200) + vibrato
                wave = 0.7 * np.sin(2 * np.pi * f_scream * t) + np.random.normal(0, 0.1, len(t))

            # Convert to Mel-Spectrogram tensor (1, 64, 128)
            spec_tensor = generate_mel_spectrogram_features(wave.astype(np.float32), sr)
            np.save(os.path.join(cls_dir, f"sample_{i:04d}.npy"), spec_tensor)

    print(f"[OK] Acoustic Dataset generation complete: {len(ACOUSTIC_CLASSES) * samples_per_class} total samples.")


# ----------------------------------------------------------------------
# 2. Heiwa 17-Keypoint Skeletal Pose Dataset Builder
# ----------------------------------------------------------------------
CRIME_ACTION_CLASSES = [
    "NORMAL_WALKING_STANDING",
    "PHYSICAL_ASSAULT_SLAP",
    "WEAPON_KNIFE_DRAW",
    "MOLESTATION_STRUGGLE",
    "GROUP_BRAWL_FIGHT"
]

def build_crime_pose_dataset(output_dir: str = "sample_data/crime_pose_dataset", samples_per_class: int = 200):
    """
    Generates 17-node COCO topological pose temporal sequences (T=16 frames, N=17 joints, C=3 [x, y, conf]).
    """
    print(f"[*] Building Heiwa 17-Keypoint Skeletal Pose Dataset at: {output_dir}")
    T = 16 # 16-frame sliding temporal window
    N = 17 # 17 COCO keypoint joints

    # Standard upright human template coordinates (x, y) normalized in [0, 1]
    base_skeleton = np.array([
        [0.50, 0.10], # 0: Nose
        [0.48, 0.08], # 1: L Eye
        [0.52, 0.08], # 2: R Eye
        [0.45, 0.10], # 3: L Ear
        [0.55, 0.10], # 4: R Ear
        [0.40, 0.25], # 5: L Shoulder
        [0.60, 0.25], # 6: R Shoulder
        [0.35, 0.40], # 7: L Elbow
        [0.65, 0.40], # 8: R Elbow
        [0.30, 0.55], # 9: L Wrist
        [0.70, 0.55], # 10: R Wrist
        [0.43, 0.55], # 11: L Hip
        [0.57, 0.55], # 12: R Hip
        [0.42, 0.75], # 13: L Knee
        [0.58, 0.75], # 14: R Knee
        [0.42, 0.95], # 15: L Ankle
        [0.58, 0.95]  # 16: R Ankle
    ], dtype=np.float32)

    for cls_name in CRIME_ACTION_CLASSES:
        cls_dir = os.path.join(output_dir, cls_name)
        os.makedirs(cls_dir, exist_ok=True)
        print(f"  --> Generating {samples_per_class} pose sequences for: '{cls_name}'...")

        for i in range(samples_per_class):
            seq = np.zeros((T, N, 3), dtype=np.float32)

            for t_step in range(T):
                skel = base_skeleton.copy()
                phase = t_step / float(T)

                if cls_name == "NORMAL_WALKING_STANDING":
                    # Gentle periodic gait swing in legs and arms (< 1.5 rad/s)
                    swing = math.sin(phase * 2 * math.pi) * 0.04
                    skel[15, 0] += swing # L Ankle
                    skel[16, 0] -= swing # R Ankle
                    skel[9, 0] -= swing * 0.5 # L Wrist
                    skel[10, 0] += swing * 0.5 # R Wrist

                elif cls_name == "PHYSICAL_ASSAULT_SLAP":
                    # Rapid high-velocity upper-extremity strike toward cranial node
                    if t_step < 8:
                        # Cocking arm back
                        skel[10, 0] += (t_step / 8.0) * 0.25
                        skel[8, 1] -= (t_step / 8.0) * 0.15
                    else:
                        # High-speed strike forward across body
                        strike_prog = (t_step - 8) / 8.0
                        skel[10, 0] -= strike_prog * 0.45 # R Wrist rapid swing
                        skel[10, 1] -= strike_prog * 0.25 # Aimed at head height
                        skel[0, 0] += strike_prog * 0.08  # Target head recoil deflection

                elif cls_name == "WEAPON_KNIFE_DRAW":
                    # Waistline retrieval (frames 0-7) followed by forward weapon thrust (frames 8-15)
                    if t_step < 7:
                        skel[10, 0] = 0.57 # Right wrist to hip waistline
                        skel[10, 1] = 0.55
                    else:
                        thrust = (t_step - 7) / 9.0
                        skel[10, 0] += thrust * 0.35 # Direct forward extension
                        skel[10, 1] -= thrust * 0.10
                        skel[8, 1] -= thrust * 0.15 # Elbow lock

                elif cls_name == "MOLESTATION_STRUGGLE":
                    # Inter-personal proximity compression + opposing resistive torque vectors
                    jitter = np.random.normal(0, 0.04, skel.shape)
                    skel += jitter
                    # Constrained struggle in wrists and torso
                    skel[9:11, 1] -= math.sin(phase * 4 * math.pi) * 0.08

                elif cls_name == "GROUP_BRAWL_FIGHT":
                    # Chaotic multi-directional kinetic collision
                    chaos = np.random.normal(0, 0.08, skel.shape)
                    skel += chaos

                # Assign (x, y, confidence)
                seq[t_step, :, :2] = skel
                seq[t_step, :, 2] = np.random.uniform(0.85, 0.99, N) # Keypoint confidence

            np.save(os.path.join(cls_dir, f"pose_sample_{i:04d}.npy"), seq)

    print(f"[OK] Heiwa Pose Dataset generation complete: {len(CRIME_ACTION_CLASSES) * samples_per_class} total sequences.")


if __name__ == "__main__":
    build_acoustic_dataset("sample_data/acoustic_dataset", samples_per_class=200)
    build_crime_pose_dataset("sample_data/crime_pose_dataset", samples_per_class=200)
    print("\n[OK] All datasets successfully prepared and structured for neural training!")
