#!/usr/bin/env python3
"""
Genera data/submarines.json y data/config.json a partir de las hojas publicadas.

Uso:
    python scripts/import_sheets.py
    python scripts/import_sheets.py --points-file puntos.csv --config-file config.csv

El sitio NO consulta Google Sheets en runtime: lee los JSON locales.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import unicodedata
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

POINTS_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQTuLWdJ1ZNR9dQ9sHcDOWe1-HPnIMsAKtCRzVEG_WZG4Za_3Mp-X3vkWCFlSwuNQSfEZ_mmNmTcIgb"
    "/pub?gid=164271551&single=true&output=csv"
)
CONFIG_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQTuLWdJ1ZNR9dQ9sHcDOWe1-HPnIMsAKtCRzVEG_WZG4Za_3Mp-X3vkWCFlSwuNQSfEZ_mmNmTcIgb"
    "/pub?gid=796922007&single=true&output=csv"
)

COUNTRY_FIXES = {
    "USA": "Estados Unidos",
    "Turkiye": "Turquía",
    "Japon": "Japón",
    "Sudafrica": "Sudáfrica",
    "Canada": "Canadá",
    "Peru": "Perú",
    "Norcorea": "Corea del Norte",
    "Surcorea": "Corea del Sur",
    "Paises Bajos": "Países Bajos",
    "GRECE": "Grecia",
    "Pakistan": "Pakistán",
    "España": "España",
}

TYPE_LABELS = {
    "Diesel": "Diésel",
    "Nuclear": "Nuclear",
    "Electric": "Eléctrico",
    "Hand-crank": "Manivela",
}

TYPE_KEYS = {
    "Diesel": "diesel",
    "Nuclear": "nuclear",
    "Electric": "electric",
    "Hand-crank": "hand-crank",
}

# Situación del museo. En la hoja puedes escribir la variable (flote, agua, tierra,
# cerrado, monumento) o pegar la URL del icono: el importador la reconoce igual.
SITUATION_LABELS = {
    "flote": "A flote",
    "agua": "En el agua",
    "tierra": "En tierra",
    "cerrado": "Bajo techo",
    "monumento": "Solo monumento",
}

SITUATION_SYNONYMS = (
    ("flote", ("a flote", "flote", "afloat", "velas", "boyante", "superficie")),
    ("agua", ("en el agua", "en agua", "agua", "water", "sumergid")),
    ("tierra", ("en tierra", "tierra", "en seco", "seco", "on land", "land", "dry")),
    (
        "cerrado",
        ("bajo techo", "en cerrado", "cerrado", "cubierto", "under cover", "indoor", "closed"),
    ),
    ("monumento", ("monumento", "monument", "memorial")),
)

# Orden de prioridad: columna propia, luego la URL del icono y por último la columna antigua.
SITUATION_COLUMNS = ("Situacion", "Situation", "Icon URL", "Icon", "Marker Icon")


def normalize_token(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    ascii_value = ascii_value.lower()
    for char in ("+", "%20", "_", "-", "/", "\\"):
        ascii_value = ascii_value.replace(char, " ")
    return re.sub(r"\s+", " ", ascii_value).strip()


def field(row: dict[str, str], *names: str) -> str:
    """Busca una columna por nombre sin importar mayúsculas ni acentos."""
    wanted = {normalize_token(name) for name in names}
    for key, value in row.items():
        if not key:
            continue
        if normalize_token(key) in wanted:
            cleaned = clean(value)
            if cleaned:
                return cleaned
    return ""


def pick_situation(row: dict[str, str]) -> str:
    for column in SITUATION_COLUMNS:
        raw = field(row, column)
        if not raw:
            continue
        token = normalize_token(raw)
        for key, synonyms in SITUATION_SYNONYMS:
            if any(synonym in token for synonym in synonyms):
                return key
    return ""


def fetch_bytes(source: str) -> bytes:
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(
            source,
            headers={"User-Agent": "Mozilla/5.0 (compatible; SubmarinosMuseo/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read()
    return Path(source).read_bytes()


def read_rows(source: str) -> list[dict[str, str]]:
    raw = fetch_bytes(source)
    text = raw.decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    ascii_value = ascii_value.lower()
    ascii_value = re.sub(r"[^a-z0-9]+", "-", ascii_value)
    return ascii_value.strip("-") or "submarino"


def parse_year(value: str | None) -> int | None:
    match = re.search(r"(1[89]\d{2}|20\d{2})", value or "")
    return int(match.group(1)) if match else None


def normalize_country(value: str) -> str:
    value = clean(value)
    return COUNTRY_FIXES.get(value, value)


def read_settings(rows: list[dict[str, str]]) -> dict[str, str]:
    return {
        clean(row.get("Setting")): clean(row.get("Value"))
        for row in rows
        if clean(row.get("Setting"))
    }


def pick_video(row: dict[str, str]) -> str:
    """Acepta la columna de video con varios nombres posibles."""
    for key in ("Video", "Video URL", "YouTube", "Youtube", "video_url"):
        value = clean(row.get(key))
        if value:
            return value

    for key, value in row.items():
        if not key:
            continue
        lowered = key.lower()
        if "video" in lowered or "youtube" in lowered:
            cleaned = clean(value)
            if cleaned:
                return cleaned

    return ""


def build_submarines(
    rows: list[dict[str, str]], featured_names: set[str] | None = None
) -> list[dict]:
    submarines: list[dict] = []
    used_ids: set[str] = set()
    featured_lookup = {name.strip().lower() for name in (featured_names or set()) if name.strip()}

    for index, row in enumerate(rows, start=1):
        name = clean(row.get("Name"))
        if not name:
            continue

        lat = clean(row.get("Latitude"))
        lng = clean(row.get("Longitude"))
        try:
            lat_f = float(lat)
            lng_f = float(lng)
        except ValueError:
            continue

        raw_type = clean(row.get("Group"))
        type_key = TYPE_KEYS.get(raw_type, slugify(raw_type) or "otro")
        type_label = TYPE_LABELS.get(raw_type, raw_type or "Sin clasificar")

        name = name.replace("Proximamente", "Próximamente")
        status = "coming-soon" if "próximamente" in name.lower() else "open"

        museum = clean(row.get("Location"))
        city = clean(row.get("City / Town"))
        country = normalize_country(row.get("Country"))
        nationality = clean(row.get("Nationality"))
        submarine_class = clean(row.get("Clase"))
        launch_year = parse_year(row.get("Launch year"))
        image = clean(row.get("Image"))
        link = clean(row.get("URL"))
        video = pick_video(row)
        is_featured = (
            clean(row.get("Featured")).upper() == "TRUE"
            or name.strip().lower() in featured_lookup
        )
        situation = pick_situation(row)

        base_id = slugify(name)
        sub_id = base_id
        suffix = 2
        while sub_id in used_ids:
            sub_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(sub_id)

        description_parts: list[str] = []
        if submarine_class:
            description_parts.append(f"Clase {submarine_class}.")
        if launch_year:
            description_parts.append(f"Botado en {launch_year}.")
        if museum:
            location = ", ".join(part for part in (museum, city, country) if part)
            description_parts.append(f"Se conserva en {location}.")

        submarines.append(
            {
                "id": sub_id,
                "dossier": f"SNK-{index:03d}",
                "name": name,
                "type": raw_type or "Sin clasificar",
                "typeKey": type_key,
                "typeLabel": type_label,
                "class": submarine_class,
                "country": country,
                "city": city,
                "museum": museum,
                "nationality": nationality,
                "lat": round(lat_f, 6),
                "lng": round(lng_f, 6),
                "launchYear": launch_year,
                "image": image,
                "videoUrl": video,
                "link": link,
                "situation": situation,
                "situationLabel": SITUATION_LABELS.get(situation, ""),
                "featured": is_featured,
                "afloat": situation in ("flote", "agua")
                or "a flote" in clean(row.get("Marker Icon")).lower(),
                "status": status,
                "description": " ".join(description_parts),
            }
        )

    return submarines


def build_config(rows: list[dict[str, str]]) -> dict:
    settings = read_settings(rows)

    social = {
        key: settings.get(key, "")
        for key in (
            "linkedin_url",
            "facebook_url",
            "instagram_url",
            "twitter_url",
            "website_url",
        )
    }
    # Quita los enlaces de plantilla que todavía no son reales.
    social = {
        key: value
        for key, value in social.items()
        if value
        and "tu-usuario" not in value
        and "tu-pagina" not in value
        and value.startswith("http")
    }

    return {
        "heroTitle": settings.get("hero_title", "Submarinos Museo del Mundo"),
        "heroSubtitle": settings.get(
            "hero_subtitle",
            "Un archivo interactivo de gigantes de acero y sus historias.",
        ),
        "heroCta": settings.get("hero_button_text", "Iniciar exploración"),
        "statsTitle": settings.get("stats_title", "El archivo en números"),
        "featuredTitle": settings.get("featured_title", "Gigantes de la historia"),
        "aboutTitle": settings.get("about_title", "Sobre este proyecto"),
        "aboutText": settings.get(
            "about_text",
            "Este mapa interactivo es una iniciativa de <b>elSnorkel.com</b> para crear un archivo completo y accesible de todos los submarinos que se preservan como museos alrededor del mundo.",
        ),
        "footerText": re.sub(
            r"©\s*\d{4}",
            f"© {date.today().year}",
            settings.get(
                "footer_text",
                f"© {date.today().year} elSnorkel.com. Todos los derechos reservados.",
            ),
        ),
        "logo": "assets/img/logo.jpg",
        "heroImage": "assets/img/cobia.webp",
        "social": social,
        "source": {
            "points": POINTS_URL,
            "config": CONFIG_URL,
        },
        "generatedAt": date.today().isoformat(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points-file", help="CSV local de puntos (opcional)")
    parser.add_argument("--config-file", help="CSV local de configuración (opcional)")
    args = parser.parse_args()

    point_rows = read_rows(args.points_file or POINTS_URL)
    config_rows = read_rows(args.config_file or CONFIG_URL)

    settings = read_settings(config_rows)
    featured_names = {
        part.strip()
        for part in settings.get("featured_submarine_names", "").split(",")
        if part.strip()
    }

    submarines = build_submarines(point_rows, featured_names)
    config = build_config(config_rows)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "submarines.json").write_text(
        json.dumps(submarines, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "config.json").write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    types: dict[str, int] = {}
    countries: set[str] = set()
    situations: dict[str, int] = {}
    for submarine in submarines:
        types[submarine["typeLabel"]] = types.get(submarine["typeLabel"], 0) + 1
        countries.add(submarine["country"])
        if submarine["situationLabel"]:
            situations[submarine["situationLabel"]] = (
                situations.get(submarine["situationLabel"], 0) + 1
            )

    print(f"OK: {len(submarines)} submarinos, {len(countries)} países")
    print("Tipos:", ", ".join(f"{name} {count}" for name, count in types.items()))
    print(
        "Situación:",
        ", ".join(f"{name} {count}" for name, count in situations.items()) or "sin datos",
    )
    print(f"Escrito en {DATA_DIR}")


if __name__ == "__main__":
    main()
