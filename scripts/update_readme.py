#!/usr/bin/env python3
"""Refresh auto-generated values in README.md (stdlib only, idempotent)."""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

CAREER_START = date(2017, 2, 1)
README = Path(__file__).resolve().parent.parent / "README.md"


def years_of_experience(today: date) -> int:
    years = today.year - CAREER_START.year
    if (today.month, today.day) < (CAREER_START.month, CAREER_START.day):
        years -= 1
    return years


def render(text: str, today: date) -> str:
    years = str(years_of_experience(today))
    # Plain-text markers: <!--YEARS-->9<!--/YEARS-->
    text = re.sub(r"(<!--YEARS-->)\d+(<!--/YEARS-->)", rf"\g<1>{years}\g<2>", text)
    # Inside URLs/code blocks comments don't work, so use a URL-encoded token: for+9%2B+years
    text = re.sub(r"(for\+)\d+(%2B\+years)", rf"\g<1>{years}\g<2>", text)
    # Inside the About Me code block: experience: "9+ years"
    text = re.sub(r'(experience: ")\d+(\+ years")', rf"\g<1>{years}\g<2>", text)
    return text


def main() -> int:
    original = README.read_text(encoding="utf-8")
    updated = render(original, date.today())
    if updated != original:
        README.write_text(updated, encoding="utf-8")
        print(f"README.md updated ({years_of_experience(date.today())}+ years)")
    else:
        print("README.md already up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
