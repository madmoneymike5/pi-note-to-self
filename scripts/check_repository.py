#!/usr/bin/env python3
"""Validate the small, documentation-only repository bootstrap."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

MARKDOWN_LINK = re.compile(r"!?(?:\[[^\]]*\])\(([^)\s]+)")
TRAILING_WHITESPACE = re.compile(rb"[ \t]+(?:\r?\n|$)")


def git_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise RuntimeError("run this check inside a Git repository")
    return Path(result.stdout.strip()).resolve()


def tracked_files(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=root,
        check=True,
        capture_output=True,
    )
    return [root / Path(name) for name in result.stdout.decode().split("\0") if name]


def check_json(path: Path, errors: list[str]) -> None:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        errors.append(f"{path}: invalid JSON ({exc})")


def check_markdown_links(path: Path, root: Path, errors: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        errors.append(f"{path}: cannot read Markdown ({exc})")
        return

    for raw_target in MARKDOWN_LINK.findall(text):
        target = unquote(raw_target.strip("<>"))
        if not target or target.startswith("#") or "://" in target or target.startswith(("mailto:", "tel:")):
            continue
        target_path = target.split("#", 1)[0].split("?", 1)[0]
        if not target_path:
            continue
        candidate = (path.parent / target_path).resolve()
        try:
            candidate.relative_to(root)
        except ValueError:
            errors.append(f"{path}: relative link escapes repository: {raw_target}")
            continue
        if not candidate.exists():
            errors.append(f"{path}: broken relative link: {raw_target}")


def main() -> int:
    try:
        root = git_root()
        files = tracked_files(root)
    except (OSError, subprocess.CalledProcessError, RuntimeError) as exc:
        print(f"repository check failed: {exc}", file=sys.stderr)
        return 1

    errors: list[str] = []
    for path in files:
        try:
            data = path.read_bytes()
        except OSError as exc:
            errors.append(f"{path}: cannot read file ({exc})")
            continue

        for line_number, line in enumerate(data.splitlines(keepends=True), start=1):
            if TRAILING_WHITESPACE.search(line):
                errors.append(f"{path}:{line_number}: trailing whitespace")

        if path.suffix == ".json":
            check_json(path, errors)
        elif path.suffix.lower() in {".md", ".markdown"}:
            check_markdown_links(path, root, errors)

    if errors:
        print("repository check failed:", file=sys.stderr)
        print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1

    print(f"repository check passed: {len(files)} tracked file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
