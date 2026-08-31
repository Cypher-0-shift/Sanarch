"""
migrate_sanarch_id_format.py
Final format: SAN-{CC}-{YY}{G}{AB}{T}{IX}{SERIAL}{CK}
Example:      SAN-IN-26X18P00IHC9E7ZP  (2 hyphens, 23 chars)

Handles any old format by stripping all hyphens and rebuilding.
Usage:
  python migrate_sanarch_id_format.py         # dry run
  python migrate_sanarch_id_format.py --live  # write to Firestore
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.firestore import get_db

DRY_RUN = "--live" not in sys.argv


def reformat_id(old_id: str):
    if not old_id or not old_id.upper().startswith("SAN"):
        return None
    stripped = old_id.upper().replace("-", "")
    if len(stripped) != 21 or not stripped.startswith("SAN"):
        return None
    cc     = stripped[3:5]
    yy     = stripped[5:7]
    g      = stripped[7:8]
    ab     = stripped[8:10]
    t      = stripped[10:11]
    ix     = stripped[11:13]
    serial = stripped[13:19]
    ck     = stripped[19:21]
    # Final format: SAN-{CC}-{YY}{G}{AB}{T}{IX}{SERIAL}{CK}
    new_id = f"SAN-{cc}-{yy}{g}{ab}{t}{ix}{serial}{ck}"
    if new_id == old_id.upper():
        return None
    return new_id


def migrate_collection(db, collection_name, id_field="sanarch_id"):
    print(f"\n-- {collection_name} --")
    docs = list(db.collection(collection_name).stream())
    updated = skipped = 0
    for doc in docs:
        data = doc.to_dict()
        old_id = data.get(id_field)
        if not old_id:
            continue
        new_id = reformat_id(old_id)
        if new_id is None:
            skipped += 1
            continue
        print(f"  [{doc.id}]  {old_id}  =>  {new_id}")
        updated += 1
        if not DRY_RUN:
            doc.reference.update({id_field: new_id})
    print(f"  Updated: {updated}  |  Skipped: {skipped}")
    return updated


def main():
    print("=" * 60)
    print("Sanarch ID Format Migration -> SAN-CC-{rest}")
    print(f"Mode: {'DRY RUN' if DRY_RUN else '*** LIVE WRITE ***'}")
    print("=" * 60)
    db = get_db()
    total = 0
    for col in ["users", "patients", "profiles"]:
        total += migrate_collection(db, col)
    print(f"\nTotal records updated: {total}")
    print("Done.")

if __name__ == "__main__":
    main()
