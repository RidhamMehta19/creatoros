#!/usr/bin/env python3
"""
Debug script to check daily plan generation response
"""

import requests
import json

BACKEND_URL = "https://creator-brain-3.preview.emergentagent.com/api"

# Use existing user ID from logs
user_id = "0f3f474e-f55f-428d-91c9-5a2461cb7047"  # From backend logs

print("Testing Daily Plan Generation...")

# Generate daily plan
response = requests.post(
    f"{BACKEND_URL}/daily-plan/generate",
    json={"user_id": user_id},
    headers={"Content-Type": "application/json"},
    timeout=30
)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Also check today's plan
today_response = requests.get(f"{BACKEND_URL}/daily-plan/today/{user_id}", timeout=10)
print(f"\nToday's Plan Status: {today_response.status_code}")
print(f"Today's Plan Response: {json.dumps(today_response.json(), indent=2)}")