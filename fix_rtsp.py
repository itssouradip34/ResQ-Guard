import json

with open("sample_data/seed-cameras.json") as f:
    cameras = json.load(f)

for cam in cameras:
    cam["rtsp_url"] = None

with open("sample_data/seed-cameras.json", "w") as f:
    json.dump(cameras, f, indent=2)