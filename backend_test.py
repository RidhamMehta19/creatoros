#!/usr/bin/env python3
"""
GPT-5-mini Model Switch Verification Test
Testing specifically for the model switch to ensure no functionality is broken
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Backend URL from frontend env
BACKEND_URL = "https://creator-brain-3.preview.emergentagent.com/api"

class GPTModelSwitchTester:
    def __init__(self):
        self.session = None
        self.test_user_id = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def test_user_creation(self):
        """Test POST /api/users endpoint"""
        print("\n🧪 Testing POST /api/users - User Creation")
        
        user_data = {
            "name": "GPT5Mini Tester",
            "niche": "AI Technology Reviews", 
            "tone": "Professional",
            "target_audience": "Tech enthusiasts and developers",
            "platforms": ["Instagram", "TikTok", "YouTube"]
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/users",
                json=user_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    self.test_user_id = result.get("id")
                    print(f"✅ User created successfully")
                    print(f"   - User ID: {self.test_user_id}")
                    print(f"   - Name: {result.get('name')}")
                    print(f"   - Niche: {result.get('niche')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ User creation failed")
                    print(f"   - Status: {response.status}")
                    print(f"   - Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ User creation error: {str(e)}")
            return False
    
    async def test_gpt5_mini_content_generation(self):
        """Test POST /api/content/generate with GPT-5-mini model"""
        print("\n🧪 Testing POST /api/content/generate - GPT-5-mini Model")
        
        if not self.test_user_id:
            print("❌ Cannot test content generation - no user ID available")
            return False
        
        content_request = {
            "user_id": self.test_user_id,
            "platform": "Instagram",
            "content_type": "Reel", 
            "additional_context": "Review of the latest GPT-5-mini model capabilities and cost savings"
        }
        
        try:
            print(f"   - Requesting content generation for user: {self.test_user_id}")
            print(f"   - Platform: Instagram, Type: Reel")
            print(f"   - Testing GPT-5-mini model integration...")
            
            async with self.session.post(
                f"{BACKEND_URL}/content/generate",
                json=content_request,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=60)  # Increased timeout for LLM
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    
                    # Validate GPT-5-mini generated content structure
                    print(f"✅ GPT-5-mini content generation successful")
                    print(f"   - Content ID: {result.get('id')}")
                    print(f"   - Platform: {result.get('platform')}")
                    print(f"   - Content Type: {result.get('content_type')}")
                    
                    # Check hooks
                    hooks = result.get('hooks', [])
                    print(f"   - Hooks generated: {len(hooks)}")
                    if hooks:
                        print(f"     • Hook 1: {hooks[0][:50]}...")
                    
                    # Check script
                    script = result.get('script', '')
                    print(f"   - Script length: {len(script)} characters")
                    if script:
                        print(f"     • Script preview: {script[:100]}...")
                    
                    # Check caption
                    caption = result.get('caption', '')
                    print(f"   - Caption length: {len(caption)} characters")
                    if caption:
                        print(f"     • Caption preview: {caption[:80]}...")
                    
                    # Verify content quality indicators
                    has_hooks = len(hooks) > 0
                    has_script = len(script) > 50  # Reasonable script length
                    has_caption = len(caption) > 20  # Reasonable caption length
                    
                    if has_hooks and has_script and has_caption:
                        print(f"✅ GPT-5-mini model working correctly - generated quality content")
                        return True
                    else:
                        print(f"⚠️  GPT-5-mini generated content but quality concerns:")
                        print(f"   - Has hooks: {has_hooks}")
                        print(f"   - Has script: {has_script}")  
                        print(f"   - Has caption: {has_caption}")
                        return False
                        
                else:
                    error_text = await response.text()
                    print(f"❌ Content generation failed")
                    print(f"   - Status: {response.status}")
                    print(f"   - Error: {error_text}")
                    return False
                    
        except asyncio.TimeoutError:
            print(f"❌ Content generation timeout - GPT-5-mini model might be unresponsive")
            return False
        except Exception as e:
            print(f"❌ Content generation error: {str(e)}")
            return False

    async def run_verification_tests(self):
        """Run the GPT-5-mini verification tests"""
        print("🚀 Starting GPT-5-mini Model Switch Verification")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        await self.setup_session()
        
        try:
            # Test 1: User Creation
            user_test_passed = await self.test_user_creation()
            
            # Test 2: GPT-5-mini Content Generation  
            content_test_passed = await self.test_gpt5_mini_content_generation()
            
            # Summary
            print(f"\n📋 GPT-5-mini Verification Results:")
            print(f"   - User Creation API: {'✅ PASS' if user_test_passed else '❌ FAIL'}")
            print(f"   - GPT-5-mini Content Generation: {'✅ PASS' if content_test_passed else '❌ FAIL'}")
            
            if user_test_passed and content_test_passed:
                print(f"\n🎉 GPT-5-mini model switch verification SUCCESSFUL")
                print(f"   - No breaking changes detected")
                print(f"   - Content generation working with new model")
                return True
            else:
                print(f"\n🚨 GPT-5-mini model switch verification FAILED")
                print(f"   - Issues detected that need attention")
                return False
                
        finally:
            await self.cleanup_session()

async def main():
    tester = GPTModelSwitchTester()
    success = await tester.run_verification_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())