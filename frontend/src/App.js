import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check auth status on mount
  useEffect(() => {
    axios
      .get("http://localhost:5001/check-auth", { withCredentials: true })
      .then((res) => setAuthenticated(res.data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/login",
        { password },
        { withCredentials: true }
      );
      if (res.data.success) {
        setAuthenticated(true);
        setLoginError("");
      } else {
        setLoginError("Incorrect password");
      }
    } catch (err) {
      setLoginError("Login failed");
    }
  };

  const getFormats = async () => {
    const res = await axios.post(
      "http://localhost:5001/formats",
      { url },
      { withCredentials: true }
    );
    setFormats(res.data.formats);
    setTitle(res.data.title);
  };

  const downloadVideo = async (format_id) => {
    const res = await axios.post(
      "http://localhost:5001/download",
      { url, format_id },
      { responseType: "blob", withCredentials: true }
    );
    const blob = new Blob([res.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${title}.${format_id}.mp4`;
    link.click();
  };

  // Show login form if not authenticated
  if (!authenticated) {
    return (
      <div>
        <h2>Login</h2>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {loginError && <p style={{ color: "red" }}>{loginError}</p>}
      </div>
    );
  }

  // Authenticated user sees main app
  return (
    <div>
      <h2>YouTube Downloader</h2>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter YouTube URL"
      />
      <button onClick={getFormats}>Get Formats</button>
      <ul>
        {formats.map((f) => (
          <li key={f.format_id}>
            {f.ext} {f.resolution} ({f.format_note})
            <button onClick={() => downloadVideo(f.format_id)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
