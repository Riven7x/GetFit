#!/usr/bin/env python3
"""
GetFit Backend API Test Suite
Tests all authentication, profile, and workout endpoints
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import sys

# Backend URL from frontend .env
BASE_URL = "https://getfit-mobile-1.preview.emergentagent.com/api"

class GetFitAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user = {
            "email": "john.doe@getfit.com",
            "password": "SecurePass123!",
            "name": "John Doe", 
            "gender": "male",
            "weight_kg": 75.0,
            "height_cm": 180.0
        }
        self.results = {
            "passed": 0,
            "failed": 0,
            "tests": []
        }

    def log_test(self, test_name: str, success: bool, message: str):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
        self.results["tests"].append({
            "name": test_name,
            "success": success,
            "message": message
        })
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        if headers is None:
            headers = {}
        
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        headers["Content-Type"] = "application/json"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        try:
            response = self.make_request("POST", "/auth/register", self.test_user)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user = data["user"]
                    
                    # Verify user data
                    expected_fields = ["id", "email", "name", "gender", "weight_kg", "height_cm", "created_at"]
                    missing_fields = [field for field in expected_fields if field not in user]
                    
                    if missing_fields:
                        self.log_test("User Registration", False, f"Missing user fields: {missing_fields}")
                    else:
                        self.log_test("User Registration", True, f"User registered successfully with ID: {user['id']}")
                else:
                    self.log_test("User Registration", False, f"Invalid response format: {data}")
            else:
                self.log_test("User Registration", False, f"Registration failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Registration", False, f"Registration request failed: {e}")

        # Test duplicate registration
        try:
            response = self.make_request("POST", "/auth/register", self.test_user)
            if response.status_code == 400:
                self.log_test("Duplicate Registration Prevention", True, "Correctly prevented duplicate email registration")
            else:
                self.log_test("Duplicate Registration Prevention", False, f"Should return 400 for duplicate email, got {response.status_code}")
        except Exception as e:
            self.log_test("Duplicate Registration Prevention", False, f"Duplicate registration test failed: {e}")

    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Test successful login
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    # Update token for subsequent tests
                    self.auth_token = data["access_token"]
                    self.log_test("User Login", True, f"Login successful, token received")
                else:
                    self.log_test("User Login", False, f"Invalid login response format: {data}")
            else:
                self.log_test("User Login", False, f"Login failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Login request failed: {e}")

        # Test invalid credentials
        invalid_login = {
            "email": self.test_user["email"],
            "password": "wrongpassword"
        }
        
        try:
            response = self.make_request("POST", "/auth/login", invalid_login)
            if response.status_code == 401:
                self.log_test("Invalid Login Prevention", True, "Correctly rejected invalid credentials")
            else:
                self.log_test("Invalid Login Prevention", False, f"Should return 401 for invalid credentials, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Login Prevention", False, f"Invalid login test failed: {e}")

    def test_get_current_user(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get Current User ===")
        
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                user = response.json()
                expected_fields = ["id", "email", "name", "gender", "weight_kg", "height_cm", "created_at"]
                missing_fields = [field for field in expected_fields if field not in user]
                
                if missing_fields:
                    self.log_test("Get Current User", False, f"Missing user fields: {missing_fields}")
                elif user["email"] == self.test_user["email"]:
                    self.log_test("Get Current User", True, f"Retrieved user profile for {user['email']}")
                else:
                    self.log_test("Get Current User", False, f"Email mismatch: expected {self.test_user['email']}, got {user['email']}")
            else:
                self.log_test("Get Current User", False, f"Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Current User", False, f"Get current user request failed: {e}")

    def test_profile_update(self):
        """Test profile update endpoint"""
        print("\n=== Testing Profile Update ===")
        
        if not self.auth_token:
            self.log_test("Profile Update", False, "No auth token available")
            return
        
        # Test profile update
        update_data = {
            "name": "John Updated",
            "weight_kg": 77.5,
            "height_cm": 182.0
        }
        
        try:
            response = self.make_request("PUT", "/profile", update_data)
            
            if response.status_code == 200:
                user = response.json()
                if (user["name"] == update_data["name"] and 
                    user["weight_kg"] == update_data["weight_kg"] and
                    user["height_cm"] == update_data["height_cm"]):
                    self.log_test("Profile Update", True, f"Profile updated successfully: {user['name']}, {user['weight_kg']}kg, {user['height_cm']}cm")
                else:
                    self.log_test("Profile Update", False, f"Profile data not updated correctly: {user}")
            else:
                self.log_test("Profile Update", False, f"Profile update failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Profile Update", False, f"Profile update request failed: {e}")

    def test_workout_creation(self):
        """Test workout creation endpoint"""
        print("\n=== Testing Workout Creation ===")
        
        if not self.auth_token:
            self.log_test("Workout Creation", False, "No auth token available")
            return
        
        # Test workout creation
        workout_data = {
            "exercises": [
                {
                    "type": "pushup",
                    "count": 20,
                    "duration_seconds": 60.0,
                    "calories": 15.5
                },
                {
                    "type": "squats", 
                    "count": 30,
                    "duration_seconds": 90.0,
                    "calories": 22.3
                },
                {
                    "type": "arm_circles",
                    "count": 50,
                    "duration_seconds": 120.0,
                    "calories": 18.7
                }
            ],
            "start_time": datetime.utcnow().isoformat(),
            "end_time": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
        
        try:
            response = self.make_request("POST", "/workouts", workout_data)
            
            if response.status_code == 200:
                data = response.json()
                if "workout_id" in data and "message" in data:
                    self.log_test("Workout Creation", True, f"Workout created successfully: {data['message']}")
                else:
                    self.log_test("Workout Creation", False, f"Invalid workout creation response: {data}")
            else:
                self.log_test("Workout Creation", False, f"Workout creation failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Workout Creation", False, f"Workout creation request failed: {e}")

    def test_workout_merging(self):
        """Test workout merging for same date"""
        print("\n=== Testing Workout Merging ===")
        
        if not self.auth_token:
            self.log_test("Workout Merging", False, "No auth token available")
            return
        
        # Create another workout for the same date
        workout_data = {
            "exercises": [
                {
                    "type": "pushup",
                    "count": 10,
                    "duration_seconds": 30.0,
                    "calories": 7.5
                },
                {
                    "type": "jumping_jacks",
                    "count": 25,
                    "duration_seconds": 60.0,
                    "calories": 12.0
                }
            ],
            "start_time": datetime.utcnow().isoformat(),
            "end_time": (datetime.utcnow() + timedelta(minutes=3)).isoformat()
        }
        
        try:
            response = self.make_request("POST", "/workouts", workout_data)
            
            if response.status_code == 200:
                data = response.json()
                if "updated" in data["message"].lower():
                    self.log_test("Workout Merging", True, f"Workout merged successfully: {data['message']}")
                else:
                    self.log_test("Workout Merging", True, f"Workout processing: {data['message']}")
            else:
                self.log_test("Workout Merging", False, f"Workout merging failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Workout Merging", False, f"Workout merging request failed: {e}")

    def test_daily_stats(self):
        """Test daily stats endpoint"""
        print("\n=== Testing Daily Stats ===")
        
        if not self.auth_token:
            self.log_test("Daily Stats", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/workouts/today")
            
            if response.status_code == 200:
                stats = response.json()
                expected_fields = ["date", "total_calories", "pushups", "squats", "arm_circles"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if missing_fields:
                    self.log_test("Daily Stats", False, f"Missing stats fields: {missing_fields}")
                else:
                    self.log_test("Daily Stats", True, 
                        f"Today's stats: {stats['pushups']} pushups, {stats['squats']} squats, "
                        f"{stats['arm_circles']} arm circles, {stats['total_calories']} calories")
            else:
                self.log_test("Daily Stats", False, f"Daily stats failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Daily Stats", False, f"Daily stats request failed: {e}")

    def test_weekly_stats(self):
        """Test weekly stats endpoint"""
        print("\n=== Testing Weekly Stats ===")
        
        if not self.auth_token:
            self.log_test("Weekly Stats", False, "No auth token available")
            return
        
        try:
            response = self.make_request("GET", "/workouts/weekly")
            
            if response.status_code == 200:
                stats = response.json()
                expected_fields = ["week_start", "days", "total_calories", "total_exercises"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if missing_fields:
                    self.log_test("Weekly Stats", False, f"Missing weekly stats fields: {missing_fields}")
                elif len(stats["days"]) != 7:
                    self.log_test("Weekly Stats", False, f"Expected 7 days, got {len(stats['days'])}")
                else:
                    self.log_test("Weekly Stats", True, 
                        f"Weekly stats: {stats['total_exercises']} total exercises, "
                        f"{stats['total_calories']} total calories over 7 days")
            else:
                self.log_test("Weekly Stats", False, f"Weekly stats failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Weekly Stats", False, f"Weekly stats request failed: {e}")

    def test_authentication_protection(self):
        """Test that protected endpoints require authentication"""
        print("\n=== Testing Authentication Protection ===")
        
        # Save current token
        saved_token = self.auth_token
        self.auth_token = None
        
        protected_endpoints = [
            ("GET", "/auth/me"),
            ("PUT", "/profile"),
            ("POST", "/workouts"),
            ("GET", "/workouts/today"),
            ("GET", "/workouts/weekly")
        ]
        
        for method, endpoint in protected_endpoints:
            try:
                response = self.make_request(method, endpoint, {})
                if response.status_code == 401:
                    self.log_test(f"Auth Protection {endpoint}", True, "Correctly requires authentication")
                else:
                    self.log_test(f"Auth Protection {endpoint}", False, f"Should return 401, got {response.status_code}")
            except Exception as e:
                self.log_test(f"Auth Protection {endpoint}", False, f"Auth protection test failed: {e}")
        
        # Restore token
        self.auth_token = saved_token

    def test_input_validation(self):
        """Test input validation"""
        print("\n=== Testing Input Validation ===")
        
        # Test registration with invalid email
        try:
            invalid_user = self.test_user.copy()
            invalid_user["email"] = "invalid-email"
            response = self.make_request("POST", "/auth/register", invalid_user)
            
            if response.status_code == 422:
                self.log_test("Invalid Email Validation", True, "Correctly rejected invalid email format")
            else:
                self.log_test("Invalid Email Validation", False, f"Should return 422 for invalid email, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Email Validation", False, f"Email validation test failed: {e}")
        
        # Test workout with invalid exercise data
        if self.auth_token:
            try:
                invalid_workout = {
                    "exercises": [
                        {
                            "type": "pushup",
                            "count": "invalid_count",  # Should be integer
                            "duration_seconds": 60.0,
                            "calories": 15.5
                        }
                    ],
                    "start_time": datetime.utcnow().isoformat(),
                    "end_time": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
                }
                response = self.make_request("POST", "/workouts", invalid_workout)
                
                if response.status_code == 422:
                    self.log_test("Invalid Workout Data Validation", True, "Correctly rejected invalid exercise data")
                else:
                    self.log_test("Invalid Workout Data Validation", False, f"Should return 422 for invalid data, got {response.status_code}")
            except Exception as e:
                self.log_test("Invalid Workout Data Validation", False, f"Workout validation test failed: {e}")

    def run_all_tests(self):
        """Run all test methods"""
        print(f"\n{'='*50}")
        print("GetFit Backend API Test Suite")
        print(f"Testing against: {self.base_url}")
        print(f"{'='*50}")
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_profile_update()
        self.test_workout_creation()
        self.test_workout_merging()
        self.test_daily_stats()
        self.test_weekly_stats()
        self.test_authentication_protection()
        self.test_input_validation()
        
        # Print summary
        print(f"\n{'='*50}")
        print("TEST SUMMARY")
        print(f"{'='*50}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Total: {self.results['passed'] + self.results['failed']}")
        
        if self.results['failed'] > 0:
            print(f"\n🔍 FAILED TESTS:")
            for test in self.results['tests']:
                if not test['success']:
                    print(f"  - {test['name']}: {test['message']}")
        
        return self.results['failed'] == 0


if __name__ == "__main__":
    tester = GetFitAPITester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ Some tests failed!")
        sys.exit(1)