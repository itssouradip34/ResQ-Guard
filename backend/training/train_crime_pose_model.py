"""
PyTorch Training Script for Heiwa Human Pose Spatio-Temporal Violent Crime Detection.
Usage:
    python backend/training/train_crime_pose_model.py --data_path /path/to/pose_dataset.json --epochs 30 --batch_size 16
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split

from backend.app.cv_pipeline.crime_pose_detector import HeiwaPoseSpatioTemporalCNN, CRIME_ACTION_CLASSES
from backend.training.dataset_loaders import HeiwaPoseCrimeDataset

def train_crime_pose_model(data_path: str, epochs: int = 25, batch_size: int = 16, lr: float = 0.001, output_path: str = "backend/models/heiwa_crime_pose.pt"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Heiwa 17-Keypoint Crime Pose Model on device: {device}")

    # Dataset & DataLoader
    full_dataset = HeiwaPoseCrimeDataset(data_file_or_dir=data_path)
    if len(full_dataset) == 0:
        print(f"[!] Warning: No pose records found at '{data_path}'. Generating synthetic pose sequences for verification...")
        os.makedirs("sample_data/pose_dataset", exist_ok=True)
        for cls_name in CRIME_ACTION_CLASSES:
            cls_folder = os.path.join("sample_data/pose_dataset", cls_name)
            os.makedirs(cls_folder, exist_ok=True)
            for i in range(10):
                # Shape: (T=16 frames, Nodes=17 joints, C=3 [x, y, conf])
                seq = np.random.uniform(0.1, 0.9, (16, 17, 3)).astype(np.float32)
                np.save(os.path.join(cls_folder, f"pose_sample_{i}.npy"), seq)
        data_path = "sample_data/pose_dataset"
        full_dataset = HeiwaPoseCrimeDataset(data_file_or_dir=data_path)

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = HeiwaPoseSpatioTemporalCNN(num_classes=len(CRIME_ACTION_CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

        scheduler.step()
        train_acc = (correct / total) * 100.0 if total else 0.0
        avg_train_loss = train_loss / total if total else 0.0

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * inputs.size(0)
                _, predicted = outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()

        val_acc = (val_correct / val_total) * 100.0 if val_total else 0.0
        avg_val_loss = val_loss / val_total if val_total else 0.0

        print(f"Epoch [{epoch:02d}/{epochs:02d}] | Train Loss: {avg_train_loss:.4f} | Train Acc: {train_acc:.1f}% | Val Loss: {avg_val_loss:.4f} | Val Acc: {val_acc:.1f}%")

        if avg_val_loss <= best_val_loss:
            best_val_loss = avg_val_loss
            torch.save({"state_dict": model.state_dict(), "classes": CRIME_ACTION_CLASSES, "epoch": epoch}, output_path)
            print(f"  --> Saved Best Crime Pose Model Checkpoint: {output_path}")

    print(f"[OK] Heiwa Pose Training Completed. Best weights exported to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Heiwa Human Pose Crime Classifier")
    parser.add_argument("--data_path", type=str, default="sample_data/pose_dataset", help="JSON or Directory of pose sequences")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output", type=str, default="backend/models/heiwa_crime_pose.pt", help="Path to save PyTorch weights")
    args = parser.parse_args()

    train_crime_pose_model(args.data_path, args.epochs, args.batch_size, args.lr, args.output)
