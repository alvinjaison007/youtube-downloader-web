import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { password }, { withCredentials: true });
      if (res.data.success) onLogin();
      else setError("Incorrect password.");
    } catch (err) {
      setError("Login failed.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;
