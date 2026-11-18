import os
import shutil

c_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\eb16aa3d-3dd0-4b4d-9292-1fc75ed89670"
f_root = r"F:\Video_as_Code"

mappings = [
    # Bronze Project (Current)
    (os.path.join(c_dir, "bronze_heritage_delivery_report.md"), os.path.join(f_root, "bronze_heritage_15s", "DELIVERY_REPORT.md")),
    (os.path.join(c_dir, "museum_heritage_master_plan.md"), os.path.join(f_root, "bronze_heritage_15s", "MASTER_PLAN.md")),
    (os.path.join(c_dir, "bronze_contact_sheet.png"), os.path.join(f_root, "bronze_heritage_15s", "out", "bronze_contact_sheet.png")),
    (os.path.join(c_dir, "bronze_f90.png"), os.path.join(f_root, "bronze_heritage_15s", "out", "bronze_f90.png")),
    (os.path.join(c_dir, "bronze_f200.png"), os.path.join(f_root, "bronze_heritage_15s", "out", "bronze_f200.png")),
    (os.path.join(c_dir, "bronze_f450.png"), os.path.join(f_root, "bronze_heritage_15s", "out", "bronze_f450.png")),
    (os.path.join(c_dir, "bronze_f750.png"), os.path.join(f_root, "bronze_heritage_15s", "out", "bronze_f750.png")),

    # Aether SaaS Project
    (os.path.join(c_dir, "aether_pilot_delivery_report.md"), os.path.join(f_root, "aether_pilot_15s", "DELIVERY_REPORT.md")),
    (os.path.join(c_dir, "aether_saas_pilot_master_plan.md"), os.path.join(f_root, "aether_pilot_15s", "MASTER_PLAN.md")),
    (os.path.join(c_dir, "aether_contact_sheet.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_contact_sheet.png")),
    (os.path.join(c_dir, "aether_f90.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_f90.png")),
    (os.path.join(c_dir, "aether_f200.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_f200.png")),
    (os.path.join(c_dir, "aether_f450.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_f450.png")),
    (os.path.join(c_dir, "aether_f750.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_f750.png")),
    (os.path.join(c_dir, "aether_still_f450.png"), os.path.join(f_root, "aether_pilot_15s", "out", "aether_still_f450.png")),

    # Sanguo Guanyu Project
    (os.path.join(c_dir, "sanguo_guanyu_final_delivery_report.md"), os.path.join(f_root, "sanguo_guanyu_15s", "DELIVERY_REPORT.md")),
    (os.path.join(c_dir, "sanguo_guanyu_15s_master_plan.md"), os.path.join(f_root, "sanguo_guanyu_15s", "MASTER_PLAN.md")),
    (os.path.join(c_dir, "sanguo_guanyu_phase2_asset_review.md"), os.path.join(f_root, "sanguo_guanyu_15s", "ASSET_REVIEW.md")),
    (os.path.join(c_dir, "sanguo_guanyu_contact_sheet.png"), os.path.join(f_root, "sanguo_guanyu_15s", "out", "sanguo_guanyu_contact_sheet.png")),
    (os.path.join(c_dir, "guan_yu_concept_art_1792400126083.jpg"), os.path.join(f_root, "sanguo_guanyu_15s", "public", "assets", "guan_yu_concept_art.jpg")),
    (os.path.join(c_dir, "guan_yu_battle_charge_1792400129503.jpg"), os.path.join(f_root, "sanguo_guanyu_15s", "public", "assets", "guan_yu_battle_charge.jpg")),
    (os.path.join(c_dir, "guan_yu_ultimate_slash_1792400701856.jpg"), os.path.join(f_root, "sanguo_guanyu_15s", "public", "assets", "guan_yu_ultimate_slash.jpg")),
    (os.path.join(c_dir, "guan_yu_ultimate_cutin_1792400704444.jpg"), os.path.join(f_root, "sanguo_guanyu_15s", "public", "assets", "guan_yu_ultimate_cutin.jpg")),

    # Earshot Showcase
    (os.path.join(c_dir, "earshot_v03_showcase_delivery_report.md"), os.path.join(f_root, "earshot_v03_showcase", "DELIVERY_REPORT.md")),
    (os.path.join(c_dir, "earshot_v03_contact_sheet.png"), os.path.join(f_root, "earshot_v03_showcase", "out", "earshot_v03_contact_sheet.png")),

    # Xianyu Test
    (os.path.join(c_dir, "xianyu_cinetic_test_report.md"), os.path.join(f_root, "xianyu_cinetic_test", "DELIVERY_REPORT.md")),
    (os.path.join(c_dir, "xianyu_promo_delivery_report.md"), os.path.join(f_root, "xianyu_cinetic_test", "PROMO_REPORT.md")),
    (os.path.join(c_dir, "xianyu_cinetic_contact_sheet.png"), os.path.join(f_root, "xianyu_cinetic_test", "out", "xianyu_cinetic_contact_sheet.png")),

    # Taste Skill Upgrades & Architecture Reports
    (os.path.join(c_dir, "taste_skill_v2_1_upgrade_report.md"), os.path.join(f_root, "taste-skill", "UPGRADE_REPORT.md")),
    (os.path.join(c_dir, "tixfox_deconstruct_report.md"), os.path.join(f_root, "remotion_deconstruct_tixfox", "DECONSTRUCT_REPORT.md")),
    (os.path.join(c_dir, "motion_video_director_retrospective_and_upgrade_report.md"), os.path.join(f_root, "MOTION_VIDEO_DIRECTOR_REPORT.md")),
    (os.path.join(c_dir, "post_mortem_and_architecture_upgrade.md"), os.path.join(f_root, "ARCHITECTURE_POST_MORTEM.md")),
]

transferred = 0
for src, dst in mappings:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"Transferred: {os.path.basename(src)} -> {dst}")
        transferred += 1
    else:
        print(f"Skipped (not found): {src}")

# Fix internal markdown links in the transferred delivery reports to point to local relative paths
def fix_markdown_links(md_path, replacements):
    if not os.path.exists(md_path):
        return
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated links in: {md_path}")

# Fix bronze delivery report links
fix_markdown_links(
    os.path.join(f_root, "bronze_heritage_15s", "DELIVERY_REPORT.md"),
    [
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_heritage_15s.mp4", "./out/bronze_heritage_15s.mp4"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_contact_sheet.png", "./out/bronze_contact_sheet.png"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_f90.png", "./out/bronze_f90.png"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_f200.png", "./out/bronze_f200.png"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_f450.png", "./out/bronze_f450.png"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/bronze_f750.png", "./out/bronze_f750.png"),
    ]
)

# Fix aether delivery report links
fix_markdown_links(
    os.path.join(f_root, "aether_pilot_15s", "DELIVERY_REPORT.md"),
    [
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/aether_edge_15s.mp4", "./out/aether_edge_15s.mp4"),
        ("file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/aether_contact_sheet.png", "./out/aether_contact_sheet.png"),
    ]
)

print(f"\nDone! Successfully transferred {transferred} files to F: drive and patched relative links.")
