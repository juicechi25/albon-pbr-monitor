import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import users from "../data/users.json";
import "./Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (user && user.password === password.trim()) {
      onLogin(user);
    } else {
      alert("Invalid username or password");
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>ALBON PBR Login</h1>

        <p className="subtitle">Remote Monitoring & Control System</p>

        <input
          type="text"
          placeholder="Username: viewer1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password: viewer001"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Viewer Login</button>

        <div className="oauth-section">
          <p>Operator Access</p>

          <GoogleLogin
            onSuccess={() => {
              onLogin({
                username: "operator",
                role: "operator",
                siteId: null,
              });
            }}
            onError={() => {
              alert("Google OAuth Login Failed");
            }}
          />
        </div>

        <div className="credentials">
          <p>
            <strong>Viewer:</strong> viewer1 / viewer001
          </p>
          <p>
            <strong>Viewer:</strong> viewer2 / viewer002
          </p>
          <p>
            <strong>Operator:</strong> Google OAuth
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;