#!/usr/bin/env python3
"""
Creator Operating System Backend API Tests
Tests all backend endpoints in sequence as requested.
"""

import requests
import json
import uuid
import logging
from datetime import datetime
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Backend URL (from frontend/.env)
BACKEND_URL = "https://creator-brain-3.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.user_id = None
        self.test_results = {}
        
    def log_test_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {message}")
        
        self.test_results[test_name] = {
            "success": success,
            "message": message,
            "response_data": response_data
        }
        
    def test_api_health(self):
        """Test if API is responsive"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log_test_result("API Health Check", True, f"API is responsive - {response.json()}")
                return True
            else:
                self.log_test_result("API Health Check", False, f"API returned status {response.status_code}")
                return False
        except Exception as e:
            self.log_test_result("API Health Check", False, f"API connection failed: {str(e)}")
            return False

    def test_create_user_profile(self):
        """Test POST /api/users - Create user profile"""
        test_data = {
            "name": "Alexandra Martinez",
            "niche": "Sustainable Living",
            "tone": "Inspirational", 
            "target_audience": "Eco-conscious millennials and Gen Z",
            "platforms": ["Instagram", "TikTok", "YouTube"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/users", 
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Validate response structure
                required_fields = ["id", "name", "niche", "tone", "target_audience", "platforms", "created_at"]
                missing_fields = [field for field in required_fields if field not in user_data]
                
                if missing_fields:
                    self.log_test_result("Create User Profile", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Save user_id for subsequent tests
                self.user_id = user_data["id"]
                
                # Validate data integrity
                if (user_data["name"] == test_data["name"] and 
                    user_data["niche"] == test_data["niche"] and
                    user_data["tone"] == test_data["tone"]):
                    
                    self.log_test_result("Create User Profile", True, 
                                       f"User created successfully with ID: {self.user_id}", user_data)
                    return True
                else:
                    self.log_test_result("Create User Profile", False, "Response data doesn't match input")
                    return False
            else:
                self.log_test_result("Create User Profile", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Create User Profile", False, f"Request failed: {str(e)}")
            return False

    def test_get_user_profile(self):
        """Test GET /api/users/{user_id} - Get user profile"""
        if not self.user_id:
            self.log_test_result("Get User Profile", False, "No user_id available from previous test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/users/{self.user_id}", timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Validate response structure and data
                if (user_data.get("id") == self.user_id and 
                    user_data.get("name") == "Alexandra Martinez" and
                    user_data.get("niche") == "Sustainable Living"):
                    
                    self.log_test_result("Get User Profile", True, 
                                       "User profile retrieved successfully", user_data)
                    return True
                else:
                    self.log_test_result("Get User Profile", False, "Retrieved data doesn't match expected values")
                    return False
            else:
                self.log_test_result("Get User Profile", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Get User Profile", False, f"Request failed: {str(e)}")
            return False

    def test_generate_content(self):
        """Test POST /api/content/generate - Generate content with LLM"""
        if not self.user_id:
            self.log_test_result("Generate Content", False, "No user_id available from previous test")
            return False
            
        test_data = {
            "user_id": self.user_id,
            "platform": "Instagram",
            "content_type": "Reel",
            "additional_context": "Focus on easy zero-waste swaps for beginners"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/content/generate",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for LLM processing
            )
            
            if response.status_code == 200:
                content_data = response.json()
                
                # Validate response structure
                required_fields = ["id", "user_id", "platform", "content_type", "script", "caption", "hooks"]
                missing_fields = [field for field in required_fields if field not in content_data]
                
                if missing_fields:
                    self.log_test_result("Generate Content", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Validate LLM integration
                hooks = content_data.get("hooks", [])
                script = content_data.get("script", "")
                caption = content_data.get("caption", "")
                
                if len(hooks) >= 1 and len(script) > 10 and len(caption) > 10:
                    self.log_test_result("Generate Content", True, 
                                       f"Content generated successfully. Hooks: {len(hooks)}, Script length: {len(script)}, Caption length: {len(caption)}", 
                                       {
                                           "hooks_count": len(hooks),
                                           "script_preview": script[:100] + "..." if len(script) > 100 else script,
                                           "caption_preview": caption[:100] + "..." if len(caption) > 100 else caption
                                       })
                    return True
                else:
                    self.log_test_result("Generate Content", False, 
                                       f"LLM content generation appears insufficient. Hooks: {len(hooks)}, Script: {len(script)} chars, Caption: {len(caption)} chars")
                    return False
            else:
                self.log_test_result("Generate Content", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Generate Content", False, f"Request failed: {str(e)}")
            return False

    def test_get_content_history(self):
        """Test GET /api/content/history/{user_id} - Get content history"""
        if not self.user_id:
            self.log_test_result("Get Content History", False, "No user_id available from previous test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/content/history/{self.user_id}", timeout=10)
            
            if response.status_code == 200:
                history_data = response.json()
                
                # Should be a list
                if isinstance(history_data, list):
                    # Should contain at least 1 item from the previous generate test
                    if len(history_data) >= 1:
                        # Validate first item structure
                        first_item = history_data[0]
                        if (first_item.get("user_id") == self.user_id and 
                            "platform" in first_item and 
                            "content_type" in first_item):
                            
                            self.log_test_result("Get Content History", True, 
                                               f"Content history retrieved successfully. Found {len(history_data)} items")
                            return True
                        else:
                            self.log_test_result("Get Content History", False, "Content item structure is invalid")
                            return False
                    else:
                        self.log_test_result("Get Content History", False, "No content found in history (expected at least 1 from generate test)")
                        return False
                else:
                    self.log_test_result("Get Content History", False, "Response is not a list")
                    return False
            else:
                self.log_test_result("Get Content History", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Get Content History", False, f"Request failed: {str(e)}")
            return False

    def test_generate_daily_plan(self):
        """Test POST /api/daily-plan/generate - Generate daily content plan"""
        if not self.user_id:
            self.log_test_result("Generate Daily Plan", False, "No user_id available from previous test")
            return False
            
        test_data = {
            "user_id": self.user_id
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/daily-plan/generate",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for LLM processing
            )
            
            if response.status_code == 200:
                plan_data = response.json()
                
                # Validate response structure
                required_fields = ["id", "user_id", "date", "plan_items", "generated_at"]
                missing_fields = [field for field in required_fields if field not in plan_data]
                
                if missing_fields:
                    self.log_test_result("Generate Daily Plan", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Validate plan items
                plan_items = plan_data.get("plan_items", [])
                
                if len(plan_items) >= 2:  # Should have 2-3 content ideas
                    # Validate first plan item structure
                    first_item = plan_items[0]
                    expected_item_fields = ["platform", "content_type", "topic"]
                    
                    if all(field in first_item for field in expected_item_fields):
                        # Check if date is today
                        today = datetime.utcnow().strftime("%Y-%m-%d")
                        if plan_data.get("date") == today:
                            self.log_test_result("Generate Daily Plan", True, 
                                               f"Daily plan generated successfully. {len(plan_items)} content ideas for {plan_data['date']}", 
                                               {"plan_items_count": len(plan_items), "date": plan_data['date']})
                            return True
                        else:
                            self.log_test_result("Generate Daily Plan", False, f"Plan date {plan_data['date']} doesn't match today {today}")
                            return False
                    else:
                        self.log_test_result("Generate Daily Plan", False, "Plan item structure is invalid")
                        return False
                else:
                    self.log_test_result("Generate Daily Plan", False, f"Insufficient plan items generated: {len(plan_items)} (expected 2-3)")
                    return False
            else:
                self.log_test_result("Generate Daily Plan", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Generate Daily Plan", False, f"Request failed: {str(e)}")
            return False

    def test_get_today_plan(self):
        """Test GET /api/daily-plan/today/{user_id} - Get today's plan"""
        if not self.user_id:
            self.log_test_result("Get Today's Plan", False, "No user_id available from previous test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/daily-plan/today/{self.user_id}", timeout=10)
            
            if response.status_code == 200:
                plan_data = response.json()
                
                # Could be None if no plan exists, but we just generated one
                if plan_data is not None:
                    # Validate it matches today's date
                    today = datetime.utcnow().strftime("%Y-%m-%d")
                    if plan_data.get("date") == today and plan_data.get("user_id") == self.user_id:
                        plan_items = plan_data.get("plan_items", [])
                        self.log_test_result("Get Today's Plan", True, 
                                           f"Today's plan retrieved successfully. {len(plan_items)} items for {plan_data['date']}")
                        return True
                    else:
                        self.log_test_result("Get Today's Plan", False, "Plan data doesn't match expected values")
                        return False
                else:
                    self.log_test_result("Get Today's Plan", False, "No plan found for today (expected plan from generate test)")
                    return False
            else:
                self.log_test_result("Get Today's Plan", False, 
                                   f"Request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Get Today's Plan", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        logger.info(f"Starting Creator Operating System Backend API Tests")
        logger.info(f"Backend URL: {self.base_url}")
        
        tests = [
            ("API Health Check", self.test_api_health),
            ("1. Create User Profile", self.test_create_user_profile),
            ("2. Get User Profile", self.test_get_user_profile),
            ("3. Generate Content with LLM", self.test_generate_content),
            ("4. Get Content History", self.test_get_content_history),
            ("5. Generate Daily Plan", self.test_generate_daily_plan),
            ("6. Get Today's Plan", self.test_get_today_plan)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            logger.info(f"\n--- Running {test_name} ---")
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Test {test_name} crashed: {str(e)}")
                failed += 1
                
        # Summary
        logger.info(f"\n=== TEST SUMMARY ===")
        logger.info(f"Total Tests: {passed + failed}")
        logger.info(f"Passed: {passed}")
        logger.info(f"Failed: {failed}")
        
        if failed > 0:
            logger.info("\n=== FAILED TESTS ===")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    logger.error(f"❌ {test_name}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)