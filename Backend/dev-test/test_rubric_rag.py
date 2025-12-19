"""
Test script for Rubric + RAG integration
Run this to verify the implementation works correctly
"""
import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000/api"  # Adjust if needed
TEACHER_ID = "your-teacher-id"  # Replace with actual teacher ID
MODULE_ID = None  # Will be set after creating module


def print_response(title: str, response: requests.Response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    if response.ok:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")


def test_list_templates():
    """Test 1: List available rubric templates"""
    print("\n🧪 TEST 1: List Rubric Templates")
    response = requests.get(f"{BASE_URL}/rubric-templates")
    print_response("Available Templates", response)
    return response.ok


def test_create_module_with_default_rubric():
    """Test 2: Create module (uses default rubric)"""
    global MODULE_ID

    print("\n🧪 TEST 2: Create Module with Default Rubric")

    payload = {
        "teacher_id": TEACHER_ID,
        "name": f"Test Rubric Module",
        "description": "Testing rubric and RAG integration",
        "is_active": True
    }

    response = requests.post(f"{BASE_URL}/modules", json=payload)
    print_response("Module Created", response)

    if response.ok:
        MODULE_ID = response.json()["id"]
        print(f"\n✅ Module ID: {MODULE_ID}")
        return True
    return False


def test_get_module_rubric():
    """Test 3: Get module's rubric (should return default)"""
    print("\n🧪 TEST 3: Get Module Rubric")

    response = requests.get(f"{BASE_URL}/modules/{MODULE_ID}/rubric")
    print_response("Module Rubric", response)

    if response.ok:
        rubric = response.json()
        print(f"\n📊 Summary: {rubric.get('summary')}")
        print(f"📊 RAG Enabled: {rubric['rubric']['rag_settings']['enabled']}")
        print(f"📊 Tone: {rubric['rubric']['feedback_style']['tone']}")
        return True
    return False


def test_update_rubric():
    """Test 4: Update rubric with custom settings"""
    print("\n🧪 TEST 4: Update Rubric with Custom Settings")

    custom_rubric = {
        "feedback_style": {
            "tone": "strict",
            "detail_level": "detailed",
            "include_examples": True,
            "reference_course_material": True
        },
        "rag_settings": {
            "enabled": True,
            "max_context_chunks": 5,
            "similarity_threshold": 0.75,
            "include_source_references": True
        },
        "custom_instructions": "Focus on mathematical rigor. Reference formulas from course materials. Maintain high standards for accuracy."
    }

    response = requests.put(
        f"{BASE_URL}/modules/{MODULE_ID}/rubric",
        json=custom_rubric
    )
    print_response("Rubric Updated", response)
    return response.ok


def test_validate_rubric():
    """Test 5: Validate rubric configuration"""
    print("\n🧪 TEST 5: Validate Rubric")

    # Valid rubric
    valid_rubric = {
        "grading_criteria": {
            "accuracy": {"weight": 50, "description": "Correctness"},
            "completeness": {"weight": 30, "description": "Coverage"},
            "clarity": {"weight": 20, "description": "Expression"}
        },
        "feedback_style": {
            "tone": "encouraging"
        }
    }

    response = requests.post(f"{BASE_URL}/rubric/validate", json=valid_rubric)
    print_response("Valid Rubric", response)

    # Invalid rubric (weights don't sum to 100)
    invalid_rubric = {
        "grading_criteria": {
            "accuracy": {"weight": 60, "description": "Correctness"},
            "completeness": {"weight": 30, "description": "Coverage"}
        }
    }

    response_invalid = requests.post(f"{BASE_URL}/rubric/validate", json=invalid_rubric)
    print_response("Invalid Rubric", response_invalid)

    return response.ok


def test_apply_template():
    """Test 6: Apply a rubric template"""
    print("\n🧪 TEST 6: Apply STEM Template")

    response = requests.post(
        f"{BASE_URL}/modules/{MODULE_ID}/rubric/apply-template",
        params={
            "template_name": "stem_course",
            "preserve_custom_instructions": True
        }
    )
    print_response("Template Applied", response)

    if response.ok:
        # Verify template was applied
        rubric_response = requests.get(f"{BASE_URL}/modules/{MODULE_ID}/rubric")
        if rubric_response.ok:
            rubric = rubric_response.json()["rubric"]
            print(f"\n✅ Accuracy weight: {rubric['grading_criteria']['accuracy']['weight']}%")
            print(f"✅ Has 'methodology' criterion: {'methodology' in rubric['grading_criteria']}")
            print(f"✅ Similarity threshold: {rubric['rag_settings']['similarity_threshold']}")

    return response.ok


def test_rag_context_retrieval():
    """Test 7: Test RAG context retrieval (requires embedded documents)"""
    print("\n🧪 TEST 7: RAG Context Retrieval")
    print("⚠️  This test requires:")
    print("   1. Upload a document to the module")
    print("   2. Wait for processing to reach 'embedded' status")
    print("   3. Submit a student answer to trigger feedback generation")
    print("\n   Check the feedback response for:")
    print("   - used_rag: true")
    print("   - rag_sources: [list of documents]")
    print("   - rag_context_summary: description")


def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*60)
    print("🚀 Starting Rubric + RAG Integration Tests")
    print("="*60)

    tests = [
        ("List Templates", test_list_templates),
        ("Create Module", test_create_module_with_default_rubric),
        ("Get Rubric", test_get_module_rubric),
        ("Update Rubric", test_update_rubric),
        ("Validate Rubric", test_validate_rubric),
        ("Apply Template", test_apply_template),
        ("RAG Context", test_rag_context_retrieval),
    ]

    results = []
    for name, test_func in tests:
        try:
            if name == "Create Module" and not TEACHER_ID:
                print(f"\n⏭️  Skipping {name}: TEACHER_ID not set")
                results.append((name, "skipped"))
                continue

            if name in ["Get Rubric", "Update Rubric", "Apply Template"] and not MODULE_ID:
                print(f"\n⏭️  Skipping {name}: No module created")
                results.append((name, "skipped"))
                continue

            success = test_func()
            results.append((name, "✅ PASS" if success else "❌ FAIL"))
        except Exception as e:
            print(f"\n❌ Error in {name}: {str(e)}")
            results.append((name, f"❌ ERROR: {str(e)}"))

    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    for test_name, result in results:
        print(f"{test_name:.<40} {result}")


if __name__ == "__main__":
    # Update these before running
    print("⚠️  IMPORTANT: Update the following variables before running:")
    print(f"   - BASE_URL: {BASE_URL}")
    print(f"   - TEACHER_ID: {TEACHER_ID}")
    print("\n   Press Ctrl+C to cancel, or Enter to continue...")

    try:
        input()
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled")
