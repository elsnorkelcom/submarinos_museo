#!/usr/bin/env python3
"""
Genera las monedas tipo "challenge coin" de las 5 situaciones del museo.

Salida: assets/img/coins/{flote,agua,tierra,cerrado,monumento}.svg

Uso:
    python scripts/make_coins.py

Los dibujos son propios (basados en los iconos del proyecto); no se usan
recursos con derechos de terceros.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "img" / "coins"

# Glifos en rejilla de 24x24, iguales a los símbolos del sprite de index.html.
# Los trazos sólidos usan fill="currentColor" para poder teñirlos por capa.
GLYPHS = {
    "flote": """
      <path d="M4.4 11.6c2.6-1.6 12.6-1.6 15.2 0 .9.5.6 1.9-.4 2.2-3 1-11.4 1-14.4 0-1-.3-1.3-1.7-.4-2.2z" fill="currentColor" stroke="none"/>
      <path d="M9.4 11.8V8.8h5.2v3"/>
      <path d="M12 8.8V6h1.3M10.4 6h5.2"/>
      <path d="M2.8 16.6h18.4"/>
      <path d="M4.6 19.4h2.4M9.4 19.4h2.4M14.2 19.4h2.4M19 19.4h1.4"/>""",
    "agua": """
      <path d="M7 13.4c0-3 2.2-4.8 5-4.8s5 1.8 5 4.8"/>
      <path d="M9.6 9.4V6.8h4.8v2.6"/>
      <path d="M12 6.8V4h1.3M10.4 4h5.2"/>
      <path d="M2.6 14.4c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.3 0"/>
      <path d="M2.6 17.8c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.3 0"/>
      <path d="M2.6 21.2c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.3 0"/>""",
    "tierra": """
      <path d="M4.6 11.4c2.7-1.5 12.1-1.5 14.8 0 .9.5.6 1.8-.4 2.1-2.9.9-11.1.9-14 0-1-.3-1.3-1.6-.4-2.1z"/>
      <circle cx="8.2" cy="12.2" r="1"/>
      <circle cx="12" cy="12.2" r="1"/>
      <circle cx="15.8" cy="12.2" r="1"/>
      <path d="M9.6 9.6V7.2h4.8v2.4"/>
      <path d="M12 7.2V4.6h1.3M10.4 4.6h5.2"/>
      <path d="M7.2 15.4l1.8 3M16.8 15.4l-1.8 3M5.2 18.4h13.6"/>""",
    "cerrado": """
      <path d="M4.6 11.4c2.7-1.5 12.1-1.5 14.8 0 .9.5.6 1.8-.4 2.1-2.9.9-11.1.9-14 0-1-.3-1.3-1.6-.4-2.1z"/>
      <circle cx="8.2" cy="12.2" r="1"/>
      <circle cx="12" cy="12.2" r="1"/>
      <circle cx="15.8" cy="12.2" r="1"/>
      <path d="M9.6 9.6V7.2h4.8v2.4"/>
      <path d="M12 7.2V4.6h1.3M10.4 4.6h5.2"/>
      <path d="M7.2 15.4l1.8 3M16.8 15.4l-1.8 3M5.2 18.4h13.6"/>
      <path d="M3.8 20.4 20.2 3.6"/>""",
    "monumento": """
      <path d="M10.2 3 12 1.6 13.8 3l1.2 9.6H9z" fill="currentColor" stroke="none"/>
      <path d="M8.2 12.6h7.6v2.6H8.2z"/>
      <path d="M5.6 15.2h12.8v2.8H5.6z"/>""",
}

SITUATIONS = [
    ("flote", "A FLOTE", "#9fb3c8"),
    ("agua", "EN EL AGUA", "#38a3ff"),
    ("tierra", "EN TIERRA", "#d16bff"),
    ("cerrado", "BAJO TECHO", "#35d64a"),
    ("monumento", "SOLO MONUMENTO", "#e0532b"),
]

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512" role="img" aria-label="Moneda commemorativa: {label_title}">
  <defs>
    <radialGradient id="face" cx="36%" cy="26%" r="82%">
      <stop offset="0" stop-color="#eef3f7"/>
      <stop offset="34%" stop-color="#bcc5cf"/>
      <stop offset="66%" stop-color="#7c8691"/>
      <stop offset="100%" stop-color="#3b434d"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="#f6f9fc"/>
      <stop offset="45%" stop-color="#949ea9"/>
      <stop offset="100%" stop-color="#424a54"/>
    </linearGradient>
    <radialGradient id="inner" cx="40%" cy="28%" r="80%">
      <stop offset="0" stop-color="#d3dae1"/>
      <stop offset="70%" stop-color="#9aa4ae"/>
      <stop offset="100%" stop-color="#646d78"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <path id="arcTop" d="M {ax1} {ay} A 110 110 0 0 1 {ax2} {ay}"/>
  </defs>

  <circle cx="128" cy="128" r="123" fill="none" stroke="url(#rim)" stroke-width="7" stroke-dasharray="1.6 3.4"/>
  <circle cx="128" cy="128" r="120" fill="url(#face)"/>
  <circle cx="128" cy="128" r="120" fill="none" stroke="#f6f9fc" stroke-opacity="0.45" stroke-width="1.4"/>
  <circle cx="128" cy="128" r="104" fill="none" stroke="#2c343d" stroke-opacity="0.5" stroke-width="2"/>
  <circle cx="128" cy="128" r="102" fill="url(#inner)"/>
  <circle cx="128" cy="128" r="102" fill="none" stroke="{color}" stroke-width="3" stroke-opacity="0.92"/>
  <circle cx="128" cy="128" r="94" fill="none" stroke="#2c343d" stroke-opacity="0.35" stroke-width="1"/>

  <text font-family="'Arial Narrow', Arial, sans-serif" font-size="11.5" font-weight="700" letter-spacing="1.4" fill="#eef3f7" opacity="0.7" transform="translate(0 1.1)">
    <textPath href="#arcTop" startOffset="50%" text-anchor="middle">SUBMARINOS MUSEO</textPath>
  </text>
  <text font-family="'Arial Narrow', Arial, sans-serif" font-size="11.5" font-weight="700" letter-spacing="1.4" fill="#333c46">
    <textPath href="#arcTop" startOffset="50%" text-anchor="middle">SUBMARINOS MUSEO</textPath>
  </text>

  <g transform="translate(128 119) scale(4.8) translate(-12 -12)"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
     color="#2b333c" stroke="#2b333c" opacity="0.55">
    <g transform="translate(0.5 0.7)">{glyph}</g>
  </g>
  <g transform="translate(128 119) scale(4.8) translate(-12 -12)"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
     color="#f4f8fb" stroke="#f4f8fb" opacity="0.8">
    <g transform="translate(-0.4 -0.5)">{glyph}</g>
  </g>
  <g transform="translate(128 119) scale(4.8) translate(-12 -12)"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
     color="#46505b" stroke="#46505b">
    <g>{glyph}</g>
  </g>

  <rect x="46" y="181" width="164" height="28" rx="3" fill="#131b21" opacity="0.86"/>
  <rect x="46" y="181" width="164" height="28" rx="3" fill="none" stroke="{color}" stroke-width="1.2" opacity="0.85"/>
  <text x="128" y="200" text-anchor="middle" font-family="'Arial Narrow', Arial, sans-serif"
        font-size="{label_size}" font-weight="700" letter-spacing="{label_track}" fill="{color}">{label}</text>
  <circle cx="36" cy="195" r="2.4" fill="{color}"/>
  <circle cx="220" cy="195" r="2.4" fill="{color}"/>

  <path d="M 40 70 A 100 100 0 0 1 128 28 A 100 100 0 0 1 120 46 A 84 84 0 0 0 56 78 Z"
        fill="url(#sheen)" opacity="0.5"/>
</svg>
"""


def arc_points(radius: float, half_span_deg: float, center: float = 128.0) -> tuple[float, float, float, float]:
    import math

    angle = math.radians(half_span_deg)
    x1 = center - radius * math.cos(angle)
    x2 = center + radius * math.cos(angle)
    y = center - radius * math.sin(angle)
    return x1, y, x2, y


def build(key: str, label: str, color: str) -> str:
    ax1, ay, ax2, _ = arc_points(110, 54)
    label_size = 13.5 if len(label) <= 11 else 11.4
    label_track = 2.6 if len(label) <= 11 else 1.8
    return TEMPLATE.format(
        label=label,
        label_title=label.title(),
        label_size=f"{label_size:.1f}",
        label_track=f"{label_track:.1f}",
        color=color,
        glyph=GLYPHS[key],
        ax1=f"{ax1:.1f}",
        ax2=f"{ax2:.1f}",
        ay=f"{ay:.1f}",
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for key, label, color in SITUATIONS:
        path = OUT_DIR / f"{key}.svg"
        path.write_text(build(key, label, color), encoding="utf-8")
        print(f"OK {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
