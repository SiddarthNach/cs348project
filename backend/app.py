from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import date, datetime
import os

app = Flask(__name__)

cors_origin = os.environ.get("CORS_ORIGIN", "*")
CORS(app, origins=[o.strip() for o in cors_origin.split(",")] if cors_origin != "*" else "*")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_url = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'gym.db')}")
# Render's Postgres URLs use the legacy `postgres://` scheme; SQLAlchemy 2.x requires `postgresql://`.
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    workouts = db.relationship("Workout", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {"user_id": self.user_id, "name": self.name, "email": self.email}


class Exercise(db.Model):
    __tablename__ = "exercises"
    exercise_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    muscle_group = db.Column(db.String(100), nullable=False, index=True)

    def to_dict(self):
        return {
            "exercise_id": self.exercise_id,
            "name": self.name,
            "muscle_group": self.muscle_group,
        }


class Workout(db.Model):
    __tablename__ = "workouts"
    workout_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    notes = db.Column(db.Text, default="")
    user = db.relationship("User", back_populates="workouts")
    workout_exercises = db.relationship(
        "WorkoutExercise", back_populates="workout", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "workout_id": self.workout_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "date": self.date.isoformat(),
            "notes": self.notes,
            "exercises": [we.to_dict() for we in self.workout_exercises],
        }


class WorkoutExercise(db.Model):
    __tablename__ = "workout_exercises"
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey("workouts.workout_id"), nullable=False, index=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.exercise_id"), nullable=False, index=True)
    sets = db.Column(db.Integer, nullable=False)
    reps = db.Column(db.Integer, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    workout = db.relationship("Workout", back_populates="workout_exercises")
    exercise = db.relationship("Exercise")

    def to_dict(self):
        return {
            "id": self.id,
            "workout_id": self.workout_id,
            "exercise_id": self.exercise_id,
            "exercise_name": self.exercise.name if self.exercise else None,
            "muscle_group": self.exercise.muscle_group if self.exercise else None,
            "sets": self.sets,
            "reps": self.reps,
            "weight": self.weight,
        }


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_data():
    if User.query.count() > 0:
        return

    user1 = User(name="Alice Johnson", email="alice@example.com")
    user2 = User(name="Bob Smith", email="bob@example.com")
    db.session.add_all([user1, user2])
    db.session.flush()

    exercises_data = [
        ("Bench Press", "Chest"),
        ("Incline Dumbbell Press", "Chest"),
        ("Cable Fly", "Chest"),
        ("Pull-Up", "Back"),
        ("Barbell Row", "Back"),
        ("Lat Pulldown", "Back"),
        ("Squat", "Legs"),
        ("Leg Press", "Legs"),
        ("Romanian Deadlift", "Legs"),
        ("Overhead Press", "Shoulders"),
        ("Lateral Raise", "Shoulders"),
        ("Bicep Curl", "Arms"),
        ("Tricep Pushdown", "Arms"),
        ("Hammer Curl", "Arms"),
        ("Plank", "Core"),
        ("Cable Crunch", "Core"),
    ]
    exercises = [Exercise(name=n, muscle_group=mg) for n, mg in exercises_data]
    db.session.add_all(exercises)
    db.session.flush()

    ex = {e.name: e for e in exercises}

    w1 = Workout(user_id=user1.user_id, date=date(2025, 3, 1), notes="Chest day - felt strong")
    db.session.add(w1)
    db.session.flush()
    db.session.add_all([
        WorkoutExercise(workout_id=w1.workout_id, exercise_id=ex["Bench Press"].exercise_id, sets=4, reps=8, weight=135),
        WorkoutExercise(workout_id=w1.workout_id, exercise_id=ex["Incline Dumbbell Press"].exercise_id, sets=3, reps=10, weight=50),
        WorkoutExercise(workout_id=w1.workout_id, exercise_id=ex["Cable Fly"].exercise_id, sets=3, reps=12, weight=30),
    ])

    w2 = Workout(user_id=user1.user_id, date=date(2025, 3, 3), notes="Leg day - tough session")
    db.session.add(w2)
    db.session.flush()
    db.session.add_all([
        WorkoutExercise(workout_id=w2.workout_id, exercise_id=ex["Squat"].exercise_id, sets=5, reps=5, weight=185),
        WorkoutExercise(workout_id=w2.workout_id, exercise_id=ex["Leg Press"].exercise_id, sets=3, reps=12, weight=270),
        WorkoutExercise(workout_id=w2.workout_id, exercise_id=ex["Romanian Deadlift"].exercise_id, sets=3, reps=10, weight=135),
    ])

    w3 = Workout(user_id=user2.user_id, date=date(2025, 3, 2), notes="Back and biceps")
    db.session.add(w3)
    db.session.flush()
    db.session.add_all([
        WorkoutExercise(workout_id=w3.workout_id, exercise_id=ex["Pull-Up"].exercise_id, sets=4, reps=8, weight=0),
        WorkoutExercise(workout_id=w3.workout_id, exercise_id=ex["Barbell Row"].exercise_id, sets=4, reps=8, weight=115),
        WorkoutExercise(workout_id=w3.workout_id, exercise_id=ex["Bicep Curl"].exercise_id, sets=3, reps=12, weight=35),
    ])

    w4 = Workout(user_id=user2.user_id, date=date(2025, 3, 5), notes="Shoulder press day")
    db.session.add(w4)
    db.session.flush()
    db.session.add_all([
        WorkoutExercise(workout_id=w4.workout_id, exercise_id=ex["Overhead Press"].exercise_id, sets=4, reps=6, weight=95),
        WorkoutExercise(workout_id=w4.workout_id, exercise_id=ex["Lateral Raise"].exercise_id, sets=3, reps=15, weight=20),
    ])

    db.session.commit()
    print("Seed data inserted.")


# ---------------------------------------------------------------------------
# Routes - Users
# ---------------------------------------------------------------------------

@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.order_by(User.name).all()
    return jsonify([u.to_dict() for u in users])


@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email"):
        return jsonify({"error": "Name and email are required"}), 400
    if User.query.filter_by(email=data["email"].strip()).first():
        return jsonify({"error": "A user with this email already exists"}), 409
    user = User(name=data["name"].strip(), email=data["email"].strip())
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200


# ---------------------------------------------------------------------------
# Routes - Exercises / Muscle Groups
# ---------------------------------------------------------------------------

@app.route("/api/exercises", methods=["GET"])
def get_exercises():
    exercises = Exercise.query.order_by(Exercise.muscle_group, Exercise.name).all()
    return jsonify([e.to_dict() for e in exercises])


@app.route("/api/muscle-groups", methods=["GET"])
def get_muscle_groups():
    rows = (
        db.session.query(Exercise.muscle_group)
        .distinct()
        .order_by(Exercise.muscle_group)
        .all()
    )
    return jsonify([r[0] for r in rows])


# ---------------------------------------------------------------------------
# Routes - Workouts (CRUD)
# ---------------------------------------------------------------------------

@app.route("/api/workouts", methods=["GET"])
def get_workouts():
    user_id = request.args.get("user_id", type=int)
    query = Workout.query
    if user_id:
        query = query.filter(Workout.user_id == user_id)
    workouts = query.order_by(Workout.date.desc()).all()
    return jsonify([w.to_dict() for w in workouts])


@app.route("/api/workouts", methods=["POST"])
def create_workout():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        workout_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid or missing date (expected YYYY-MM-DD)"}), 400

    user_id = data.get("user_id")
    if not user_id or not db.session.get(User, user_id):
        return jsonify({"error": "Valid user is required"}), 400

    # Transaction: the parent Workout row and all its WorkoutExercise children
    # must either commit together or roll back together. A partial commit would
    # leave a workout with missing exercises.
    try:
        workout = Workout(user_id=user_id, date=workout_date, notes=data.get("notes", ""))
        db.session.add(workout)
        db.session.flush()

        for ex_data in data.get("exercises", []):
            we = WorkoutExercise(
                workout_id=workout.workout_id,
                exercise_id=ex_data["exercise_id"],
                sets=ex_data["sets"],
                reps=ex_data["reps"],
                weight=ex_data["weight"],
            )
            db.session.add(we)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create workout: {str(e)}"}), 400

    return jsonify(workout.to_dict()), 201


@app.route("/api/workouts/<int:workout_id>", methods=["PUT"])
def update_workout(workout_id):
    workout = db.session.get(Workout, workout_id)
    if not workout:
        return jsonify({"error": "Workout not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "date" in data:
        try:
            workout.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format (expected YYYY-MM-DD)"}), 400

    if "user_id" in data:
        workout.user_id = data["user_id"]

    if "notes" in data:
        workout.notes = data["notes"]

    # Transaction: deleting the old WorkoutExercise rows and inserting the new
    # set must be atomic. A partial failure here would leave the workout with
    # no exercises (or a mix of old and new), which the UI treats as corrupt.
    try:
        if "exercises" in data:
            WorkoutExercise.query.filter_by(workout_id=workout_id).delete()
            for ex_data in data["exercises"]:
                we = WorkoutExercise(
                    workout_id=workout_id,
                    exercise_id=ex_data["exercise_id"],
                    sets=ex_data["sets"],
                    reps=ex_data["reps"],
                    weight=ex_data["weight"],
                )
                db.session.add(we)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update workout: {str(e)}"}), 400

    return jsonify(workout.to_dict())


@app.route("/api/workouts/<int:workout_id>", methods=["DELETE"])
def delete_workout(workout_id):
    workout = db.session.get(Workout, workout_id)
    if not workout:
        return jsonify({"error": "Workout not found"}), 404
    db.session.delete(workout)
    db.session.commit()
    return jsonify({"message": "Workout deleted"}), 200


# ---------------------------------------------------------------------------
# Routes - Report
# ---------------------------------------------------------------------------

@app.route("/api/report", methods=["GET"])
def get_report():
    user_id = request.args.get("user_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    muscle_group = request.args.get("muscle_group")
    exercise_id = request.args.get("exercise_id", type=int)

    query = (
        db.session.query(WorkoutExercise, Workout, Exercise)
        .join(Workout, WorkoutExercise.workout_id == Workout.workout_id)
        .join(Exercise, WorkoutExercise.exercise_id == Exercise.exercise_id)
    )

    if user_id:
        query = query.filter(Workout.user_id == user_id)
    if date_from:
        try:
            query = query.filter(Workout.date >= datetime.strptime(date_from, "%Y-%m-%d").date())
        except ValueError:
            return jsonify({"error": "Invalid date_from format"}), 400
    if date_to:
        try:
            query = query.filter(Workout.date <= datetime.strptime(date_to, "%Y-%m-%d").date())
        except ValueError:
            return jsonify({"error": "Invalid date_to format"}), 400
    if muscle_group:
        query = query.filter(Exercise.muscle_group == muscle_group)
    if exercise_id:
        query = query.filter(Exercise.exercise_id == exercise_id)

    rows = query.order_by(Workout.date.desc()).all()

    entries = []
    total_volume = 0.0
    total_weight = 0.0
    total_reps = 0
    total_sets = 0
    workout_ids = set()

    for we, workout, exercise in rows:
        vol = we.sets * we.reps * we.weight
        total_volume += vol
        total_weight += we.weight
        total_reps += we.reps
        total_sets += we.sets
        workout_ids.add(workout.workout_id)
        entries.append({
            "workout_id": workout.workout_id,
            "date": workout.date.isoformat(),
            "notes": workout.notes,
            "exercise_name": exercise.name,
            "muscle_group": exercise.muscle_group,
            "sets": we.sets,
            "reps": we.reps,
            "weight": we.weight,
            "volume": vol,
        })

    n = len(entries)
    stats = {
        "total_workouts": len(workout_ids),
        "total_entries": n,
        "total_volume": round(total_volume, 2),
        "avg_weight": round(total_weight / n, 2) if n > 0 else 0,
        "avg_reps_per_set": round(total_reps / total_sets, 2) if total_sets > 0 else 0,
    }

    return jsonify({"entries": entries, "stats": stats})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

# Run on import so gunicorn workers (which import the module rather than
# executing it as __main__) initialize the schema and seed data on first boot.
# create_all is a no-op when tables already exist, and seed_data guards on
# User.query.count(), so this is safe to run on every worker startup.
with app.app_context():
    db.create_all()
    seed_data()


if __name__ == "__main__":
    app.run(debug=True, port=5001)
