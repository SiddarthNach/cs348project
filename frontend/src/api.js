import axios from "axios";

const BASE = "http://localhost:5001/api";

export const api = {
  // Users
  getUsers: () => axios.get(`${BASE}/users`),
  createUser: (data) => axios.post(`${BASE}/users`, data),
  deleteUser: (id) => axios.delete(`${BASE}/users/${id}`),

  // Exercises / muscle groups
  getExercises: () => axios.get(`${BASE}/exercises`),
  getMuscleGroups: () => axios.get(`${BASE}/muscle-groups`),

  // Workouts CRUD
  getWorkouts: (userId) =>
    axios.get(`${BASE}/workouts`, { params: userId ? { user_id: userId } : {} }),
  createWorkout: (data) => axios.post(`${BASE}/workouts`, data),
  updateWorkout: (id, data) => axios.put(`${BASE}/workouts/${id}`, data),
  deleteWorkout: (id) => axios.delete(`${BASE}/workouts/${id}`),

  // Report
  getReport: (params) => axios.get(`${BASE}/report`, { params }),
};
