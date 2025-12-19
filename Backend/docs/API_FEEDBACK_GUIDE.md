# AI Feedback API Usage Guide

## Quick Start

The AI feedback system is now integrated and ready to use. Here's how to generate feedback for student answers.

---

## API Endpoints

### 1. Submit Answer with Immediate Feedback

**Endpoint:** `POST /api/student-answers/?generate_feedback=true`

**Use Case:** Student submits an answer and gets instant AI feedback

**Request:**
```bash
curl -X POST "http://localhost:8000/api/student-answers/?generate_feedback=true" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_12345",
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "module_id": "660e8400-e29b-41d4-a716-446655440000",
    "document_id": "770e8400-e29b-41d4-a716-446655440000",
    "answer": {"selected_option": "B"},
    "attempt": 1
  }'
```

**Response:**
```json
{
  "answer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "student_id": "STUDENT_12345",
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "module_id": "660e8400-e29b-41d4-a716-446655440000",
    "document_id": "770e8400-e29b-41d4-a716-446655440000",
    "answer": {"selected_option": "B"},
    "attempt": 1,
    "submitted_at": "2025-01-15T10:30:00Z"
  },
  "feedback": {
    "feedback_id": "880e8400-e29b-41d4-a716-446655440000",
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "is_correct": false,
    "correctness_score": 45.0,
    "explanation": "Your answer is partially correct. You identified the main concept but missed key details about...",
    "improvement_hint": "Review the section on derivatives in Chapter 3. Pay attention to the power rule formula.",
    "concept_explanation": "The power rule states that d/dx[x^n] = n*x^(n-1). This fundamental rule is essential for...",
    "confidence_level": "high",
    "selected_option": "B",
    "correct_option": "A",
    "available_options": {
      "A": "2x",
      "B": "x²",
      "C": "2",
      "D": "x"
    },
    "used_rag": true,
    "rag_sources": ["Calculus_Chapter3.pdf", "Lecture_Notes.pdf"],
    "rag_context_summary": "Retrieved from: Calculus_Chapter3.pdf, Lecture_Notes.pdf",
    "feedback_type": "mcq",
    "attempt_number": 1,
    "model_used": "gpt-4",
    "generated_at": "2025-01-15T10:30:05Z",
    "fallback": false,
    "error": false
  },
  "feedback_generated": true
}
```

---

### 2. Submit Answer Without Feedback (Faster)

**Endpoint:** `POST /api/student-answers/`

**Use Case:** Just save the answer, generate feedback later

**Request:**
```bash
curl -X POST "http://localhost:8000/api/student-answers/" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_12345",
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "module_id": "660e8400-e29b-41d4-a716-446655440000",
    "answer": {"text_response": "The derivative is 2x because..."},
    "attempt": 1
  }'
```

**Response:**
```json
{
  "answer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "student_id": "STUDENT_12345",
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "module_id": "660e8400-e29b-41d4-a716-446655440000",
    "answer": {"text_response": "The derivative is 2x because..."},
    "attempt": 1,
    "submitted_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 3. Generate Feedback for Existing Answer

**Endpoint:** `POST /api/student-answers/{answer_id}/feedback`

**Use Case:** Student wants to see feedback again, or generate feedback after submission

**Request:**
```bash
curl -X POST "http://localhost:8000/api/student-answers/880e8400-e29b-41d4-a716-446655440000/feedback"
```

**Response:** (Same as feedback object above)

---

### 4. Batch Generate Feedback for Module

**Endpoint:** `POST /api/student-answers/modules/{module_id}/feedback/batch`

**Use Case:** Teacher wants to generate feedback for all students after test ends

**Request:**
```bash
# Generate for all students, attempt 1
curl -X POST "http://localhost:8000/api/student-answers/modules/660e8400-e29b-41d4-a716-446655440000/feedback/batch?attempt=1"

# Generate for specific student only
curl -X POST "http://localhost:8000/api/student-answers/modules/660e8400-e29b-41d4-a716-446655440000/feedback/batch?student_id=STUDENT_12345&attempt=1"
```

**Response:**
```json
{
  "message": "Generated feedback for 45/50 answers",
  "feedback_generated": 45,
  "total_answers": 50,
  "results": [
    {
      "answer_id": "880e8400-e29b-41d4-a716-446655440000",
      "student_id": "STUDENT_12345",
      "question_id": "550e8400-e29b-41d4-a716-446655440000",
      "success": true,
      "feedback": { /* full feedback object */ }
    },
    {
      "answer_id": "990e8400-e29b-41d4-a716-446655440000",
      "student_id": "STUDENT_67890",
      "question_id": "550e8400-e29b-41d4-a716-446655440000",
      "success": false,
      "error": "OpenAI API timeout"
    }
    // ... more results
  ]
}
```

---

## Answer Formats

### MCQ Answer
```json
{
  "answer": {
    "selected_option": "B"
  }
}
```

### Short Answer
```json
{
  "answer": {
    "text_response": "The derivative of x² is 2x because of the power rule."
  }
}
```

### Essay Answer
```json
{
  "answer": {
    "text_response": "Long essay text here... The concept of derivatives is fundamental to calculus..."
  }
}
```

---

## Feedback Response Fields

### Core Fields (Always Present)
- `feedback_id`: UUID of the feedback
- `question_id`: UUID of the question
- `is_correct`: Boolean - true if answer is correct/acceptable
- `correctness_score`: Float 0-100 - percentage score
- `explanation`: String - detailed explanation
- `improvement_hint`: String - specific guidance for improvement
- `concept_explanation`: String - explanation of key concepts
- `confidence_level`: String - "high", "medium", or "low"

### MCQ-Specific Fields
- `selected_option`: String - student's choice (e.g., "B")
- `correct_option`: String - correct answer (e.g., "A")
- `available_options`: Object - all options {"A": "text", "B": "text", ...}

### Text Answer-Specific Fields
- `strengths`: Array of strings - what student did well
- `weaknesses`: Array of strings - areas for improvement
- `missing_concepts`: Array of strings - important concepts not addressed
- `answer_length`: Integer - length of student answer
- `reference_answer`: String - expected/reference answer

### RAG Fields (Course Material Integration)
- `used_rag`: Boolean - whether RAG context was used
- `rag_sources`: Array of strings - source document names
- `rag_context_summary`: String - summary of sources used

### Metadata
- `feedback_type`: String - "mcq", "short", or "essay"
- `attempt_number`: Integer - 1 or 2
- `model_used`: String - AI model (e.g., "gpt-4")
- `generated_at`: ISO timestamp - when feedback was generated
- `fallback`: Boolean - true if fallback feedback was used (AI unavailable)
- `error`: Boolean - true if error occurred
- `message`: String - error message if any

---

## Example Workflows

### Workflow 1: Real-Time Feedback (Recommended)

**Student takes test:**
```javascript
// Frontend submits answer with feedback flag
const response = await fetch('/api/student-answers/?generate_feedback=true', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    student_id: currentStudent.id,
    question_id: currentQuestion.id,
    module_id: currentModule.id,
    answer: {selected_option: 'B'},
    attempt: 1
  })
});

const result = await response.json();

// Display answer saved confirmation
console.log('Answer saved:', result.answer);

// Show feedback immediately
if (result.feedback_generated) {
  displayFeedback(result.feedback);
} else {
  console.error('Feedback generation failed:', result.feedback_error);
}
```

### Workflow 2: Deferred Feedback

**Save answer first:**
```javascript
// Submit answer quickly
const answerResponse = await fetch('/api/student-answers/', {
  method: 'POST',
  body: JSON.stringify(answerData)
});

const savedAnswer = await answerResponse.json();
```

**Generate feedback later:**
```javascript
// When student clicks "View Feedback"
const feedbackResponse = await fetch(`/api/student-answers/${savedAnswer.answer.id}/feedback`, {
  method: 'POST'
});

const feedback = await feedbackResponse.json();
displayFeedback(feedback);
```

### Workflow 3: Batch Processing (Teacher)

**After test closes:**
```javascript
// Teacher dashboard: Generate feedback for all submissions
const batchResponse = await fetch(
  `/api/student-answers/modules/${moduleId}/feedback/batch?attempt=1`,
  {method: 'POST'}
);

const batchResult = await batchResponse.json();
console.log(`Generated feedback for ${batchResult.feedback_generated}/${batchResult.total_answers} students`);

// Show progress
batchResult.results.forEach(result => {
  if (result.success) {
    console.log(`✓ ${result.student_id}: Score ${result.feedback.correctness_score}/100`);
  } else {
    console.log(`✗ ${result.student_id}: ${result.error}`);
  }
});
```

---

## Configuration

### Rubric Settings (Teacher Controls)

Teachers configure feedback behavior via the rubric editor UI:
- **Location:** `/dashboard/rubric?moduleId={id}`
- **Settings:**
  - Tone: Friendly (encouraging) / Balanced (neutral) / Direct (strict)
  - Custom instructions: Text field for specific guidance
  - Template: Pre-configured settings for different subjects

**Example Rubric (stored in `modules.assignment_config.feedback_rubric`):**
```json
{
  "feedback_style": {
    "tone": "encouraging",
    "detail_level": "detailed"
  },
  "grading_criteria": {
    "accuracy": {"weight": 40, "description": "Correctness of answer"},
    "completeness": {"weight": 30, "description": "Thoroughness"},
    "clarity": {"weight": 20, "description": "Clear explanation"},
    "critical_thinking": {"weight": 10, "description": "Analysis"}
  },
  "rag_settings": {
    "enabled": true,
    "max_context_chunks": 3,
    "similarity_threshold": 0.7
  },
  "custom_instructions": "Focus on conceptual understanding, not memorization"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": true,
  "message": "Failed to generate feedback: OpenAI API timeout",
  "is_correct": false,
  "correctness_score": 0,
  "feedback_type": "error",
  "explanation": "Feedback could not be generated due to an error.",
  "improvement_hint": "Please try again or contact support.",
  "confidence_level": "low"
}
```

### Common Errors

**1. OpenAI API Error**
- Cause: Invalid API key, rate limit, timeout
- Solution: Check `.env` file, verify API key, check OpenAI dashboard

**2. No Documents Found**
- Cause: Module has no uploaded/embedded documents
- Effect: RAG disabled, feedback still works but less context-aware
- Solution: Upload course materials and wait for embedding process

**3. Question Not Found**
- Cause: Invalid `question_id`
- HTTP Status: 404
- Solution: Verify question exists in database

**4. Answer Not Found**
- Cause: Invalid `answer_id` when requesting feedback
- HTTP Status: 404
- Solution: Verify answer was saved successfully

---

## Performance Considerations

### Response Times
- **With RAG**: 5-10 seconds (OpenAI API latency + embedding search)
- **Without RAG**: 3-7 seconds (OpenAI API latency only)

### Optimization Tips

**1. Use generate_feedback=false for faster submission**
```javascript
// Fast submission (no feedback)
POST /api/student-answers/  // ~100ms

// Generate feedback later when student navigates to results
POST /api/student-answers/{id}/feedback  // ~5-10s
```

**2. Batch process after hours**
```bash
# Generate feedback for all students overnight
POST /api/student-answers/modules/{id}/feedback/batch
```

**3. Cache feedback**
- Store generated feedback in database
- Serve cached feedback on subsequent views
- Regenerate only when requested explicitly

---

## Testing

### Manual Test

**1. Create a test answer:**
```bash
curl -X POST "http://localhost:8000/api/student-answers/?generate_feedback=true" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "TEST_USER",
    "question_id": "YOUR_QUESTION_ID",
    "module_id": "YOUR_MODULE_ID",
    "answer": {"selected_option": "A"},
    "attempt": 1
  }'
```

**2. Check response:**
- Verify `feedback_generated: true`
- Check `feedback.is_correct` matches expectation
- Verify `feedback.explanation` is relevant
- Check if `used_rag: true` (if documents exist)

### Automated Test

```bash
cd Backend
source venv/bin/activate
python test_ai_feedback_integration.py
```

**Expected output:**
```
✓ PASS - Import Test
✓ PASS - OpenAI Connection
✓ PASS - Database Connection
✓ PASS - Rubric Service
✓ PASS - RAG Retrieval
✓ PASS - Complete Feedback Flow

Total: 6/6 tests passed
```

---

## Frontend Integration Example

### React Component
```javascript
import { useState } from 'react';

function QuestionAnswering({ question, moduleId, studentId }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitAnswer = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/student-answers/?generate_feedback=true', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          student_id: studentId,
          question_id: question.id,
          module_id: moduleId,
          answer: {selected_option: selectedOption},
          attempt: 1
        })
      });

      const result = await response.json();

      if (result.feedback_generated) {
        setFeedback(result.feedback);
      } else {
        alert('Feedback generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>{question.text}</h2>

      {/* Options */}
      {Object.entries(question.options).map(([key, text]) => (
        <label key={key}>
          <input
            type="radio"
            value={key}
            checked={selectedOption === key}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          {key}. {text}
        </label>
      ))}

      {/* Submit Button */}
      <button onClick={submitAnswer} disabled={!selectedOption || loading}>
        {loading ? 'Submitting...' : 'Submit Answer'}
      </button>

      {/* Feedback Display */}
      {feedback && (
        <div className={feedback.is_correct ? 'feedback-correct' : 'feedback-incorrect'}>
          <h3>
            {feedback.is_correct ? '✓ Correct!' : '✗ Incorrect'}
            {' - '}
            Score: {feedback.correctness_score}/100
          </h3>

          <p><strong>Explanation:</strong> {feedback.explanation}</p>
          <p><strong>Hint:</strong> {feedback.improvement_hint}</p>
          <p><strong>Concept:</strong> {feedback.concept_explanation}</p>

          {feedback.used_rag && (
            <div className="rag-sources">
              <strong>Referenced from course materials:</strong>
              <ul>
                {feedback.rag_sources.map(source => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Production Checklist

- [ ] OpenAI API key is valid and has credits
- [ ] Database is properly configured and accessible
- [ ] Documents are uploaded and embedded
- [ ] Rubric is configured for each module
- [ ] Error monitoring is set up (Sentry, etc.)
- [ ] Rate limiting is configured for API endpoints
- [ ] Feedback responses are cached (optional but recommended)
- [ ] Analytics tracking is set up for feedback quality
- [ ] Student UI displays feedback clearly
- [ ] Teacher dashboard shows feedback statistics

---

## Support

For issues or questions:
1. Check test results: `python test_ai_feedback_integration.py`
2. Review logs: Check FastAPI logs for errors
3. Verify configuration: `.env` file has correct values
4. Check database: Ensure data exists (modules, questions, documents)
5. Test OpenAI: Try a simple OpenAI API call directly

**Common Quick Fixes:**
- No feedback? → Check OpenAI API key in `.env`
- Generic feedback? → Enable RAG, add custom instructions
- Slow responses? → Normal (5-10s), consider async processing
- Error 404? → Verify IDs exist in database
