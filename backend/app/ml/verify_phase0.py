#!/usr/bin/env python3
"""Verificación completa de Fase 0: datasets + dataset builder."""
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def verify():
    """Run full Fase 0 verification."""
    print("\n" + "="*60)
    print("VERIFICACIÓN FASE 0 — IA Predictiva v2")
    print("="*60 + "\n")

    # 1. Config
    print("1️⃣  Data sources config...")
    from app.ml.data_sources.config import (
        DATA_DIR, CHIRPS_DIR, divipola_to_coords, DEPT_CENTROIDS
    )
    print(f"   DATA_DIR: {DATA_DIR}")
    print(f"   CHIRPS_DIR: {CHIRPS_DIR}")
    print(f"   Departamentos: {len(DEPT_CENTROIDS)}")
    assert divipola_to_coords(76275) == (-76.4985, 3.8509), "DIVIPOLA lookup broken"
    print("   ✅ Config OK\n")

    # 2. CHIRPS
    print("2️⃣  CHIRPS loader...")
    from app.ml.data_sources.chirps import available_year_range, compute_precip_features
    yr_range = available_year_range()
    print(f"   Rango descargado: {yr_range}")
    if yr_range:
        feats = compute_precip_features(4.71, -74.07, yr_range[0]+5, 7)
        print(f"   Features de prueba: {len(feats)} keys")
        print(f"   Coverage: {feats['chirps_coverage']:.1%}")
        assert feats['chirps_coverage'] > 0, "CHIRPS coverage broken"
        print("   ✅ CHIRPS OK\n")
    else:
        print("   ⚠️  CHIRPS no descargado\n")

    # 3. ERA5
    print("3️⃣  ERA5-Land...")
    from app.ml.data_sources.era5 import is_available
    avail = is_available()
    print(f"   Disponible: {avail}")
    if avail:
        print("   ✅ ERA5 OK\n")
    else:
        print("   ⚠️  ERA5 no descargado (pendiente: acepta licencia CDS)\n")

    # 4. Labels
    print("4️⃣  Labels (UNGRD + HDX)...")
    from app.ml.data_sources.ungrd import load_all_labels
    labels = load_all_labels()
    print(f"   Total labels: {len(labels):,}")
    event_dist = labels['event_type'].value_counts().to_dict() if not labels.empty else {}
    print(f"   Event dist: {event_dist}")
    year_range = (int(labels['year'].min()), int(labels['year'].max())) if not labels.empty else None
    print(f"   Rango años: {year_range}")
    print(f"   Nulos (lat/lon): {labels[['lat','lon']].isna().sum().to_dict()}")
    assert not labels.empty, "Labels empty"
    assert labels['lat'].notna().all(), "Lat has nulls"
    assert labels['lon'].notna().all(), "Lon has nulls"
    print("   ✅ Labels OK\n")

    # 5. Dataset builder
    print("5️⃣  Dataset builder...")
    from app.ml.riesgo_climatico_dataset import dataset_summary, build_dataset

    summary = dataset_summary()
    print(f"   Summary: {summary}")

    try:
        print("   Building dataset (flood, cached)...")
        X_tr, y_tr, X_val, y_val, X_te, y_te, feats = build_dataset('flood')
        print(f"   Train: X{X_tr.shape} y{y_tr.shape} | pos={y_tr.mean()*100:.1f}%")
        print(f"   Val:   X{X_val.shape} y{y_val.shape} | pos={y_val.mean()*100 if len(y_val) > 0 else 0:.1f}%")
        print(f"   Test:  X{X_te.shape} y{y_te.shape} | pos={y_te.mean()*100 if len(y_te) > 0 else 0:.1f}%")
        print(f"   Features: {len(feats)} | no NaN: {not __import__('numpy').isnan(X_tr).any()}")

        if len(X_val) > 0 and len(X_te) > 0:
            print("   ✅ Dataset OK (train + val + test poblados)\n")
        else:
            print("   ⚠️  Val/test vacíos (CHIRPS aún se está descargando)\n")
    except Exception as e:
        print(f"   ❌ Dataset build failed: {e}\n")
        return False

    print("="*60)
    print("RESUMEN:")
    print("="*60)
    print("✅ Config OK")
    print(f"{'✅' if yr_range else '⚠️ '} CHIRPS {f'{yr_range}' if yr_range else 'pendiente'}")
    print(f"{'✅' if avail else '⚠️ '} ERA5 {'disponible' if avail else 'pendiente (licencia CDS)'}")
    print(f"✅ Labels OK ({len(labels):,} eventos)")
    print(f"✅ Dataset builder OK")
    print("\n📋 Próximos pasos:")
    print("   1. Finalizar CHIRPS (~40 min)")
    print("   2. Aceptar licencia ERA5 (CDS)")
    print("   3. Descargar DesInventar (db.desinventar.org)")
    print("   4. Ejecutar: build_dataset(force_rebuild=True)")
    print("   5. Revisar splits (train/val/test)")
    print("\n✨ Fase 0 listo para ir a Fase 1 (LSTM forecasting)")

    return True

if __name__ == '__main__':
    success = verify()
    sys.exit(0 if success else 1)
