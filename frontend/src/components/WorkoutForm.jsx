import { useState, useEffect } from "react";
import { api } from "../api";

const emptyExercise = () => ({ exercise_id: "", sets: "", reps: "", weight: "" });

export default function WorkoutForm({ workout, users, onSaved, onCancel }) {
  const [userId, setUserId] = useState(workout?.user_id ?? (users[0]?.user_id ?? ""));
  const [date, setDate] = useState(workout?.date ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [exercises, setExercises] = useState(
    workout?.exercises?.length
      ? workout.exercises.map((e) => ({
          exercise_id: e.exercise_id,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
        }))
      : [emptyExercise()]
  );
  const [allExercises, setAllExercises] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getExercises().then((r) => setAllExercises(r.data));
  }, []);

  function updateExercise(idx, field, value) {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function removeExercise(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!userId) return setError("Please select a user.");
    if (!date) return setError("Please enter a date.");
    if (exercises.length === 0) return setError("Add at least one exercise.");
    for (const ex of exercises) {
      if (!ex.exercise_id || ex.sets === "" || ex.reps === "" || ex.weight === "")
        return setError("Fill in all fields for each exercise.");
    }

    const payload = {
      user_id: parseInt(userId),
      date,
      notes,
      exercises: exercises.map((ex) => ({
        exercise_id: parseInt(ex.exercise_id),
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: parseFloat(ex.weight),
      })),
    };

    setSaving(true);
    try {
      if (workout) {
        await api.updateWorkout(workout.workout_id, payload);
      } else {
        await api.createWorkout(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to save workout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-msg">{error}</div>}

      <div className="row">
        <div className="form-group">
          <label>User</label>
          <select
            className="form-control"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">-- Select user --</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <input
          type="text"
          className="form-control"
          value={notes}
          placeholder="e.g. Chest day, felt great"
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>Exercises</strong>
      </div>

      {exercises.length > 0 && (
        <div className="exercise-header-row">
          <span>Exercise</span>
          <span>Sets</span>
          <span>Reps</span>
          <span>Weight (lbs)</span>
          <span></span>
        </div>
      )}

      {exercises.map((ex, idx) => (
        <div key={idx} className="exercise-row">
          <select
            value={ex.exercise_id}
            onChange={(e) => updateExercise(idx, "exercise_id", e.target.value)}
          >
            <option value="">-- Exercise --</option>
            {allExercises.map((e) => (
              <option key={e.exercise_id} value={e.exercise_id}>
                {e.name} ({e.muscle_group})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Sets"
            value={ex.sets}
            onChange={(e) => updateExercise(idx, "sets", e.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Reps"
            value={ex.reps}
            onChange={(e) => updateExercise(idx, "reps", e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Weight"
            value={ex.weight}
            onChange={(e) => updateExercise(idx, "weight", e.target.value)}
          />
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => removeExercise(idx)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary btn-sm"
        style={{ marginBottom: 16 }}
        onClick={addExercise}
      >
        + Add Exercise
      </button>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : workout ? "Update Workout" : "Create Workout"}
        </button>
      </div>
    </form>
  );
}
