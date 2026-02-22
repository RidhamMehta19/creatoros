from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# LLM API Key
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# ============ Models ============

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    niche: str
    tone: str  # e.g., "Professional", "Casual", "Humorous", "Inspirational"
    target_audience: str
    platforms: List[str]  # ["Instagram", "TikTok", "YouTube"]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    name: str
    niche: str
    tone: str
    target_audience: str
    platforms: List[str]

class ContentItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    platform: str  # "Instagram", "TikTok", "YouTube"
    content_type: str  # "Reel", "Post", "Video", "Story"
    script: str
    caption: str
    hooks: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    posted: bool = False

class ContentGenerateRequest(BaseModel):
    user_id: str
    platform: str
    content_type: str
    additional_context: Optional[str] = None

class DailyPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # YYYY-MM-DD format
    plan_items: List[dict]  # List of content suggestions
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class DailyPlanGenerate(BaseModel):
    user_id: str

# ============ Helper Functions ============

async def get_user_profile(user_id: str):
    """Get user profile from database"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

async def get_user_content_history(user_id: str, limit: int = 10):
    """Get user's recent content history"""
    content_list = await db.content.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
    return [ContentItem(**content) for content in content_list]

async def generate_content_with_llm(user: UserProfile, platform: str, content_type: str, additional_context: str = None):
    """Generate content using LLM based on user profile and history"""
    
    # Get user's recent content to personalize
    recent_content = await get_user_content_history(user.id, limit=5)
    
    # Build context from past content
    past_content_summary = ""
    if recent_content:
        past_content_summary = "\n\nRecent content created:\n"
        for idx, content in enumerate(recent_content[:3], 1):
            past_content_summary += f"{idx}. {content.platform} - {content.content_type}: {content.caption[:100]}...\n"
    
    # Create personalized prompt
    system_message = f"""You are a professional content strategist and scriptwriter for social media creators.

Your creator profile:
- Niche: {user.niche}
- Tone: {user.tone}
- Target Audience: {user.target_audience}
- Platforms: {', '.join(user.platforms)}

Create content that matches their unique voice and resonates with their audience."""

    user_prompt = f"""Create a {content_type} for {platform}.

Requirements:
- Platform: {platform}
- Content Type: {content_type}
- Tone: {user.tone}
- Target Audience: {user.target_audience}
{f'- Additional Context: {additional_context}' if additional_context else ''}
{past_content_summary}

Generate:
1. 3 Hook Options (attention-grabbing first lines)
2. Complete Script (if applicable for video content)
3. Caption (optimized for {platform})

Format your response as JSON with these keys:
{{
    "hooks": ["hook1", "hook2", "hook3"],
    "script": "full script here",
    "caption": "caption with relevant hashtags"
}}"""

    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"content_gen_{user.id}_{datetime.utcnow().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-5-mini")
        
        # Generate content
        message = UserMessage(text=user_prompt)
        response = await chat.send_message(message)
        
        # Parse response (assuming it returns JSON)
        import json
        try:
            content_data = json.loads(response)
        except:
            # If not JSON, structure it manually
            content_data = {
                "hooks": ["Ready to transform your content?", "Here's what nobody tells you about...", "Stop scrolling - this will change everything"],
                "script": response,
                "caption": response[:200] + "... #" + user.niche.replace(" ", "")
            }
        
        return content_data
    
    except Exception as e:
        logging.error(f"Error generating content with LLM: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

async def generate_daily_plan_with_llm(user: UserProfile):
    """Generate daily content plan using LLM"""
    
    system_message = f"""You are a content strategist creating a daily posting plan for a {user.niche} creator.

Creator profile:
- Niche: {user.niche}
- Tone: {user.tone}
- Target Audience: {user.target_audience}
- Platforms: {', '.join(user.platforms)}"""

    user_prompt = f"""Create a daily content plan for today with 2-3 content ideas optimized for maximum engagement.

For each idea, provide:
1. Platform (choose from: {', '.join(user.platforms)})
2. Content Type (Reel/Post/Video/Story)
3. Topic
4. Why it works (brief reasoning)

Format as JSON array:
[
    {{
        "platform": "Instagram",
        "content_type": "Reel",
        "topic": "topic here",
        "reasoning": "why this will perform well"
    }}
]"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"daily_plan_{user.id}_{datetime.utcnow().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-5-mini")
        
        message = UserMessage(text=user_prompt)
        response = await chat.send_message(message)
        
        import json
        try:
            plan_items = json.loads(response)
        except:
            # Default plan if parsing fails
            plan_items = [
                {
                    "platform": user.platforms[0] if user.platforms else "Instagram",
                    "content_type": "Reel",
                    "topic": f"Trending topic in {user.niche}",
                    "reasoning": "High engagement potential"
                }
            ]
        
        return plan_items
    
    except Exception as e:
        logging.error(f"Error generating daily plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")

# ============ API Routes ============

@api_router.get("/")
async def root():
    return {"message": "Creator Operating System API"}

# User Profile Routes
@api_router.post("/users", response_model=UserProfile)
async def create_user_profile(input: UserProfileCreate):
    """Create or update user profile"""
    user_dict = input.dict()
    user_obj = UserProfile(**user_dict)
    
    # Check if user already exists (by name for now)
    existing_user = await db.users.find_one({"name": user_obj.name})
    if existing_user:
        # Update existing user
        await db.users.update_one(
            {"id": existing_user["id"]},
            {"$set": user_obj.dict()}
        )
        user_obj.id = existing_user["id"]
    else:
        # Create new user
        await db.users.insert_one(user_obj.dict())
    
    return user_obj

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user(user_id: str):
    """Get user profile by ID"""
    return await get_user_profile(user_id)

# Content Generation Routes
@api_router.post("/content/generate", response_model=ContentItem)
async def generate_content(request: ContentGenerateRequest):
    """Generate content with AI"""
    # Get user profile
    user = await get_user_profile(request.user_id)
    
    # Generate content with LLM
    content_data = await generate_content_with_llm(
        user=user,
        platform=request.platform,
        content_type=request.content_type,
        additional_context=request.additional_context
    )
    
    # Create content item
    content_obj = ContentItem(
        user_id=request.user_id,
        platform=request.platform,
        content_type=request.content_type,
        script=content_data.get("script", ""),
        caption=content_data.get("caption", ""),
        hooks=content_data.get("hooks", [])
    )
    
    # Save to database
    await db.content.insert_one(content_obj.dict())
    
    return content_obj

@api_router.get("/content/history/{user_id}", response_model=List[ContentItem])
async def get_content_history(user_id: str, limit: int = 20):
    """Get user's content history"""
    content_list = await db.content.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
    return [ContentItem(**content) for content in content_list]

# Daily Plan Routes
@api_router.post("/daily-plan/generate", response_model=DailyPlan)
async def generate_daily_plan(request: DailyPlanGenerate):
    """Generate daily content plan"""
    # Get user profile
    user = await get_user_profile(request.user_id)
    
    # Generate plan with LLM
    plan_items = await generate_daily_plan_with_llm(user)
    
    # Create daily plan
    today = datetime.utcnow().strftime("%Y-%m-%d")
    plan_obj = DailyPlan(
        user_id=request.user_id,
        date=today,
        plan_items=plan_items
    )
    
    # Check if plan for today already exists
    existing_plan = await db.daily_plans.find_one({"user_id": request.user_id, "date": today})
    if existing_plan:
        # Update existing plan
        await db.daily_plans.update_one(
            {"id": existing_plan["id"]},
            {"$set": plan_obj.dict()}
        )
        plan_obj.id = existing_plan["id"]
    else:
        # Create new plan
        await db.daily_plans.insert_one(plan_obj.dict())
    
    return plan_obj

@api_router.get("/daily-plan/today/{user_id}", response_model=Optional[DailyPlan])
async def get_today_plan(user_id: str):
    """Get today's content plan"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    plan = await db.daily_plans.find_one({"user_id": user_id, "date": today})
    
    if not plan:
        return None
    
    return DailyPlan(**plan)

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
