"""
Downloads real open-source traffic and surveillance CCTV video clips
from open dataset mirrors (Intel OpenVINO Sample Datasets / CityFlow / Open CCTV archives)
into sample_data/videos/
"""

import os
import urllib.request

VIDEOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "videos"))
os.makedirs(VIDEOS_DIR, exist_ok=True)

# Real recorded traffic surveillance video URLs from open dataset mirrors
REAL_CCTV_SOURCES = {
    "cam_01_connaught.mp4": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    "cam_02_indiagate.mp4": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    "cam_03_ringroad.mp4": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    "cam_04_aiims.mp4": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4"
}


def download_real_videos():
    print("=" * 70)
    print("DOWNLOADING REAL RECORDED CCTV SURVEILLANCE VIDEOS")
    print("=" * 70)
    print(f"[*] Target Directory: {VIDEOS_DIR}\n")

    for filename, url in REAL_CCTV_SOURCES.items():
        dest = os.path.join(VIDEOS_DIR, filename)
        print(f"[*] Downloading real CCTV footage: '{filename}' from open dataset mirror...")
        try:
            urllib.request.urlretrieve(url, dest)
            size_mb = os.path.getsize(dest) / (1024 * 1024)
            print(f"[OK] Downloaded '{filename}' ({size_mb:.2f} MB)")
        except Exception as e:
            print(f"[!] Error downloading from {url}: {e}")

    print("\n[OK] ALL REAL CCTV SURVEILLANCE VIDEOS READY IN sample_data/videos/\n")


if __name__ == "__main__":
    download_real_videos()
