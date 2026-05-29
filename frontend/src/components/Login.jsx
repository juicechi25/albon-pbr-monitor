import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

const users = {
  viewer: {
    password: "viewer123",
    role: "viewer",
  },
};

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const user = users[username.trim().toLowerCase()];

    if (user && user.password === password.trim()) {
      onLogin(user.role);
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
          placeholder="Username: viewer"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password: viewer123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Viewer Login</button>

        <div className="oauth-section">
          <p>Operator Access</p>

          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log("Google Success", credentialResponse);
              onLogin("operator");
            }}
            onError={() => {
              alert("Google OAuth Login Failed");
            }}
          />
        </div>

        <div className="credentials">
          <p><strong>Viewer Username:</strong> viewer</p>
          <p><strong>Viewer Password:</strong> viewer123</p>
          <p><strong>Operator:</strong> Google OAuth</p>
        </div>
      </form>
    </div>
  );
}

export default Login;