
from __future__ import annotations
import argparse, json
from pathlib import Path
from .service import NirikshakAI

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("json_file", help="Project snapshot JSON file")
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()

    payload = json.loads(Path(args.json_file).read_text(encoding="utf-8"))
    ai = NirikshakAI(args.root)
    print(json.dumps(ai.analyze(payload, args.top_k), indent=2))

if __name__ == "__main__":
    main()
