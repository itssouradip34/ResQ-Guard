"""
PyTorch Training Script for Acoustic Crash, Skid, and Panic Scream Detection.
Usage:
    python backend/training/train_acoustic_crash.py --data_dir /path/to/acoustic_dataset --epochs 30 --batch_size 32
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split

from backend.app.cv_pipeline.acoustic_detector import AcousticCrashCNN, ACOUSTIC_CLASSES
from backend.training.dataset_loaders import AcousticCrashDataset

def train_acoustic_model(data_dir: str, epochs: int = 25, batch_size: int = 32, lr: float = 0.001, output_path: str = "backend/models/acoustic_crash.pt"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Acoustic Crash Model on device: {device}")

    # Dataset & DataLoader
    full_dataset = AcousticCrashDataset(data_dir=data_dir)
    if len(full_dataset) == 0:
        print(f"[!] Warning: No dataset files found at '{data_dir}'. Generating synthetic training samples for verification...")
        # Create directory with placeholder verification tensors
        os.makedirs(os.path.join(data_dir, "normal_traffic"), exist_ok=True)
        os.makedirs(os.path.join(data_dir, "tire_skid"), exist_ok=True)
        os.makedirs(os.path.join(data_dir, "metal_crush"), exist_ok=True)
        import numpy as np
        for i in range(10):
            np.save(os.path.join(data_dir, "normal_traffic", f"sample_{i}.npy"), np.random.randn(1, 64, 128).astype(np.float32))
            np.save(os.path.join(data_dir, "tire_skid", f"sample_{i}.npy"), np.random.randn(1, 64, 128).astype(np.float32) + 0.5)
            np.save(os.path.join(data_dir, "metal_crush", f"sample_{i}.npy"), np.random.randn(1, 64, 128).astype(np.float32) + 1.2)
        full_dataset = AcousticCrashDataset(data_dir=data_dir)

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = AcousticCrashCNN(num_classes=len(ACOUSTIC_CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

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
            torch.save({"state_dict": model.state_dict(), "classes": ACOUSTIC_CLASSES, "epoch": epoch}, output_path)
            print(f"  --> Saved Best Model Checkpoint: {output_path}")

    print(f"[OK] Training Completed. Best weights exported to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Acoustic Crash Classifier")
    parser.add_argument("--data_dir", type=str, default="sample_data/acoustic_dataset", help="Directory containing audio classes")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output", type=str, default="backend/models/acoustic_crash.pt", help="Path to save PyTorch weights")
    args = parser.parse_args()

    train_acoustic_model(args.data_dir, args.epochs, args.batch_size, args.lr, args.output)
