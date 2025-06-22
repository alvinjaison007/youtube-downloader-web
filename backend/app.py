from flask import Flask, request, jsonify, send_file, session
from yt_dlp import YoutubeDL
from flask_cors import CORS
from flask_session import Session
import os

# --- App Setup ---
app = Flask(__name__)
app.secret_key = "a_random_flask_secret_key"  # Required for session
app.config["SESSION_TYPE"] = "filesystem"     # Store sessions on disk

# Enable CORS with support for cookies
CORS(app, supports_credentials=True)

# Setup server-side session
Session(app)

# --- Login Configuration ---
SECRET_PASSWORD = "Pinky123!@#"  # Strong password stored ONLY in backend


# --- Routes ---

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    password = data.get("password")

    if password == SECRET_PASSWORD:
        session["authenticated"] = True
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Incorrect password"}), 401

@app.route("/check-auth", methods=["GET"])
def check_auth():
    return jsonify({"authenticated": session.get("authenticated", False)})


@app.route("/formats", methods=["POST"])
def get_formats():
    if not session.get("authenticated"):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    url = data.get("url")
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    ydl_opts = {"quiet": True, "listformats": True, "skip_download": True}
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        formats = [
            {
                "format_id": f["format_id"],
                "ext": f["ext"],
                "resolution": f.get("resolution", ""),
                "format_note": f.get("format_note", "")
            }
            for f in info["formats"]
        ]
    return jsonify({"title": info["title"], "formats": formats})


@app.route("/download", methods=["POST"])
def download():
    if not session.get("authenticated"):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    url = data.get("url")
    format_id = data.get("format_id")

    if not url or not format_id:
        return jsonify({"error": "Missing parameters"}), 400

    # Remove previously downloaded files
    for f in os.listdir():
        if f.startswith("downloaded."):
            os.remove(f)

    # Determine extension
    ext = "mp4"
    with YoutubeDL({"quiet": True}) as ydl:
        info_dict = ydl.extract_info(url, download=False)
        for f in info_dict["formats"]:
            if f["format_id"] == format_id:
                ext = f["ext"]
                break

    filename = f"downloaded.{ext}"
    ydl_opts = {
        "format": format_id,
        "outtmpl": filename,
        "quiet": True,
    }

    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    return send_file(filename, as_attachment=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
