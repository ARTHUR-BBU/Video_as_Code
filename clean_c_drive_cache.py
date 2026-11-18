import os

c_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\eb16aa3d-3dd0-4b4d-9292-1fc75ed89670"

# List of large temporary files to remove (already safely backed up to F: drive)
large_files = [
    "bronze_heritage_15s.mp4",
    "aether_edge_15s.mp4",
    "bronze_f90.png",
    "bronze_f200.png",
    "bronze_f450.png",
    "bronze_f750.png",
    "aether_still_f450.png",
    "new_contact_sheet.png",
    "kinetic_contact_sheet.png",
    "f1_test.png",
    "f2_test.png",
]

freed_bytes = 0
deleted_count = 0

print("Cleaning large temporary media files in C: drive artifact cache...")
for f in large_files:
    p = os.path.join(c_dir, f)
    if os.path.exists(p):
        sz = os.path.getsize(p)
        os.remove(p)
        freed_bytes += sz
        deleted_count += 1
        print(f"  - Deleted: {f} ({sz / (1024*1024):.2f} MB)")

# Clean .tempmediaStorage
temp_media_dir = os.path.join(c_dir, ".tempmediaStorage")
if os.path.exists(temp_media_dir):
    temp_count = 0
    temp_bytes = 0
    for f in os.listdir(temp_media_dir):
        fp = os.path.join(temp_media_dir, f)
        if os.path.isfile(fp):
            sz = os.path.getsize(fp)
            os.remove(fp)
            temp_bytes += sz
            temp_count += 1
    freed_bytes += temp_bytes
    deleted_count += temp_count
    print(f"  - Cleaned .tempmediaStorage: {temp_count} files ({temp_bytes / (1024*1024):.2f} MB)")

print(f"\nAll clean! Deleted {deleted_count} files, successfully freed {freed_bytes / (1024*1024):.2f} MB from C: drive.")
