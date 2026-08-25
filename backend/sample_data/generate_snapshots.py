import os
from PIL import Image, ImageDraw, ImageFont

def generate_sample_snapshots():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "snapshots")
    os.makedirs(out_dir, exist_ok=True)
    
    images_to_make = [
        ("default_car.jpg", "WHITE SEDAN\nDL01AB1234", (240, 240, 245), (30, 30, 30)),
        ("sample_evidence.jpg", "BLACK SUV\nMH02CD5678", (20, 20, 25), (250, 250, 250)),
        ("cam-01_DL01AB1234.jpg", "CAM-01 [CONNAUGHT PL]\nPLATE: DL01AB1234\nCONF: 97.4%", (40, 44, 52), (100, 220, 100)),
        ("cam-02_DL01AB1234.jpg", "CAM-02 [INDIA GATE]\nPLATE: DL01AB1234\nCONF: 96.8%", (40, 44, 52), (100, 220, 100)),
        ("cam-03_MH02CD5678.jpg", "CAM-03 [RING ROAD]\nPLATE: MH02CD5678\nHOTLIST MATCH", (60, 20, 20), (255, 120, 120)),
        ("cam-04_DL08MN6789.jpg", "CAM-04 [AIIMS CORRIDOR]\nEMERGENCY AMBULANCE\nGREEN WAVE ACTIVE", (20, 60, 30), (120, 255, 150)),
        ("inc_01_stalled.jpg", "INCIDENT #01\nSTALLED MOTORBIKE\n> 3 MIN NON-PARKING", (80, 50, 10), (255, 200, 50)),
        ("inc_02_wrongway.jpg", "INCIDENT #02\nWRONG DIRECTION TRUCK\nOPPOSING 90-DEG FLOW", (90, 20, 20), (255, 100, 100)),
        ("inc_03_decel.jpg", "INCIDENT #03\nSUDDEN DECELERATION\n78 -> 12 KM/H IN 1.8s", (80, 20, 60), (255, 150, 200)),
    ]

    for filename, text, bg_color, text_color in images_to_make:
        filepath = os.path.join(out_dir, filename)
        if not os.path.exists(filepath):
            img = Image.new("RGB", (480, 270), color=bg_color)
            draw = ImageDraw.Draw(img)
            # Draw border
            draw.rectangle([10, 10, 470, 260], outline=(180, 180, 180), width=2)
            # Draw crosshair box (simulated plate crop)
            draw.rectangle([140, 160, 340, 230], outline=(0, 255, 200), width=2)
            draw.text((30, 40), text, fill=text_color)
            draw.text((150, 185), "[ ANPR ROI CROP ]", fill=(0, 255, 200))
            img.save(filepath, "JPEG")

if __name__ == "__main__":
    generate_sample_snapshots()
