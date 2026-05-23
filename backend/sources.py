"""Helpers for classifying source URLs used in demo data.

Each opportunity row carries a list of {url, note} dicts; this module turns
each URL into a human-readable `source_type` label without making any
network calls. Order matters in SOURCE_TYPE_RULES — more specific matches
go first.
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

# (substring-in-hostname, label). First match wins.
SOURCE_TYPE_RULES: list[tuple[str, str]] = [
    # Forums / community
    ("news.ycombinator.com", "HackerNews thread"),
    ("indiehackers.com", "Indie Hackers thread"),
    ("teamblind.com", "TeamBlind thread"),
    ("reddit.com", "Reddit thread"),
    ("discuss.codecademy.com", "Vendor community"),
    # Curated newsletters / podcasts
    ("lennysnewsletter.com", "Lenny's newsletter"),
    ("aatir.substack.com", "Substack article"),
    ("uxpsychology.substack.com", "Substack article"),
    ("substack.com", "Substack article"),
    # Industry analysts / research
    ("nngroup.com", "NN/g article"),
    ("mckinsey.com", "McKinsey report"),
    ("careerkarma.com", "Career Karma report"),
    ("gpstrategies.com", "Industry report"),
    ("clo100.com", "Industry article"),
    ("departmentofproduct.com", "Industry article"),
    ("looppanel.com", "Industry article"),
    ("blog.logrocket.com", "Industry article"),
    ("resumeworded.com", "Industry article"),
    ("bestcolleges.com", "Industry article"),
    ("productplan.com", "Industry article"),
    ("craft.io", "Industry guide"),
    ("koji.so", "Industry article"),
    ("thoughtbot.com", "Industry article"),
    ("f22labs.com", "Industry article"),
    ("nicheshunter.app", "Industry article"),
    ("nomadvisamalta.com", "Industry article"),
    ("mavenanalytics.io", "Industry data"),
    ("landpmjob.com", "Industry review"),
    ("sirjohnnymai.com", "Industry review"),
    # Personal blogs / Medium
    ("didoo.medium.com", "Medium article"),
    ("medium.com", "Medium article"),
    ("danielkliewer.com", "Blog post"),
    ("alexberman.com", "Blog post"),
    ("dev.to", "Dev.to article"),
    # Research papers
    ("sciencedirect.com", "Research paper"),
    ("mdpi.com", "Research paper"),
    # Vendor pricing / product pages
    ("aha.io", "Vendor (Aha)"),
    ("productboard.com", "Vendor (Productboard)"),
    ("figma.com", "Vendor (Figma)"),
    ("dovetail.com", "Vendor (Dovetail)"),
    ("canva.com", "Vendor (Canva)"),
    ("notion.com", "Vendor (Notion)"),
    ("producthunt.com", "Vendor (Product Hunt)"),
    ("coursera.org", "Vendor (Coursera)"),
    ("codecademy.com", "Vendor (Codecademy)"),
    ("help.maven.com", "Vendor (Maven)"),
    ("maven.com", "Vendor (Maven)"),
    ("learn.deeplearning.ai", "Vendor (DeepLearning.AI)"),
    ("deeplearning.ai", "Vendor (DeepLearning.AI)"),
    ("chatgpt.com", "Vendor (OpenAI)"),
    ("reforge.helpscoutdocs.com", "Vendor (Reforge)"),
    ("learning.linkedin.com", "Vendor (LinkedIn Learning)"),
    ("business.linkedin.com", "Vendor (LinkedIn Learning)"),
    ("premium.linkedin.com", "Vendor (LinkedIn)"),
    ("linkedin.com", "Vendor (LinkedIn)"),
    ("pluralsight.com", "Vendor (Pluralsight)"),
    ("youtube.com", "Vendor (YouTube)"),
]


def source_type_from_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme == "pasted":
        return "Pasted insight"
    host = (parsed.hostname or "").lower()
    for pattern, label in SOURCE_TYPE_RULES:
        if pattern in host:
            return label
    return "Web source"


_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    return _slug_re.sub("-", text.lower()).strip("-")
