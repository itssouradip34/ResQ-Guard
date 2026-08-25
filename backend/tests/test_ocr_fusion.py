import pytest
from backend.app.cv_pipeline.plate_ocr import validate_indian_plate, fuse_ocr_scores, normalize_plate_text

def test_normalize_plate_text():
    assert normalize_plate_text(" dl 01-ab 1234 ") == "DL01AB1234"
    assert normalize_plate_text("mh.02 cd 5678") == "MH02CD5678"

def test_validate_indian_plate():
    valid, msg = validate_indian_plate("DL01AB1234")
    assert valid is True
    
    valid, msg = validate_indian_plate("MH02CD5678")
    assert valid is True

    valid, msg = validate_indian_plate("22BH1234AA")
    assert valid is True

    valid, msg = validate_indian_plate("INVALID123")
    assert valid is False

def test_fuse_ocr_scores():
    fusion = fuse_ocr_scores(
        paddle_text="DL01AB1234",
        paddle_conf=0.96,
        easy_text="DL01AB1234",
        easy_conf=0.94
    )
    assert fusion["final_plate"] == "DL01AB1234"
    assert fusion["fused_confidence"] >= 0.85
    assert fusion["needs_review"] is False
    assert fusion["plate_format_valid"] is True

def test_fuse_ocr_scores_disagreement():
    fusion = fuse_ocr_scores(
        paddle_text="DL01AB1234",
        paddle_conf=0.95,
        easy_text="UP16XY9999",
        easy_conf=0.60
    )
    assert fusion["needs_review"] is True
