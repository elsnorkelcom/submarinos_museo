#!/usr/bin/env python3
"""Cruza los vídeos de la lista de YouTube con las unidades del archivo.

Genera una propuesta de emparejamiento para revisar antes de tocar nada:
los vídeos de museo son de terceros y los títulos son libres («Recorrido en
4K del submarino ruso B-39...»), así que la máquina propone y la persona
decide. La hoja sigue siendo la fuente de verdad: el resultado se pega en su
columna de vídeo.

Señales que se usan, de más a menos fiable:
  nombre completo · numeral de casco · nombre sin prefijo · museo · ciudad

Uso:
    python scripts/match_youtube.py           # propuesta y informe
    python scripts/match_youtube.py --hoja    # además, la hoja con la columna Video
"""

from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
YOUTUBE = RAIZ / "data" / "youtube.json"
UNIDADES = RAIZ / "data" / "submarines.json"
CSV_SALIDA = RAIZ / "data" / "youtube_matches.csv"
INFORME = RAIZ / "data" / "youtube_matches.md"
HOJA_SALIDA = RAIZ / "data" / "hoja_con_videos.csv"

# Casos que el automático deja en el aire. Se revisan una vez a mano y quedan
# documentados aquí: sin esta tabla, dos vídeos de OTROS submarinos acabarían
# colgados de la unidad equivocada solo porque comparten museo.
DECISIONES = {
    "ETy9QX6qCnc": ("descartar", "Seehund: comparte el Marinemuseum con el U-10, pero no es el U-10"),
    "RADNlgj7Vjc": ("descartar", "U-17: no está en el archivo; solo comparte el museo de Speyer con el U-9"),
    "epEaui9HQkI": ("aplicar", "U-434 por nombre; la ficha K-434 es un duplicado del mismo barco"),
    "57OdYAnD7O4": ("aplicar", "Assegaai: el título no lo nombra, pero el canal es su museo"),
    "CDFZA5aSPSU": ("aplicar", "U-11: el título nombra Fehmarn, donde está el museo del U-11"),
    "e87kLcMBORg": ("aplicar", "U-11: el título nombra el U-Boot Museum de Fehmarn"),
}

# Prefijos de armada: no distinguen una unidad de otra.
PREFIJOS = {
    "uss", "hms", "hmas", "hmcs", "hnlms", "hnoms", "hsvms", "hdms", "hswms",
    "ins", "kri", "pns", "bap", "orp", "tcg", "jds", "sas", "nrp", "sm",
    "eml", "arc", "bns", "knm", "ara",
}

# Palabras que aparecen en medio mundo: no sirven para identificar.
GENERICAS = {
    "museum", "museo", "musee", "national", "nacional", "maritime", "maritimo",
    "maritima", "naval", "navy", "memorial", "center", "centre", "centro",
    "historic", "historico", "history", "historia", "science", "ciencia",
    "industry", "industria", "park", "parque", "base", "force", "fuerza",
    "submarine", "submarino", "submarines", "the", "of", "and", "de", "la",
    "del", "el", "los", "las", "y", "the", "for", "con", "sur", "sea", "war",
    "armed", "australian", "royal", "station", "port", "military", "militar",
    "united", "states", "museum)", "museum.", "technik", "bootmuseum",
    "ubootmuseum", "museums", "museumgmbh", "class", "clase", "south",
    "north", "east", "west", "korea", "edit", "proximamente", "próximamente",
}

PESOS = {
    "nombre": 100,
    "casco": 90,
    "numero": 85,
    "nucleo": 78,
    "palabra": 80,
    "museo": 46,
    "ciudad": 30,
}

# Los títulos llegan en cirílico y griego, y las unidades están en alfabeto
# latino: sin transliterar, «Лембит» o «К-3» no encuentran nada.
TRANSLITERACION = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "і": "i", "ї": "i", "є": "e", "ґ": "g",
    "α": "a", "β": "v", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "i",
    "θ": "th", "ι": "i", "κ": "k", "λ": "l", "μ": "m", "ν": "n", "ξ": "x",
    "ο": "o", "π": "p", "ρ": "r", "σ": "s", "ς": "s", "τ": "t", "υ": "y",
    "φ": "f", "χ": "kh", "ψ": "ps", "ω": "o",
}


# Letras que NFKD no descompone: sin plegarlas, «Sokół» no encuentra «Sokol».
PLEGADO = {
    "ł": "l", "ø": "o", "đ": "d", "ð": "d", "þ": "th", "æ": "ae", "œ": "oe",
    "ß": "ss", "ı": "i", "ŋ": "n", "ħ": "h", "ĸ": "k", "ƒ": "f", "ª": "a",
    "º": "o",
}


def normalizar(texto: str) -> str:
    """Minúsculas, sin acentos, sin letras exóticas y en alfabeto latino."""
    crudo = "".join(TRANSLITERACION.get(caracter, caracter) for caracter in str(texto or "").lower())
    descompuesto = unicodedata.normalize("NFKD", crudo)
    sin_tildes = "".join(caracter for caracter in descompuesto if not unicodedata.combining(caracter))
    plegado = "".join(PLEGADO.get(caracter, caracter) for caracter in sin_tildes)
    limpio = re.sub(r"[^\w]+", " ", plegado)
    return re.sub(r"\s+", " ", limpio).strip()


def seguro(texto: str) -> str:
    """La consola de Windows es cp1252; para imprimir hay que degradar."""
    return str(texto).encode("ascii", "replace").decode("ascii")


def numerales(nombre: str) -> list[str]:
    """Saca los numerales de casco de un nombre: U-995, S189, SS-581, Б-413."""
    encontrados = []

    for coincidencia in re.finditer(
        r"(?:^|[\s(])([A-Za-zА-Яа-я]{0,4})[-\s]?(\d{1,4})(?=$|[\s),.])", str(nombre or "")
    ):
        letras, digitos = coincidencia.group(1), coincidencia.group(2)
        encontrados.append(f"{letras.lower()} {digitos}".strip())

    return encontrados


def agujas_de(unidad: dict) -> list[dict]:
    agujas: list[dict] = []

    def anadir(tipo: str, valor: str, minimo: int, compacto: bool = False):
        valor = valor.strip()
        if valor and valor not in {aguja["valor"] for aguja in agujas}:
            agujas.append(
                {
                    "tipo": tipo,
                    "peso": PESOS[tipo],
                    "valor": valor,
                    "minimo": minimo,
                    "compacto": compacto,
                }
            )

    nombre = normalizar(unidad.get("name", ""))
    if nombre:
        anadir("nombre", nombre, 4)

        # «USS Cobia» -> «cobia»; si queda muy corto no sirve como señal.
        partes = [palabra for palabra in nombre.split() if palabra not in PREFIJOS]
        nucleo = " ".join(partes)
        if len(nucleo) >= 5 and nucleo != nombre:
            anadir("nucleo", nucleo, 5)

        # Nombres compuestos: «SAS Assegaai (Próximamente)» o «ORP Sokol (ex
        # KNM Stord S-308)». Una sola palabra distintiva ya identifica.
        for palabra in partes:
            if len(palabra) >= 5 and palabra not in GENERICAS:
                anadir("palabra", palabra, 5)

    for fuente in (unidad.get("name", ""), unidad.get("id", "")):
        for numeral in numerales(fuente):
            anadir("casco", numeral, 4, compacto=True)
            digitos = numeral.split()[-1]
            if len(digitos) >= 3:
                anadir("numero", digitos, 3)

    for palabra in normalizar(unidad.get("museum", "")).split():
        if len(palabra) >= 6 and palabra not in GENERICAS:
            anadir("museo", palabra, 6, compacto=True)

    for palabra in normalizar(unidad.get("city", "")).split():
        if len(palabra) >= 6 and palabra not in GENERICAS:
            anadir("ciudad", palabra, 6, compacto=True)

    return agujas


def evaluar(video: dict, agujas: list[tuple[dict, list[dict]]]) -> list[dict]:
    etiquetas = video.get("etiquetas") or []
    # La etiqueta 0 es el título y la 1 el canal; el resto (vistas, fecha) solo
    # mete ruido numérico.
    texto = normalizar(" ".join([video.get("titulo", "")] + etiquetas[:2]))
    rodeado = f" {texto} "

    # Búsqueda compacta (sin espacios) pero solo por ventanas de palabras
    # enteras: si no, «marinemuseum» casaría dentro de «submarinemuseum» y el
    # vídeo «Africa's First Submarine Museum» saldría como el U-10 de
    # Wilhelmshaven.
    palabras = texto.split()
    ventanas = {
        "".join(palabras[inicio : inicio + largo])
        for inicio in range(len(palabras))
        for largo in (1, 2, 3, 4)
        if inicio + largo <= len(palabras)
    }

    resultados = []

    for unidad, lista in agujas:
        for aguja in lista:
            if aguja["compacto"]:
                hallado = (
                    len(aguja["valor"]) >= aguja["minimo"]
                    and aguja["valor"].replace(" ", "") in ventanas
                )
            else:
                hallado = f" {aguja['valor']} " in rodeado

            if hallado:
                resultados.append(
                    {
                        "unidad": unidad,
                        "peso": aguja["peso"],
                        "tipo": aguja["tipo"],
                        "valor": aguja["valor"],
                    }
                )

    # Una unidad puede dispararse por varias señales: la mejor manda y cada
    # señal extra suma un poco, con techo en 100.
    por_unidad: dict[str, dict] = {}
    for resultado in resultados:
        clave = resultado["unidad"]["id"]
        actual = por_unidad.get(clave)

        if actual is None:
            por_unidad[clave] = resultado
            continue

        if resultado["peso"] > actual["peso"]:
            por_unidad[clave] = {
                **resultado,
                "peso": min(100, resultado["peso"] + 6),
            }
        else:
            actual["peso"] = min(100, actual["peso"] + 6)

    return sorted(por_unidad.values(), key=lambda item: -item["peso"])


def estado_de(candidatos: list[dict]) -> str:
    if not candidatos:
        return "sin coincidencia"

    mejor = candidatos[0]
    segundo = candidatos[1]["peso"] if len(candidatos) > 1 else 0
    margen = mejor["peso"] - segundo

    # El nombre, el numeral o una palabra propia del nombre identifican sin
    # duda. El museo y la ciudad solo orientan: hay museos con varias unidades.
    if mejor["peso"] >= 78 and margen >= 20:
        return "claro"
    if mejor["peso"] >= 46:
        return "revisar"
    return "dudoso"


def decidir(video_id: str, estado: str) -> str:
    """Aplicar, descartar o dejar fuera. La tabla manda sobre el automático."""
    fijada = DECISIONES.get(video_id)
    if fijada:
        return fijada[0]
    return "aplicar" if estado == "claro" else ""


def escribir_hoja(unidades: list[dict], filas: list[dict]) -> Path:
    """Copia la hoja publicada tal cual y le añade la columna Video rellena.

    Reescribir a mano 160 filas con su HTML de descripción es pedir un error:
    se baja la hoja publicada, se le añade una columna y se deja lista para
    importar en Sheets. El resto de columnas quedan intactas.
    """
    import import_sheets  # noqa: PLC0415  (la ruta de la hoja vive allí)

    originales = import_sheets.read_rows(import_sheets.POINTS_URL)
    if len(originales) != len(unidades):
        raise SystemExit(
            f"La hoja tiene {len(originales)} filas y el archivo {len(unidades)} unidades: "
            "no se puede mapear por número de fila."
        )

    principales = {fila["dossier"]: fila for fila in filas if fila["principal"]}

    columnas = [columna for columna in originales[0].keys() if columna != "Video"]
    columnas.append("Video")

    for numero, fila in enumerate(originales, start=1):
        emparejado = principales.get(f"SNK-{numero:03d}")
        fila["Video"] = emparejado["video_url"] if emparejado else ""

    HOJA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with HOJA_SALIDA.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas, extrasaction="ignore")
        escritor.writeheader()
        escritor.writerows(originales)

    return HOJA_SALIDA


def main() -> int:
    if not YOUTUBE.exists():
        raise SystemExit(
            "Falta data/youtube.json. Ejecuta antes: python scripts/import_youtube.py"
        )

    videos = json.loads(YOUTUBE.read_text(encoding="utf-8"))["lista"]
    unidades = json.loads(UNIDADES.read_text(encoding="utf-8"))

    agujas: list[tuple[dict, list[dict]]] = [(unidad, agujas_de(unidad)) for unidad in unidades]

    filas = []
    informe = []

    for orden, video in enumerate(videos, 1):
        canal = (video.get("etiquetas") or ["", ""])[1] if len(video.get("etiquetas") or []) > 1 else ""
        candidatos = evaluar(video, agujas)
        estado = estado_de(candidatos)
        mejor = candidatos[0] if candidatos else None
        decision = decidir(video["id"], estado)

        filas.append(
            {
                "orden": orden,
                "video_id": video["id"],
                "video_url": video["url"],
                "video_titulo": video["titulo"],
                "canal": canal,
                "estado": estado,
                "decision": decision,
                "unidad": mejor["unidad"]["name"] if mejor else "",
                "dossier": mejor["unidad"]["dossier"] if mejor else "",
                "principal": "",
                "puntaje": mejor["peso"] if mejor else 0,
                "senal": f"{mejor['tipo']}: {mejor['valor']}" if mejor else "",
                "alternativas": " | ".join(
                    f"{otro['unidad']['name']} ({otro['peso']}, {otro['tipo']}: {otro['valor']})"
                    for otro in candidatos[1:4]
                ),
            }
        )

        etiqueta = {"aplicar": "APLICA", "descartar": "DESCARTA"}.get(decision, "       ")
        informe.append(f"\n{orden:2}. [{estado.upper():3}] [{etiqueta:8}] {video['titulo'][:84]}")
        informe.append(f"    canal: {canal}")
        if not candidatos:
            informe.append("    -> sin candidatos")
        for posicion, candidato in enumerate(candidatos[:4]):
            marca = "->" if posicion == 0 else "  "
            informe.append(
                f"    {marca} {candidato['peso']:3}  {candidato['unidad']['name']:34} "
                f"{candidato['unidad']['dossier']:8} [{candidato['tipo']}: {candidato['valor']}] "
                f"({candidato['unidad']['museum'][:28]})"
            )
        if decision:
            fijada = DECISIONES.get(video["id"])
            informe.append(f"    {etiqueta}: {fijada[1] if fijada else 'coincidencia clara'}")

    # Un vídeo por unidad: manda el orden de la lista curada.
    principales: dict[str, dict] = {}
    for fila in filas:
        if fila["decision"] != "aplicar":
            continue
        clave = fila["unidad"]
        if clave not in principales or fila["orden"] < principales[clave]["orden"]:
            principales[clave] = fila
    for fila in filas:
        if principales.get(fila["unidad"]) is fila:
            fila["principal"] = "sí"

    CSV_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    prioridad = {"aplicar": 0, "": 1, "descartar": 2}
    ordenadas = sorted(
        filas,
        key=lambda fila: (
            prioridad[fila["decision"]],
            fila["unidad"] or fila["video_titulo"],
            fila["orden"],
        ),
    )
    with CSV_SALIDA.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=list(filas[0].keys()))
        escritor.writeheader()
        escritor.writerows(ordenadas)

    resumen: dict[str, int] = {}
    for fila in filas:
        resumen[fila["estado"]] = resumen.get(fila["estado"], 0) + 1

    aplicados = [fila for fila in filas if fila["decision"] == "aplicar"]
    descartados = [fila for fila in filas if fila["decision"] == "descartar"]

    por_unidad: dict[str, int] = {}
    for fila in aplicados:
        por_unidad[fila["unidad"]] = por_unidad.get(fila["unidad"], 0) + 1

    repetidas = {nombre: veces for nombre, veces in por_unidad.items() if veces > 1}

    encabezado = [
        f"VÍDEOS: {len(videos)}   UNIDADES EN EL ARCHIVO: {len(unidades)}",
        "ESTADOS: " + " · ".join(f"{clave} {valor}" for clave, valor in sorted(resumen.items())),
        f"A APLICAR: {len(aplicados)} vídeos en {len(por_unidad)} unidades"
        + (f" ({len(repetidas)} con más de un vídeo: " + ", ".join(sorted(repetidas)) + ")" if repetidas else ""),
        f"DESCARTADOS A MANO: {len(descartados)}"
        + (" — " + "; ".join(fila["video_titulo"][:44] for fila in descartados) if descartados else ""),
    ]

    INFORME.write_text("\n".join(encabezado + informe), encoding="utf-8")

    print(seguro(f"vídeos: {len(videos)}  unidades: {len(unidades)}"))
    for clave, valor in sorted(resumen.items()):
        print(seguro(f"  {clave}: {valor}"))
    print(seguro(f"  a aplicar: {len(aplicados)} vídeos → {len(por_unidad)} unidades"))
    print(seguro(f"escrito: {CSV_SALIDA.relative_to(RAIZ)}"))
    print(seguro(f"informe: {INFORME.relative_to(RAIZ)}"))

    if "--hoja" in sys.argv:
        print(seguro(f"hoja lista para importar: {escribir_hoja(unidades, filas).relative_to(RAIZ)}"))

    return 0


if __name__ == "__main__":
    sys.exit(main())
