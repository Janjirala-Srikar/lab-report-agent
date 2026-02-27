"""
Backend Integration Example
This script demonstrates how to fetch trends from your Express backend
and display them using the trend_calculator module
"""

import requests
import json
from trend_calculator import calculate_trends, format_trends_response


class BackendTrendsClient:
    """
    Client for fetching and processing health trends from Express backend
    """
    
    def __init__(self, api_url="http://localhost:5000/api/trends", jwt_token=None):
        """
        Initialize the client
        
        Args:
            api_url: The backend /api/trends endpoint
            jwt_token: JWT token from your login response
        """
        self.api_url = api_url
        self.jwt_token = jwt_token
        self.last_error = None
    
    def set_token(self, jwt_token):
        """Update the JWT token"""
        self.jwt_token = jwt_token
    
    def set_url(self, api_url):
        """Update the API URL"""
        self.api_url = api_url
    
    def fetch_trends(self):
        """
        Fetch health trends from the Express backend
        
        Returns:
            dict: Response with user_id and trends list
            None: If there was an error
        """
        
        if not self.jwt_token:
            self.last_error = "JWT token is required. Log in first."
            return None
        
        try:
            # Make request to Express backend
            response = requests.get(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.jwt_token}",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            
            # Handle different status codes
            if response.status_code == 401:
                self.last_error = "Unauthorized: Your JWT token is invalid or expired"
                return None
            
            if response.status_code == 403:
                self.last_error = "Forbidden: Access denied"
                return None
            
            if response.status_code == 404:
                self.last_error = f"Not found: Check API URL {self.api_url}"
                return None
            
            if response.status_code >= 500:
                self.last_error = "Server error: Express backend is down"
                return None
            
            response.raise_for_status()
            data = response.json()
            
            # Check if backend returned success
            if "trends" in data:
                self.last_error = None
                return data
            elif "message" in data:
                self.last_error = f"Backend message: {data['message']}"
                return None
            else:
                self.last_error = "Unexpected response format"
                return None
                
        except requests.exceptions.ConnectionError:
            self.last_error = f"Cannot connect to {self.api_url}. Is Express running on port 5000?"
            return None
        except requests.exceptions.Timeout:
            self.last_error = "Request timed out (10s)"
            return None
        except Exception as e:
            self.last_error = f"Error: {str(e)}"
            return None
    
    def get_error(self):
        """Get the last error message"""
        return self.last_error


# ─────────────────────────────────────────────
# EXAMPLE USAGE
# ─────────────────────────────────────────────

if __name__ == "__main__":
    # Step 1: Initialize client with your backend URL
    client = BackendTrendsClient(
        api_url="http://localhost:5000/api/trends"
    )
    
    # Step 2: Set your JWT token (from login response)
    # client.set_token("your_jwt_token_here")
    
    # Step 3: Fetch trends from backend
    # result = client.fetch_trends()
    
    # Step 4: Process and display
    # if result:
    #     trends = result.get("trends", [])
    #     user_id = result.get("user_id")
    #     
    #     print(f"User ID: {user_id}")
    #     print(f"Total biomarkers: {len(trends)}")
    #     print("\nTrends:")
    #     for trend in trends:
    #         print(f"  {trend['test_name']}: {trend['trend']} ({trend['percent_change']}%)")
    # else:
    #     print(f"Error: {client.get_error()}")
