import { useState, useEffect } from "react";
import { api } from "../api";

export default function ReportsPage() {
  const [users, setUsers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);

  // Filter state
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [exerciseId, setExerciseId] = useState("");

  // Results
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getUsers().then((r) => setUsers(r.data));
    api.getExercises().then((r) => setExercises(r.data));
    api.getMuscleGroups().then((r) => setMuscleGroups(r.data));
  }, []);

  // Filtered exercises by muscle group
  const filteredExercises = muscleGroup
    ? exercises.filter((e) => e.muscle_group === muscleGroup)
    : exercises;

  async function runReport(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const params = {};
    if (userId) params.user_id = userId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (muscleGroup) params.muscle_group = muscleGroup;
    if (exerciseId) params.exercise_id = exerciseId;

    try {
      const r = await api.getReport(params);
      setEntries(r.data.entries);
      setStats(r.data.stats);
      setHasRun(true);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to run report.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setUserId("");
    setDateFrom("");
    setDateTo("");
    setMuscleGroup("");
    setExerciseId("");
    setEntries([]);
    setStats(null);
    setHasRun(false);
  }

  function formatDate(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${m}/${d}/${y}`;
  }

  return (
    <div>
      <h1 className="page-title">Reports</h1>

      <form className="filter-bar" onSubmit={runReport}>
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label>User</label>
            <select className="form-control" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date From</label>
            <input
              type="date"
              className="form-control"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Date To</label>
            <input
              type="date"
              className="form-control"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label>Muscle Group</label>
            <select
              className="form-control"
              value={muscleGroup}
              onChange={(e) => {
                setMuscleGroup(e.target.value);
                setExerciseId(""); // reset exercise when muscle group changes
              }}
            >
              <option value="">All muscle groups</option>
              {muscleGroups.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Exercise</label>
            <select
              className="form-control"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              <option value="">All exercises</option>
              {filteredExercises.map((ex) => (
                <option key={ex.exercise_id} value={ex.exercise_id}>
                  {ex.name} ({ex.muscle_group})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Running..." : "Run Report"}
          </button>
          <button type="button" className="btn-secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {hasRun && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_workouts}</div>
            <div className="stat-label">Total Workouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_entries}</div>
            <div className="stat-label">Exercise Entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_volume.toLocaleString()}</div>
            <div className="stat-label">Total Volume (lbs)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_weight}</div>
            <div className="stat-label">Avg Weight (lbs)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_reps_per_set}</div>
            <div className="stat-label">Avg Reps / Set</div>
          </div>
        </div>
      )}

      {hasRun && entries.length === 0 && (
        <div className="empty-state">No matching workout entries found.</div>
      )}

      {hasRun && entries.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Exercise</th>
                <th>Muscle Group</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Weight (lbs)</th>
                <th>Volume</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.exercise_name}</td>
                  <td>
                    <span className="exercise-tag" style={{ fontSize: 11 }}>{entry.muscle_group}</span>
                  </td>
                  <td>{entry.sets}</td>
                  <td>{entry.reps}</td>
                  <td>{entry.weight}</td>
                  <td>{entry.volume.toLocaleString()}</td>
                  <td style={{ color: "#777", fontSize: 13 }}>{entry.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
