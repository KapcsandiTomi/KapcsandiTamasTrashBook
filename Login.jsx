import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ setIsLoggedIn, setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
  
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setIsLoggedIn(true);
        setUser(data.user);

    
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="form-container">
      <form onSubmit={handleLogin} className="form-box">
        <div className="form-group">
          <label>Felhasználónév</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Felhasználónév' required />
        </div>
        <div className="form-group">
          <label>Jelszó</label>
          <input type="password" value={password} onChange={(e) => setPass(e.target.value)} placeholder='Jelszó' required />
        </div>
        <button type='submit' disabled={loading} className="btn-submit">
          {loading ? "Bejelentkezés..." : "Bejelentkezés"}
        </button>
        <p><Link to={"/password"}>Elfelejtette a jelszavát?</Link></p>
        {error && <p className="msg error">{error}</p>}
      </form>
    </div>
  );
}
