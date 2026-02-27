"""
Trend Calculator Module
Mirrors the backend trendController.js logic for local processing
"""

import math


def calculate_trends(all_tests):
    """
    Calculate health trends from test history
    
    Args:
        all_tests: List of test records with keys: test_name, value, unit, created_at
    
    Returns:
        List of trend objects with: test_name, previous_value, current_value, percent_change, trend
    """
    
    if not all_tests:
        return []
    
    # Group by test_name
    grouped = {}
    for row in all_tests:
        test_name = row.get('test_name')
        if test_name not in grouped:
            grouped[test_name] = []
        grouped[test_name].append(row)
    
    trends = []
    
    for test_name in grouped:
        records = grouped[test_name]
        
        # Need at least 2 records to calculate a trend
        if len(records) < 2:
            continue
        
        # Get first and latest values
        first = float(records[0].get('value', 0))
        latest = float(records[-1].get('value', 0))
        
        # Handle edge cases: zero or negative values
        if first == 0:
            percent_change = 0 if latest == 0 else (100 if latest > 0 else -100)
        else:
            percent_change = ((latest - first) / abs(first)) * 100
        
        # Ensure it's a valid number
        if math.isnan(percent_change):
            percent_change = 0
        
        # Determine trend direction
        if percent_change > 0:
            trend_direction = "Increased"
        elif percent_change < 0:
            trend_direction = "Decreased"
        else:
            trend_direction = "Stable"
        
        trends.append({
            "test_name": test_name,
            "previous_value": first,
            "current_value": latest,
            "percent_change": f"{percent_change:.2f}",
            "trend": trend_direction,
        })
    
    return trends


def format_trends_response(user_id, trends):
    """
    Format trends into the expected response structure
    
    Args:
        user_id: The user's ID
        trends: List of trend objects from calculate_trends()
    
    Returns:
        Dictionary with user_id and trends list
    """
    return {
        "user_id": user_id,
        "trends": trends
    }


# Example usage:
if __name__ == "__main__":
    # Sample test data (from database)
    sample_tests = [
        {"test_name": "HbA1c", "value": 5.4, "unit": "%", "created_at": "2025-01-15"},
        {"test_name": "HbA1c", "value": 6.1, "unit": "%", "created_at": "2025-02-27"},
        {"test_name": "LDL Cholesterol", "value": 130, "unit": "mg/dL", "created_at": "2025-01-15"},
        {"test_name": "LDL Cholesterol", "value": 112, "unit": "mg/dL", "created_at": "2025-02-27"},
        {"test_name": "Vitamin D", "value": 18, "unit": "ng/mL", "created_at": "2025-01-15"},
        {"test_name": "Vitamin D", "value": 32, "unit": "ng/mL", "created_at": "2025-02-27"},
    ]
    
    trends = calculate_trends(sample_tests)
    response = format_trends_response("user123", trends)
    
    print("Calculated Trends:")
    for trend in response["trends"]:
        print(f"  {trend['test_name']}: {trend['trend']} ({trend['percent_change']}%)")
