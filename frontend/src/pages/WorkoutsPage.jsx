import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import WorkoutForm from "../components/WorkoutForm";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const r = await api.getUsers();
      setUsers(r.data);
      if (r.data.length > 0 && !selectedUser) {
        setSelectedUser(r.data[0].user_id);
      }
    } catch {
      setError("Failed to load users.");
    }
  }, []);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getWorkouts(selectedUser || null);
      setWorkouts(r.data);
    } catch {
      setError("Failed to load workouts.");
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  function openCreate() {
    setEditingWorkout(null);
    setShowModal(true);
  }

  function openEdit(workout) {
    setEditingWorkout(workout);
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this workout?")) return;
    try {
      await api.deleteWorkout(id);
      loadWorkouts();
    } catch {
      setError("Failed to delete workout.");
    }
  }

  function handleSaved() {
    setShowModal(false);
    setEditingWorkout(null);
    loadWorkouts();
  }

  function formatDate(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${m}/${d}/${y}`;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Workouts</h1>
        <button className="btn-primary" onClick={openCreate}>
          + New Workout
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="row" style={{ alignItems: "center" }}>
          <div className="form-group" style={{ maxWidth: 280 }}>
            <label>Filter by user</label>
            <select
              className="form-control"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : "")}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p style={{ color: "#999" }}>Loading...</p>}

      {!loading && workouts.length === 0 && (
        <div className="empty-state">No workouts found. Create one to get started!</div>
      )}

      {workouts.map((w) => (
        <div key={w.workout_id} className="workout-card">
          <div className="workout-card-header">
            <div>
              <span className="workout-date">{formatDate(w.date)}</span>
              {users.find((u) => u.user_id === w.user_id) && (
                <span style={{ marginLeft: 10, fontSize: 13, color: "#777" }}>
                  {users.find((u) => u.user_id === w.user_id).name}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary btn-sm" onClick={() => openEdit(w)}>
                Edit
              </button>
              <button className="btn-danger btn-sm" onClick={() => handleDelete(w.workout_id)}>
                Delete
              </button>
            </div>
          </div>

          {w.notes && <div className="workout-notes">{w.notes}</div>}

          <div>
            {w.exercises.map((ex) => (
              <span key={ex.id} className="exercise-tag" title={`${ex.sets}x${ex.reps} @ ${ex.weight} lbs`}>
                {ex.exercise_name} &mdash; {ex.sets}&times;{ex.reps} @ {ex.weight} lbs
              </span>
            ))}
            {w.exercises.length === 0 && (
              <span style={{ fontSize: 13, color: "#aaa" }}>No exercises logged.</span>
            )}
          </div>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 className="modal-title">
              {editingWorkout ? "Edit Workout" : "New Workout"}
            </h2>
            <WorkoutForm
              workout={editingWorkout}
              users={users}
              onSaved={handleSaved}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
