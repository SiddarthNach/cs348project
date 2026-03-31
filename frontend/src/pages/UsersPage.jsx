import { useState, useEffect } from "react";
import { api } from "../api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const load = () => api.getUsers().then((r) => setUsers(r.data));

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.createUser({ name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user and all their workouts?")) return;
    try {
      await api.deleteUser(userId);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>

      <div className="card" style={{ maxWidth: 480, marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Add User</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input
              className="form-control"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit">Add User</button>
        </form>
      </div>

      <div className="card" style={{ overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#888" }}>No users yet.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(u.user_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
