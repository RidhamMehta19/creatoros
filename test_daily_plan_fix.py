#!/usr/bin/env python3
"""
Final comprehensive test with correct user profile for daily plan generation
"""

import requests
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

BACKEND_URL = "https://creator-brain-3.preview.emergentagent.com/api"

def test_daily_plan_generation():
    """Test daily plan generation with the working user profile"""
    
    # First create a new user to ensure fresh test
    logger.info("Creating new user for daily plan test...")
    user_data = {
        "name": "Jordan Chen",
        "niche": "Fitness & Wellness",
        "tone": "Motivational",
        "target_audience": "Busy professionals and millennials",
        "platforms": ["Instagram", "TikTok", "YouTube"]
    }
    
    response = requests.post(
        f"{BACKEND_URL}/users",
        json=user_data,
        headers={"Content-Type": "application/json"},
        timeout=15
    )
    
    if response.status_code != 200:
        logger.error(f"Failed to create user: {response.text}")
        return False
    
    user_id = response.json()["id"]
    logger.info(f"Created user with ID: {user_id}")
    
    # Test daily plan generation
    logger.info("Testing daily plan generation...")
    plan_response = requests.post(
        f"{BACKEND_URL}/daily-plan/generate",
        json={"user_id": user_id},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    if plan_response.status_code != 200:
        logger.error(f"Failed to generate plan: {plan_response.text}")
        return False
    
    plan_data = plan_response.json()
    plan_items = plan_data.get("plan_items", [])
    
    logger.info(f"Generated plan with {len(plan_items)} items:")
    for i, item in enumerate(plan_items, 1):
        logger.info(f"  {i}. {item['platform']} - {item['content_type']}: {item['topic'][:50]}...")
    
    if len(plan_items) >= 2:
        logger.info("✅ Daily plan generation test PASSED")
        return True
    else:
        logger.error(f"❌ Daily plan generation test FAILED - only {len(plan_items)} items generated")
        return False

if __name__ == "__main__":
    test_daily_plan_generation()