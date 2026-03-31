# GymTracker — CS348 Project

A full-stack gym / workout tracking web application built with Flask + SQLAlchemy (backend) and React + Vite (frontend).

---

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

---

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Flask server will start at **http://localhost:5000**.  
On first run it creates `backend/gym.db` and seeds it with:
- 2 sample users (Alice, Bob)
- 14 exercises across Chest, Back, Legs, Shoulders, Arms, Core
- 3 sample workouts

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app will start at **http://localhost:3000**.

---

## Features

### Workouts page (default `/`)
- Filter workouts by user
- View all workout cards showing date, notes, and exercises (sets × reps × weight)
- Create a new workout — pick user, date, notes, and add multiple exercises
- Edit an existing workout
- Delete a workout

### Reports page (`/reports`)
- Filter by: user, date range, muscle group, exercise
- Muscle group and exercise dropdowns are populated dynamically from the database
- Exercise dropdown narrows automatically when a muscle group is selected
- Results table showing every matching exercise entry
- Stats cards: Total Workouts, Exercise Entries, Total Volume, Avg Weight, Avg Reps/Set

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/exercises` | List all exercises with muscle_group |
| GET | `/api/muscle-groups` | Distinct muscle groups |
| GET | `/api/workouts?user_id=` | List workouts (optionally filtered by user) |
| POST | `/api/workouts` | Create a workout with exercises |
| PUT | `/api/workouts/:id` | Update a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/report` | Report with filters + aggregate stats |

### Report query params
`user_id`, `date_from` (YYYY-MM-DD), `date_to` (YYYY-MM-DD), `muscle_group`, `exercise_id`

---

## Tech Stack
- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-CORS, SQLite
- **Frontend**: React 18, Vite, React Router v6, Axios
