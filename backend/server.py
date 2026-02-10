from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    created_at: datetime


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserProfile


class Exercise(BaseModel):
    type: str  # "pushup", "squats", "arm_circles"
    count: int
    duration_seconds: float
    calories: float


class WorkoutSession(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD format
    exercises: List[Exercise]
    total_calories: float
    start_time: datetime
    end_time: Optional[datetime] = None


class WorkoutCreate(BaseModel):
    exercises: List[Exercise]
    start_time: datetime
    end_time: datetime


class DailyStats(BaseModel):
    date: str
    total_calories: float
    pushups: int
    squats: int
    arm_circles: int


class WeeklyStats(BaseModel):
    week_start: str
    days: List[DailyStats]
    total_calories: float
    total_exercises: int


# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    
    return user


def user_dict_to_profile(user: dict) -> UserProfile:
    return UserProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        gender=user.get("gender"),
        weight_kg=user.get("weight_kg"),
        height_cm=user.get("height_cm"),
        created_at=user["created_at"]
    )


# ==================== AUTHENTICATION ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "name": user_data.name,
        "gender": user_data.gender,
        "weight_kg": user_data.weight_kg,
        "height_cm": user_data.height_cm,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    
    # Create access token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_dict_to_profile(new_user)
    )


@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_dict_to_profile(user)
    )


@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_dict_to_profile(current_user)


# ==================== PROFILE ROUTES ====================

@api_router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
        
        # Fetch updated user
        updated_user = await db.users.find_one({"_id": current_user["_id"]})
        return user_dict_to_profile(updated_user)
    
    return user_dict_to_profile(current_user)


# ==================== WORKOUT ROUTES ====================

@api_router.post("/workouts")
async def create_workout(
    workout_data: WorkoutCreate,
    current_user: dict = Depends(get_current_user)
):
    # Calculate total calories
    total_calories = sum(ex.calories for ex in workout_data.exercises)
    
    # Get date from start_time
    workout_date = workout_data.start_time.strftime("%Y-%m-%d")
    
    # Check if workout exists for this date
    existing_workout = await db.workouts.find_one({
        "user_id": str(current_user["_id"]),
        "date": workout_date
    })
    
    if existing_workout:
        # Update existing workout
        exercises_dict = [ex.dict() for ex in workout_data.exercises]
        existing_exercises = existing_workout.get("exercises", [])
        
        # Merge exercises
        for new_ex in exercises_dict:
            found = False
            for existing_ex in existing_exercises:
                if existing_ex["type"] == new_ex["type"]:
                    existing_ex["count"] += new_ex["count"]
                    existing_ex["duration_seconds"] += new_ex["duration_seconds"]
                    existing_ex["calories"] += new_ex["calories"]
                    found = True
                    break
            if not found:
                existing_exercises.append(new_ex)
        
        new_total_calories = sum(ex["calories"] for ex in existing_exercises)
        
        await db.workouts.update_one(
            {"_id": existing_workout["_id"]},
            {
                "$set": {
                    "exercises": existing_exercises,
                    "total_calories": new_total_calories,
                    "end_time": workout_data.end_time
                }
            }
        )
        
        return {"message": "Workout updated successfully", "workout_id": str(existing_workout["_id"])}
    else:
        # Create new workout
        new_workout = {
            "user_id": str(current_user["_id"]),
            "date": workout_date,
            "exercises": [ex.dict() for ex in workout_data.exercises],
            "total_calories": total_calories,
            "start_time": workout_data.start_time,
            "end_time": workout_data.end_time
        }
        
        result = await db.workouts.insert_one(new_workout)
        return {"message": "Workout created successfully", "workout_id": str(result.inserted_id)}


@api_router.get("/workouts/today", response_model=DailyStats)
async def get_today_workout(current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    workout = await db.workouts.find_one({
        "user_id": str(current_user["_id"]),
        "date": today
    })
    
    if not workout:
        return DailyStats(
            date=today,
            total_calories=0.0,
            pushups=0,
            squats=0,
            arm_circles=0
        )
    
    # Aggregate exercise counts
    pushups = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "pushup")
    squats = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "squats")
    arm_circles = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "arm_circles")
    
    return DailyStats(
        date=today,
        total_calories=workout["total_calories"],
        pushups=pushups,
        squats=squats,
        arm_circles=arm_circles
    )


@api_router.get("/workouts/daily/{date}", response_model=DailyStats)
async def get_daily_workout(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    workout = await db.workouts.find_one({
        "user_id": str(current_user["_id"]),
        "date": date
    })
    
    if not workout:
        return DailyStats(
            date=date,
            total_calories=0.0,
            pushups=0,
            squats=0,
            arm_circles=0
        )
    
    # Aggregate exercise counts
    pushups = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "pushup")
    squats = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "squats")
    arm_circles = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "arm_circles")
    
    return DailyStats(
        date=date,
        total_calories=workout["total_calories"],
        pushups=pushups,
        squats=squats,
        arm_circles=arm_circles
    )


@api_router.get("/workouts/weekly", response_model=WeeklyStats)
async def get_weekly_workouts(current_user: dict = Depends(get_current_user)):
    # Get current week (last 7 days)
    today = datetime.utcnow()
    week_start = today - timedelta(days=6)
    
    workouts = await db.workouts.find({
        "user_id": str(current_user["_id"]),
        "date": {"$gte": week_start.strftime("%Y-%m-%d")}
    }).to_list(7)
    
    # Create daily stats for the week
    daily_stats = []
    total_calories = 0.0
    total_exercises = 0
    
    for i in range(7):
        current_date = (week_start + timedelta(days=i)).strftime("%Y-%m-%d")
        workout = next((w for w in workouts if w["date"] == current_date), None)
        
        if workout:
            pushups = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "pushup")
            squats = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "squats")
            arm_circles = sum(ex["count"] for ex in workout["exercises"] if ex["type"] == "arm_circles")
            
            daily_stats.append(DailyStats(
                date=current_date,
                total_calories=workout["total_calories"],
                pushups=pushups,
                squats=squats,
                arm_circles=arm_circles
            ))
            
            total_calories += workout["total_calories"]
            total_exercises += pushups + squats + arm_circles
        else:
            daily_stats.append(DailyStats(
                date=current_date,
                total_calories=0.0,
                pushups=0,
                squats=0,
                arm_circles=0
            ))
    
    return WeeklyStats(
        week_start=week_start.strftime("%Y-%m-%d"),
        days=daily_stats,
        total_calories=total_calories,
        total_exercises=total_exercises
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
