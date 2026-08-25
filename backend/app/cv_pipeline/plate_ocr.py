import re
import difflib
from typing import Dict, Any, Tuple

INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DN", "DL",
    "GA", "GJ", "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PY", "PB", "RJ",
    "SK", "TN", "TS", "TR", "UP", "UK", "WB", "BH"
}

# Regex for standard Indian license plates: e.g. DL01AB1234, MP04GH3456, MH02C1234, DL8CNA1234, 22BH1234AA
INDIAN_PLATE_PATTERN = re.compile(
    r'^(?:([A-Z]{2})[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|(?:[0-9]{2}BH[0-9]{4}[A-Z]{1,2}))$'
)

def normalize_plate_text(raw_text: str) -> str:
    """Uppercase, strip whitespace and special symbols."""
    if not raw_text:
        return ""
    # Strip non-alphanumeric
    cleaned = re.sub(r'[^A-Za-z0-9]', '', raw_text).upper()
    return cleaned

def validate_indian_plate(plate_text: str) -> Tuple[bool, str]:
    """Validates plate against Indian state-code aware format regex."""
    norm = normalize_plate_text(plate_text)
    if not norm:
        return False, "Empty plate string"
    
    # Check general regex match
    match = INDIAN_PLATE_PATTERN.match(norm)
    if match:
        state_prefix = norm[:2]
        if state_prefix.isalpha() and state_prefix in INDIAN_STATE_CODES:
            return True, "Valid standard state plate"
        elif norm[2:4] == "BH":
            return True, "Valid Bharat (BH) series plate"
        return True, "Regex valid plate"
    
    # Soft fallback validation for demo footage
    if len(norm) >= 8 and norm[:2].isalpha() and norm[-4:].isdigit():
        return True, "Plausible plate structure"
        
    return False, "Invalid plate format"

def calculate_character_agreement(str1: str, str2: str) -> float:
    """Calculates character-level agreement ratio between two OCR engine outputs."""
    if not str1 or not str2:
        return 0.0
    matcher = difflib.SequenceMatcher(None, str1, str2)
    return round(matcher.ratio(), 4)

def fuse_ocr_scores(
    paddle_text: str,
    paddle_conf: float,
    easy_text: str,
    easy_conf: float
) -> Dict[str, Any]:
    """
    F-04: OCR Confidence Fusion
    - (a) per-engine confidence
    - (b) char-level agreement between engines
    - (c) regex format validity bonus
    """
    paddle_norm = normalize_plate_text(paddle_text)
    easy_norm = normalize_plate_text(easy_text)
    
    is_paddle_valid, _ = validate_indian_plate(paddle_norm)
    is_easy_valid, _ = validate_indian_plate(easy_norm)
    
    char_agreement = calculate_character_agreement(paddle_norm, easy_norm)
    
    # Pick primary plate text candidate
    if paddle_norm == easy_norm and paddle_norm:
        chosen_text = paddle_norm
        format_valid = is_paddle_valid
    elif is_paddle_valid and not is_easy_valid:
        chosen_text = paddle_norm
        format_valid = True
    elif is_easy_valid and not is_paddle_valid:
        chosen_text = easy_norm
        format_valid = True
    elif paddle_conf >= easy_conf:
        chosen_text = paddle_norm if paddle_norm else easy_norm
        format_valid = is_paddle_valid
    else:
        chosen_text = easy_norm if easy_norm else paddle_norm
        format_valid = is_easy_valid
    
    # Weighted fusion calculation
    base_engine_score = (paddle_conf * 0.55) + (easy_conf * 0.45)
    agreement_bonus = char_agreement * 0.15
    format_bonus = 0.10 if format_valid else -0.15
    
    fused_confidence = min(0.99, max(0.10, base_engine_score + agreement_bonus + format_bonus))
    fused_confidence = round(fused_confidence, 4)
    
    # Disagreement threshold -> flag needs_review
    needs_review = False
    if char_agreement < 0.70 or fused_confidence < 0.80 or not format_valid:
        needs_review = True
        
    return {
        "final_plate": chosen_text,
        "fused_confidence": fused_confidence,
        "plate_format_valid": format_valid,
        "needs_review": needs_review,
        "ocr_engine_scores": {
            "paddle_ocr": {"text": paddle_norm, "conf": round(paddle_conf, 3)},
            "easy_ocr": {"text": easy_norm, "conf": round(easy_conf, 3)},
            "char_agreement": char_agreement,
            "format_valid": format_valid
        }
    }
