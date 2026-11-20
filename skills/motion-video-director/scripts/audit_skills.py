#!/usr/bin/env python3
"""
Video-as-Code Automated Skill Architecture & Routing Audit Gate
Enforces Evolution Lessons A1, A2, A3, A4, A6 as executable CI assertions:
  1. A2 (1:1 Alignment): ROUTER.md §1 slots == manifest.json slots == DEPENDENCIES.md §1 rows == skills/*/SKILL.md
  2. A2 (Status Enum): status strings in ROUTER.md, manifest.json, and DEPENDENCIES.md match schema enum & each other
  3. A6 (Unique Names): frontmatter `name:` across skills/*/SKILL.md are strictly unique
  4. A1 (Disambiguation): no `MANDATORY SUPREME` hijack in orchestrator; mutex pairs carry `disambiguation`
  5. A4 (Canonical Paths): no bare `scripts/...` cross-skill references in director/SKILL.md or ROUTER.md
  6. A3 (Local Schema): manifest.json `$schema` resolves to an existing local file on disk

Usage:
  python skills/motion-video-director/scripts/audit_skills.py
"""

import json
import re
import sys
from pathlib import Path


def parse_frontmatter(md_text: str) -> dict:
    m = re.match(r"^---\r?\n(.*?)\r?\n---", md_text, re.S)
    if not m:
        return {}
    block = m.group(1)
    name_m = re.search(r"^name:\s*(.+)$", block, re.M)
    desc_m = re.search(r"^description:\s*(.+?)(?=\n[a-zA-Z0-9_-]+:|\Z)", block, re.S | re.M)
    return {
        "name": name_m.group(1).strip().strip('"').strip("'") if name_m else "",
        "description": desc_m.group(1).strip() if desc_m else "",
    }


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    skills_dir = repo_root / "skills"
    manifest_path = skills_dir / "manifest.json"
    router_path = skills_dir / "ROUTER.md"
    deps_path = repo_root / "DEPENDENCIES.md"

    errors = []

    # 1. Load manifest & check local $schema (A3)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    schema_rel = manifest.get("$schema", "")
    if not schema_rel or schema_rel.startswith("http"):
        errors.append(f"[A3] manifest.json $schema must be a local relative path, got: {schema_rel!r}")
    else:
        schema_file = (manifest_path.parent / schema_rel).resolve()
        if not schema_file.exists():
            errors.append(f"[A3] manifest.json $schema target missing on disk: {schema_file}")
        else:
            schema_data = json.loads(schema_file.read_text(encoding="utf-8"))
            allowed_statuses = set(
                schema_data["properties"]["slots"]["items"]["properties"]["status"]["enum"]
            )

    # 2. Discover skills/*/SKILL.md & check unique names (A6)
    skill_md_files = sorted(skills_dir.glob("*/SKILL.md"))
    seen_names = {}
    skill_frontmatters = {}
    for p in skill_md_files:
        fm = parse_frontmatter(p.read_text(encoding="utf-8"))
        sname = fm.get("name", "")
        if not sname:
            errors.append(f"[A6] Missing frontmatter name in {p}")
        elif sname in seen_names:
            errors.append(f"[A6] Duplicate skill name {sname!r} in {seen_names[sname]} and {p}")
        else:
            seen_names[sname] = p
            skill_frontmatters[sname] = fm

    # 3. Check 1:1 alignment across manifest, ROUTER.md §1, DEPENDENCIES.md §1, and disk (A2)
    manifest_owners = {s["owner"]: s for s in manifest.get("slots", [])}
    disk_owners = set(seen_names.keys())

    if set(manifest_owners.keys()) != disk_owners:
        errors.append(
            f"[A2] manifest owners {sorted(manifest_owners.keys())} != disk skills {sorted(disk_owners)}"
        )

    router_text = router_path.read_text(encoding="utf-8")
    router_s1 = router_text.split("## 2.")[0]
    router_rows = re.findall(r"^\|\s*\d+\s*\|[^|]+\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|", router_s1, re.M)
    router_owners = {owner: status for owner, status in router_rows}
    if set(router_owners.keys()) != disk_owners:
        errors.append(
            f"[A2] ROUTER.md §1 owners {sorted(router_owners.keys())} != disk skills {sorted(disk_owners)}"
        )

    deps_text = deps_path.read_text(encoding="utf-8")
    deps_s1 = deps_text.split("## 2.")[0]
    deps_rows = re.findall(r"^\|\s*\*\*([^*]+)\*\*\s*\|[^|]+\|\s*`([^`]+)`", deps_s1, re.M)
    deps_owners = {owner.strip(): status.strip() for owner, status in deps_rows}
    if set(deps_owners.keys()) != disk_owners:
        errors.append(
            f"[A2] DEPENDENCIES.md §1 owners {sorted(deps_owners.keys())} != disk skills {sorted(disk_owners)}"
        )

    # Check status agreement across all 3 registries
    for owner, slot in manifest_owners.items():
        st = slot["status"]
        if "allowed_statuses" in locals() and st not in allowed_statuses:
            errors.append(f"[A2] Invalid status {st!r} for {owner} in manifest.json")
        if router_owners.get(owner) != st:
            errors.append(f"[A2] Status mismatch for {owner}: manifest={st!r} vs ROUTER={router_owners.get(owner)!r}")
        if deps_owners.get(owner) != st:
            errors.append(f"[A2] Status mismatch for {owner}: manifest={st!r} vs DEPENDENCIES={deps_owners.get(owner)!r}")

    # 4. Check routing disambiguation rules (A1)
    dir_desc = skill_frontmatters.get("motion-video-director", {}).get("description", "")
    if "MANDATORY SUPREME" in dir_desc:
        errors.append("[A1] motion-video-director description still contains 'MANDATORY SUPREME' routing hijack")
    for mutex_owner in ("motion-video-deconstruct", "motion2code", "earshot", "real-sound"):
        if not manifest_owners.get(mutex_owner, {}).get("disambiguation"):
            errors.append(f"[A1] Missing `disambiguation` field in manifest.json for mutex slot {mutex_owner!r}")

    # 5. Check canonical script path convention (A4) in director/SKILL.md and ROUTER.md
    for check_file in (skills_dir / "motion-video-director" / "SKILL.md", router_path):
        txt = check_file.read_text(encoding="utf-8")
        # Flag any bare `scripts/...` not preceded by `/scripts/` (e.g. `skills/<x>/scripts/`)
        for line_no, line in enumerate(txt.splitlines(), 1):
            if "Bare `scripts/...`" in line or "裸写 `scripts/...`" in line:
                continue
            if re.search(r"(?<![/\w-])scripts/[a-zA-Z0-9_/-]+\.(?:py|mjs|ts|sh)", line):
                errors.append(f"[A4] Bare scripts/ path in {check_file.name}:{line_no} -> {line.strip()}")

    print("\n" + "=" * 76)
    print("VIDEO-AS-CODE AUTOMATED SKILL ARCHITECTURE & ROUTING AUDIT (A1/A2/A3/A4/A6)")
    print("=" * 76)
    print(f"  Skills on disk     : {len(disk_owners)} ({', '.join(sorted(disk_owners))})")
    print(f"  Manifest / ROUTER  : {len(manifest_owners)} / {len(router_owners)} (DEPENDENCIES: {len(deps_owners)})")
    print(f"  Local $schema      : {schema_rel}")

    if errors:
        print("\n[AUDIT FAILED] Violations found:")
        for e in errors:
            print(f"  - {e}")
        print("=" * 76 + "\n")
        return 1

    print("\n  [PASS] A1: Frontmatter routing boundaries & mutex disambiguation")
    print("  [PASS] A2: 1:1 owner & status alignment (disk == ROUTER == manifest == DEPENDENCIES)")
    print("  [PASS] A3: Local $schema exists & status enums valid")
    print("  [PASS] A4: Canonical skills/<skill>/scripts/... path convention clean")
    print("  [PASS] A6: Zero duplicate skill names")
    print("=" * 76)
    print("OVERALL VERDICT: SKILLS_AUDIT_PASSED (5/5)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
