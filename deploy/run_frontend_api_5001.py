import sys
from pathlib import Path

from flask import send_from_directory

REPO = Path(__file__).resolve().parents[1]
API_DIR = REPO / "backend" / "api"
BUILD_DIR = REPO / "web" / "build"
STATIC_DIR = BUILD_DIR / "static"

sys.path.insert(0, str(API_DIR))
from server import app  # noqa: E402

app.static_folder = str(STATIC_DIR)
app.static_url_path = "/static"


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    target = BUILD_DIR / path
    if path and target.is_file():
        return send_from_directory(str(BUILD_DIR), path)
    return send_from_directory(str(BUILD_DIR), "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
