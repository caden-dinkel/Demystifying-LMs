"""
Test script for OpenRouter API endpoints.
Tests all endpoints and search strategies.
"""
import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_subsection(title: str):
    """Print a formatted subsection header."""
    print(f"\n--- {title} ---")

def test_endpoint(endpoint: str, data: Dict[str, Any], expected_status: int = 200) -> Dict[str, Any]:
    """Test an endpoint and return the response."""
    url = f"{BASE_URL}{endpoint}"
    print(f"\nRequest URL: {url}")
    print(f"Request Body: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == expected_status:
            print("✅ Status code matches expected")
        else:
            print(f"❌ Status code mismatch. Expected: {expected_status}, Got: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            return result
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"Error: {error_detail}")
            return {"error": error_detail}
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running on http://localhost:8000")
        return {"error": "Connection error"}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}

def test_generate_text():
    """Test /lm/openrouter/generate_text endpoint."""
    print_section("TEST 1: Generate Text")
    
    data = {
        "prompt": "Hello, how are you?",
        "model_name": "openai/gpt-3.5-turbo",
        "max_tokens": 20,
        "temperature": 0.7
    }
    
    result = test_endpoint("/lm/openrouter/generate_text", data)
    
    if "error" not in result and "token" in result:
        print(f"\n✅ Generated text: {result['token'][:100]}...")
        return True
    else:
        print("\n❌ Test failed")
        return False

def test_token_probs():
    """Test /lm/openrouter/token_probs endpoint."""
    print_section("TEST 2: Token Probabilities")
    
    data = {
        "prompt": "The quick brown ",
        "model_name": "openai/gpt-3.5-turbo"
    }
    
    result = test_endpoint("/lm/openrouter/token_probs", data)
    
    if "error" not in result:
        if "tokens" in result and "probabilities" in result and "token_ids" in result:
            print(f"\n✅ Top tokens and probabilities:")
            for i, (token, prob) in enumerate(zip(result["tokens"][:5], result["probabilities"][:5])):
                print(f"  {i+1}. '{token}': {prob:.4f}")
            return True
        else:
            print("\n❌ Missing expected fields in response")
            return False
    else:
        print("\n❌ Test failed")
        return False

def test_tokenize_text():
    """Test /lm/openrouter/tokenize_text endpoint (should return 501)."""
    print_section("TEST 3: Tokenize Text (Should Return 501)")
    
    data = {
        "prompt": "Hello world",
        "model_name": "openai/gpt-3.5-turbo"
    }
    
    result = test_endpoint("/lm/openrouter/tokenize_text", data, expected_status=501)
    
    if "error" in result or result.get("detail"):
        print("\n✅ Correctly returned 501 Not Implemented")
        return True
    else:
        print("\n❌ Test failed - should return 501")
        return False

def test_iterative_generation_greedy():
    """Test /lm/openrouter/iterative_generation with Greedy strategy."""
    print_section("TEST 4: Iterative Generation - Greedy Strategy")
    
    data = {
        "prompt": "The quick brown ",
        "model_name": "openai/gpt-3.5-turbo",
        "search_strategy": "Greedy",
        "max_tokens": 5,
        "temperature": 1.0
    }
    
    result = test_endpoint("/lm/openrouter/iterative_generation", data)
    
    if "error" not in result:
        if "generated_text" in result and "steps" in result:
            print(f"\n✅ Generated text: '{result['generated_text']}'")
            print(f"✅ Number of steps: {len(result['steps'])}")
            if result['steps']:
                print(f"\nFirst step details:")
                step = result['steps'][0]
                print(f"  Chosen token: '{step['chosen_token']}'")
                print(f"  Top 3 tokens: {step['top_k_tokens'][:3]}")
            return True
        else:
            print("\n❌ Missing expected fields in response")
            return False
    else:
        print("\n❌ Test failed")
        return False

def test_iterative_generation_sampling():
    """Test /lm/openrouter/iterative_generation with Sampling strategy."""
    print_section("TEST 5: Iterative Generation - Sampling Strategy")
    
    data = {
        "prompt": "The quick brown ",
        "model_name": "openai/gpt-3.5-turbo",
        "search_strategy": "Sampling",
        "max_tokens": 5,
        "temperature": 1.0
    }
    
    result = test_endpoint("/lm/openrouter/iterative_generation", data)
    
    if "error" not in result:
        if "generated_text" in result and "steps" in result:
            print(f"\n✅ Generated text: '{result['generated_text']}'")
            print(f"✅ Number of steps: {len(result['steps'])}")
            return True
        else:
            print("\n❌ Missing expected fields in response")
            return False
    else:
        print("\n❌ Test failed")
        return False

def test_iterative_generation_beam():
    """Test /lm/openrouter/iterative_generation with Beam search strategy."""
    print_section("TEST 6: Iterative Generation - Beam Search Strategy")
    
    data = {
        "prompt": "The quick brown ",
        "model_name": "openai/gpt-3.5-turbo",
        "search_strategy": "Beam",
        "max_tokens": 5,
        "temperature": 1.0
    }
    
    result = test_endpoint("/lm/openrouter/iterative_generation", data)
    
    if "error" not in result:
        if "generated_text" in result and "steps" in result:
            print(f"\n✅ Generated text: '{result['generated_text']}'")
            print(f"✅ Number of steps: {len(result['steps'])}")
            return True
        else:
            print("\n❌ Missing expected fields in response")
            return False
    else:
        print("\n❌ Test failed")
        return False

def test_model_mapping():
    """Test model mapping with different model names."""
    print_section("TEST 7: Model Mapping")
    
    # Test with openai/gpt-3.5-turbo
    data = {
        "prompt": "Hello",
        "model_name": "openai/gpt-3.5-turbo"
    }
    
    result = test_endpoint("/lm/openrouter/token_probs", data)
    
    if "error" not in result:
        print("\n✅ openai/gpt-3.5-turbo model mapping works")
        return True
    else:
        print("\n❌ Model mapping test failed")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("  OpenRouter API Integration Test Suite")
    print("=" * 80)
    print(f"\nTesting against: {BASE_URL}")
    print("Make sure the backend server is running!")
    
    results = []
    
    # Run all tests
    # results.append(("Generate Text", test_generate_text()))
    # results.append(("Token Probabilities", test_token_probs()))
    # results.append(("Tokenize Text (501)", test_tokenize_text()))
    results.append(("Iterative Generation - Greedy", test_iterative_generation_greedy()))
    # results.append(("Iterative Generation - Sampling", test_iterative_generation_sampling()))
    # results.append(("Iterative Generation - Beam", test_iterative_generation_beam()))
    # results.append(("Model Mapping", test_model_mapping()))
    
    # Print summary
    print_section("Test Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print("\nResults:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())

