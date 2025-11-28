'use client';

import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ArrowLeft, User, Calendar, Clock, Award, BookOpen, TrendingUp, CheckCircle, XCircle, HelpCircle, List, Download, BarChart3, PieChart, Bot, FileDown, FileText, FileJson, ClipboardList, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, Suspense, useMemo, memo } from "react";
import { apiClient } from "@/lib/auth";

function StudentDetailPageContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const studentId = params.studentId;
  const moduleName = searchParams.get('module');
  
  const [student, setStudent] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [moduleData, setModuleData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [aiFeedbackMap, setAiFeedbackMap] = useState({});
  const [teacherGradesMap, setTeacherGradesMap] = useState({});
  const [answersByAttempt, setAnswersByAttempt] = useState({});
  const [selectedAttempt, setSelectedAttempt] = useState(1);
  const [surveyData, setSurveyData] = useState(null);
  const [surveyResponse, setSurveyResponse] = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);

  const fetchStudentDetails = useCallback(async () => {
    try {
      setLoadingData(true);
      setError('');

      // Get teacher ID
      const teacherId = user?.id || user?.sub;
      if (!teacherId) {
        setError('Unable to identify teacher. Please sign in again.');
        return;
      }

      // Get module by name
      const modulesResponse = await apiClient.get(`/api/modules?teacher_id=${teacherId}`);
      const modules = modulesResponse.data || modulesResponse;
      // eslint-disable-next-line @next/next/no-assign-module-variable
      const module = modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase());

      if (!module) {
        setError(`Module "${moduleName}" not found`);
        return;
      }

      setModuleData(module);

      // Fetch survey data and student's response
      try {
        const surveyConfig = await apiClient.get(`/api/modules/${module.id}/survey`);
        setSurveyData(surveyConfig);

        // Try to get student's survey response
        try {
          const studentSurveyResponse = await apiClient.get(
            `/api/student/modules/${module.id}/survey?student_id=${studentId}`
          );
          if (studentSurveyResponse.my_response) {
            setSurveyResponse(studentSurveyResponse.my_response);
          }
        } catch (surveyErr) {
          console.log('No survey response from student yet');
        }
      } catch (surveyError) {
        console.log('No survey configured for this module');
      }

      // Get questions for this module (all active questions)
      const questionsResponse = await apiClient.get(`/api/student/modules/${module.id}/questions`);
      const questions = questionsResponse.data || questionsResponse;
      console.log(`📚 Total active questions in module: ${questions.length}`);

      // Get all student answers for this module
      const moduleAnswersResponse = await apiClient.get(`/api/student-answers?module_id=${module.id}`);
      const allModuleAnswers = moduleAnswersResponse.data || moduleAnswersResponse || [];

      // Filter answers for this specific student
      const studentModuleAnswers = allModuleAnswers.filter(answer => answer.student_id === studentId);

      // Continue even if student hasn't answered any questions yet
      // We'll show all questions with unanswered status
      console.log(`📝 Student has answered ${studentModuleAnswers.length} out of ${questions.length} questions`);

      // Fetch AI feedback for this student and module
      let feedbackData = [];
      let feedbackByAnswerId = {}; // Declare outside try block so it's accessible later
      let teacherGradesByAnswerId = {};
      try {
        const feedbackResponse = await apiClient.get(`/api/student/modules/${module.id}/feedback?student_id=${studentId}`);
        feedbackData = feedbackResponse.data || feedbackResponse || [];

        // Create a map of feedback by answer_id for quick lookup
        feedbackData.forEach(feedback => {
          feedbackByAnswerId[feedback.answer_id] = feedback;

          // Also extract teacher grades if they exist
          if (feedback.teacher_grade) {
            teacherGradesByAnswerId[feedback.answer_id] = feedback.teacher_grade;
          }
        });
        setAiFeedbackMap(feedbackByAnswerId);
        setTeacherGradesMap(teacherGradesByAnswerId);

        console.log(`Loaded ${feedbackData.length} AI feedback entries for student ${studentId}`);
        console.log(`Loaded ${Object.keys(teacherGradesByAnswerId).length} teacher grades for student ${studentId}`);
      } catch (feedbackError) {
        console.error('Error fetching AI feedback:', feedbackError);
        // Continue without feedback - not critical
      }

      // Group answers by attempt number
      const attemptGroups = {};
      studentModuleAnswers.forEach(answer => {
        const attempt = answer.attempt || 1;
        if (!attemptGroups[attempt]) {
          attemptGroups[attempt] = [];
        }
        attemptGroups[attempt].push(answer);
      });

      // If no answers at all, create a default attempt 1 group
      if (Object.keys(attemptGroups).length === 0) {
        attemptGroups[1] = [];
      }

      setAnswersByAttempt(attemptGroups);

      // Get all unique attempts sorted by descending order (most recent first)
      const attempts = Object.keys(attemptGroups).map(Number).sort((a, b) => b - a);

      // Build student info from answers
      const studentInfo = {
        id: studentId,
        name: studentId, // Display student banner ID as name
        student_id: studentId,
        last_access: studentModuleAnswers.length > 0
          ? studentModuleAnswers.reduce((latest, answer) => {
              return new Date(answer.submitted_at) > new Date(latest) ? answer.submitted_at : latest;
            }, studentModuleAnswers[0].submitted_at)
          : null
      };

      // Calculate performance metrics across ALL attempts
      const totalQuestions = questions.length;

      // Count UNIQUE questions answered (not total answers, to avoid counting multiple attempts)
      const uniqueQuestionIds = new Set(studentModuleAnswers.map(answer => answer.question_id));
      const answeredQuestions = uniqueQuestionIds.size;

      // For each unique question, get the most recent answer to check correctness
      const correctAnswers = Array.from(uniqueQuestionIds).filter(questionId => {
        // Get all answers for this question, sorted by date (most recent first)
        const answersForQuestion = studentModuleAnswers
          .filter(answer => answer.question_id === questionId)
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

        // Check if the most recent answer is correct
        const mostRecentAnswer = answersForQuestion[0];
        const question = questions.find(q => q.id === questionId);
        const questionType = (mostRecentAnswer.question_type || question?.question_type || '').toLowerCase();
        const isMCQ = questionType === 'mcq' || questionType === 'multiple_choice';

        // For MCQ: use binary correct/incorrect
        if (isMCQ) {
          if (typeof mostRecentAnswer.answer === 'object' && typeof mostRecentAnswer.correct_answer === 'object') {
            return JSON.stringify(mostRecentAnswer.answer) === JSON.stringify(mostRecentAnswer.correct_answer);
          }
          return mostRecentAnswer.answer === mostRecentAnswer.correct_answer;
        }

        // For short/essay questions: use AI score with 60% threshold
        const feedback = feedbackByAnswerId[mostRecentAnswer.id];
        if (feedback?.score !== null && feedback?.score !== undefined) {
          const scorePercent = feedback.score > 1 ? feedback.score : feedback.score * 100;
          return scorePercent >= 60; // 60% or higher counts as "correct"
        }

        // Fallback to boolean check if no score available
        if (typeof mostRecentAnswer.answer === 'object' && typeof mostRecentAnswer.correct_answer === 'object') {
          return JSON.stringify(mostRecentAnswer.answer) === JSON.stringify(mostRecentAnswer.correct_answer);
        }
        return mostRecentAnswer.answer === mostRecentAnswer.correct_answer;
      }).length;

      const studentWithPerformance = {
        ...studentInfo,
        total_questions: totalQuestions,
        completed_questions: answeredQuestions,
        avg_score: answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0,
        progress: Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100)), // Cap at 100%
        correct_answers: correctAnswers,
        incorrect_answers: answeredQuestions - correctAnswers,
        total_attempts: attempts.length
      };

      setStudent(studentWithPerformance);

      // Format answers properly - helper function
      const formatAnswer = (answer, options) => {
          if (!answer) return null;

          if (typeof answer === 'object') {
            // Handle object answers like {selected_option: "A"}
            if (answer.selected_option && options) {
              try {
                const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
                const selectedOption = parsedOptions[answer.selected_option];
                return `${answer.selected_option} (${selectedOption})`;
              } catch (e) {
                return JSON.stringify(answer);
              }
            }
            return JSON.stringify(answer);
          }

          // Handle string answers - check if it's a single letter (A, B, C, D)
          if (typeof answer === 'string' && answer.length === 1 && options) {
            try {
              const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
              const optionText = parsedOptions[answer];
              return optionText ? `${answer} (${optionText})` : answer;
            } catch (e) {
              return answer;
            }
          }

          return answer;
        };

      // Simple helper function to extract option ID from answer for comparison
      const extractOptionId = (answer) => {
        if (!answer) return null;

        // New format: {selected_option_id: "A"}
        if (typeof answer === 'object' && answer.selected_option_id) {
          return answer.selected_option_id.toUpperCase();
        }

        // Old format: {selected_option: "A"}
        if (typeof answer === 'object' && answer.selected_option) {
          return answer.selected_option.toUpperCase();
        }

        // Plain string format
        if (typeof answer === 'string') {
          const trimmed = answer.trim();
          // If it's a single letter (A, B, C, D), return uppercase
          if (trimmed.length === 1 && /[A-Za-z]/.test(trimmed)) {
            return trimmed.toUpperCase();
          }
          // For text responses, return as-is
          return trimmed;
        }

        return null;
      };

      // Simple comparison function
      const isAnswerCorrect = (studentAnswer, correctOptionId, correctAnswer) => {
        // For MCQ: compare option IDs
        const studentOptionId = extractOptionId(studentAnswer);
        const correctId = (correctOptionId || correctAnswer || '').trim().toUpperCase();

        return studentOptionId === correctId;
      };

      // Build question data from ALL questions, matching with student answers
      const studentQuestionData = questions.map((question) => {
        // Find all answers for this question from the student (across all attempts)
        const answersByAttemptForQuestion = studentModuleAnswers.filter(
          answer => answer.question_id === question.id
        );

        // Create an entry for each attempt that exists, or one entry if no attempts
        if (answersByAttemptForQuestion.length === 0) {
          // No answer for this question - show as unanswered
          const options = question.options;
          const correctOptionId = question.correct_option_id;
          const correctAnswer = question.correct_answer;

          return {
            question_id: question.id,
            answer_id: null,
            question_text: question.question_text,
            question_type: question.question_type || 'unknown',
            image_url: question.image_url || null,
            correct_answer: formatAnswer(correctOptionId || correctAnswer, options),
            student_answer: null,
            is_correct: null,
            answered_at: null,
            attempt: 1, // Default to attempt 1 for unanswered questions
            options: options,
            raw_correct_answer: correctOptionId || correctAnswer,
            raw_student_answer: null
          };
        }

        // Student has answered this question - create entries for each attempt
        return answersByAttemptForQuestion.map(studentAnswer => {
          const options = studentAnswer.question_options || question.options;
          const correctOptionId = studentAnswer.correct_option_id || question.correct_option_id;
          const correctAnswer = studentAnswer.correct_answer || question.correct_answer;
          const studentAnswerValue = studentAnswer.answer;

          return {
            question_id: studentAnswer.question_id,
            answer_id: studentAnswer.id,
            question_text: studentAnswer.question_text || question.question_text,
            question_type: studentAnswer.question_type || question.question_type || 'unknown',
            image_url: question.image_url || null,
            correct_answer: formatAnswer(correctOptionId || correctAnswer, options),
            student_answer: formatAnswer(studentAnswerValue, options),
            is_correct: isAnswerCorrect(studentAnswerValue, correctOptionId, correctAnswer),
            answered_at: studentAnswer.submitted_at,
            attempt: studentAnswer.attempt || 1,
            options: options,
            raw_correct_answer: correctOptionId || correctAnswer,
            raw_student_answer: studentAnswerValue
          };
        });
      }).flat(); // Flatten the array since some questions may have multiple attempts

      setStudentAnswers(studentQuestionData);

      // Find the attempt with the most recent feedback (highest attempt number with feedback)
      // This ensures students see their feedback after submission, not empty final attempts
      const attemptsWithFeedback = attempts.filter(attemptNum => {
        const answersInAttempt = studentQuestionData.filter(q => q.attempt === attemptNum);
        return answersInAttempt.some(q => q.answer_id && feedbackByAnswerId[q.answer_id]);
      });

      // Default to attempt with feedback, or most recent attempt if none have feedback
      const defaultAttempt = attemptsWithFeedback.length > 0
        ? attemptsWithFeedback[0]  // Already sorted descending, so this is the most recent with feedback
        : (attempts.length > 0 ? attempts[0] : 1); // Fall back to most recent attempt or 1

      setSelectedAttempt(defaultAttempt);
      console.log(`📍 Selected default attempt: ${defaultAttempt} (attempts with feedback: ${attemptsWithFeedback.join(', ') || 'none'})`);

    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, [user, studentId, moduleName]);

  useEffect(() => {
    if (studentId && moduleName && isAuthenticated) {
      fetchStudentDetails();
    }
  }, [studentId, moduleName, isAuthenticated, fetchStudentDetails]);

  // Function to get real AI feedback from database
  const getAIFeedback = (answerId) => {
    if (!answerId || !aiFeedbackMap[answerId]) {
      return null;
    }
    return aiFeedbackMap[answerId];
  };

  // Function to render AI feedback display
  const renderAIFeedback = (answerId, isCorrect) => {
    const feedback = getAIFeedback(answerId);
    const teacherGrade = teacherGradesMap[answerId];

    if (!feedback && !teacherGrade) {
      // No feedback available
      if (isCorrect === null) {
        return <span className="text-slate-600/70 dark:text-slate-400/70 italic">Not answered yet</span>;
      }
      return <span className="text-slate-600/70 dark:text-slate-400/70 italic">No feedback available for this attempt</span>;
    }

    // Display teacher grade and AI feedback
    return (
      <div className="space-y-3">
        {/* Teacher Grade - Priority Display */}
        {teacherGrade && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3 rounded-lg border-2 border-emerald-300 dark:border-emerald-700">
            <div className="flex items-start gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase">Teacher&apos;s Grade</span>
                <div className="mt-1">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {teacherGrade.points_awarded} pts
                  </span>
                  {feedback?.points_possible && (
                    <span className="text-sm text-emerald-700 dark:text-emerald-300 ml-1">
                      / {feedback.points_possible}
                    </span>
                  )}
                </div>
                {teacherGrade.feedback_text && (
                  <div className="mt-2 bg-white dark:bg-gray-900 p-2 rounded">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {teacherGrade.feedback_text}
                    </p>
                  </div>
                )}
                {teacherGrade.graded_at && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Graded on {new Date(teacherGrade.graded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {feedback && (
          <div className={teacherGrade ? "border-t border-slate-200 dark:border-slate-600 pt-3" : ""}>
            {teacherGrade && (
              <div className="flex items-center gap-1 mb-2">
                <Bot className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">AI Feedback</span>
              </div>
            )}

            {feedback.explanation && (
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Explanation:</span>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{feedback.explanation}</p>
              </div>
            )}

            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Strengths:</span>
                <ul className="text-sm text-slate-800 dark:text-slate-200 list-disc list-inside">
                  {feedback.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.weaknesses && feedback.weaknesses.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Weaknesses:</span>
                <ul className="text-sm text-slate-800 dark:text-slate-200 list-disc list-inside">
                  {feedback.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvement_hint && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Suggestion:</span>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{feedback.improvement_hint}</p>
              </div>
            )}

            {feedback.score !== null && feedback.score !== undefined && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">AI Score: </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Function to get formatted AI feedback text for export
  const getAIFeedbackText = (answerId) => {
    const feedback = getAIFeedback(answerId);
    if (!feedback) return 'No AI feedback available';

    let text = '';
    if (feedback.explanation) text += `Explanation: ${feedback.explanation}. `;
    if (feedback.strengths && feedback.strengths.length > 0) {
      text += `Strengths: ${feedback.strengths.join('; ')}. `;
    }
    if (feedback.weaknesses && feedback.weaknesses.length > 0) {
      text += `Weaknesses: ${feedback.weaknesses.join('; ')}. `;
    }
    if (feedback.improvement_hint) text += `Suggestion: ${feedback.improvement_hint}. `;
    if (feedback.score !== null && feedback.score !== undefined) {
      text += `Score: ${Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100)}%`;
    }
    return text || 'No feedback details';
  };

  // Helper function to properly escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Replace line breaks with spaces and escape quotes
    const cleaned = stringValue.replace(/\r?\n/g, ' ').replace(/"/g, '""');
    // Wrap in quotes if contains comma, quote, or starts with special chars
    if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
      return `"${cleaned}"`;
    }
    return cleaned;
  };

  // Function to download student report as CSV
  const downloadStudentReport = () => {
    if (!student || !studentAnswers.length) return;

    // Enhanced headers with separate feedback columns
    const csvHeaders = [
      'Question No.',
      'Attempt',
      'Question',
      'Question Type',
      'Correct Answer',
      'Student Answer',
      'Result',
      'Score',
      'Feedback - Explanation',
      'Feedback - Strengths',
      'Feedback - Weaknesses',
      'Feedback - Suggestion'
    ];

    const csvData = studentAnswers.map((questionData, index) => {
      const feedback = getAIFeedback(questionData.answer_id);
      const questionType = questionData.question_type?.toLowerCase();
      const isMCQ = questionType === 'mcq' || questionType === 'multiple_choice';

      // Determine result display
      let resultDisplay;
      if (questionData.student_answer === null) {
        resultDisplay = 'Pending';
      } else if (isMCQ) {
        resultDisplay = questionData.is_correct ? 'Correct' : 'Wrong';
      } else if (feedback?.score !== null && feedback?.score !== undefined) {
        resultDisplay = `${Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100)}%`;
      } else {
        resultDisplay = questionData.is_correct ? 'Correct' : 'Wrong';
      }

      return [
        index + 1,
        questionData.attempt || 1,
        escapeCSV(questionData.question_text),
        escapeCSV(questionData.question_type || 'Unknown'),
        escapeCSV(questionData.correct_answer || 'Not specified'),
        escapeCSV(questionData.student_answer || 'Not Answered'),
        resultDisplay,
        feedback?.score ? `${Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100)}%` : 'N/A',
        escapeCSV(feedback?.explanation || ''),
        escapeCSV(feedback?.strengths?.join('; ') || ''),
        escapeCSV(feedback?.weaknesses?.join('; ') || ''),
        escapeCSV(feedback?.improvement_hint || '')
      ];
    });

    // Create a well-structured CSV with clear sections
    const csvContent = [
      '=== STUDENT PERFORMANCE REPORT ===',
      '',
      '--- Summary Information ---',
      `Student ID,${student.student_id}`,
      `Module,${escapeCSV(moduleData?.name || moduleName)}`,
      `Overall Progress,${student.progress}%`,
      `Average Score,${student.avg_score}%`,
      `Correct Answers,${student.correct_answers}`,
      `Incorrect Answers,${student.incorrect_answers}`,
      `Questions Completed,${student.completed_questions}`,
      `Total Questions,${student.total_questions}`,
      `Total Attempts,${student.total_attempts || 1}`,
      `Report Generated,${new Date().toLocaleString()}`,
      '',
      '',
      '--- Detailed Question Analysis ---',
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student-${student.student_id}-${moduleData?.name || moduleName}-report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to download student report as JSON
  const downloadStudentReportJSON = () => {
    if (!student || !studentAnswers.length) return;

    const reportData = {
      student: {
        id: student.student_id,
        progress: student.progress,
        averageScore: student.avg_score,
        questionsCompleted: student.completed_questions,
        totalQuestions: student.total_questions,
        totalAttempts: student.total_attempts || 1,
        lastAccess: student.last_access
      },
      module: {
        name: moduleData?.name || moduleName,
        description: moduleData?.description
      },
      questions: studentAnswers.map((questionData, index) => {
        const feedback = getAIFeedback(questionData.answer_id);
        const questionType = questionData.question_type?.toLowerCase();
        const isMCQ = questionType === 'mcq' || questionType === 'multiple_choice';

        // Determine result display
        let resultDisplay;
        if (questionData.student_answer === null) {
          resultDisplay = 'Pending';
        } else if (isMCQ) {
          resultDisplay = questionData.is_correct ? 'Correct' : 'Wrong';
        } else if (feedback?.score !== null && feedback?.score !== undefined) {
          resultDisplay = `${Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100)}%`;
        } else {
          resultDisplay = questionData.is_correct ? 'Correct' : 'Wrong';
        }

        return {
          questionNumber: index + 1,
          questionText: questionData.question_text,
          questionType: questionData.question_type,
          correctAnswer: questionData.correct_answer,
          studentAnswer: questionData.student_answer,
          isCorrect: questionData.is_correct,
          result: resultDisplay,
          attempt: questionData.attempt || 1,
          aiFeedback: feedback ? {
            explanation: feedback.explanation,
            strengths: feedback.strengths,
            weaknesses: feedback.weaknesses,
            improvementHint: feedback.improvement_hint,
            score: feedback.score
          } : null,
          answeredAt: questionData.answered_at
        };
      }),
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student-${student.student_id}-${moduleData?.name || moduleName}-report.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl mb-4">Access Denied</h1>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="text-center">
              <h1 className="text-xl font-semibold mb-2">Error</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchStudentDetails}>Try Again</Button>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading student data...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the information</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                    <span>/</span>
                    <Link 
                      href={`/dashboard/students?module=${moduleName}`} 
                      className="hover:text-foreground"
                    >
                      Students
                    </Link>
                    <span>/</span>
                    <span className="text-foreground">{student?.name || studentId}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="mb-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                  </Button>
                </div>

                {/* Student Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">{student?.name}</h1>
                        <p className="text-muted-foreground">Student ID: {student?.student_id}</p>
                        <p className="text-sm text-muted-foreground">Module: {moduleData?.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Report
                        </Button>
                        
                        {showDownloadMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
                            <div className="py-2">
                              <button
                                onClick={() => {
                                  downloadStudentReport();
                                  setShowDownloadMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-green-600" />
                                Download as CSV
                              </button>
                              <button
                                onClick={() => {
                                  downloadStudentReportJSON();
                                  setShowDownloadMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <FileJson className="w-4 h-4 text-blue-600" />
                                Download as JSON
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Activity Stats */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Student Activity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Test Attempts</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-bold text-purple-600">{Object.keys(answersByAttempt).length}</p>
                                {moduleData?.max_attempts && (
                                  <>
                                    <p className="text-2xl font-semibold text-gray-400">/</p>
                                    <p className="text-3xl font-semibold text-purple-400">{moduleData.max_attempts}</p>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                {moduleData?.max_attempts ? (
                                  Object.keys(answersByAttempt).length >= moduleData.max_attempts
                                    ? 'All attempts used'
                                    : `${moduleData.max_attempts - Object.keys(answersByAttempt).length} attempt${moduleData.max_attempts - Object.keys(answersByAttempt).length !== 1 ? 's' : ''} remaining`
                                ) : (
                                  Object.keys(answersByAttempt).length === 1 ? '1 attempt made' : `${Object.keys(answersByAttempt).length} attempts made`
                                )}
                              </p>
                            </div>
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-orange-200 dark:border-orange-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Last Access</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {student?.last_access ? new Date(student.last_access).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'Never'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                {student?.last_access ? (
                                  <>
                                    at {new Date(student.last_access).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                  </>
                                ) : 'No activity yet'}
                              </p>
                            </div>
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Survey Response Section */}
                {surveyData && surveyData.survey_questions && surveyData.survey_questions.length > 0 && (
                  <div className="mb-8">
                    <Card className="border-2 border-purple-200 dark:border-purple-800">
                      <CardHeader
                        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-purple-200 dark:border-purple-800 cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 transition-colors"
                        onClick={() => setShowSurvey(!showSurvey)}
                      >
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span>Student Feedback Survey</span>
                                {surveyResponse ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <p className="text-sm font-normal text-muted-foreground mt-1">
                                {surveyResponse
                                  ? `Submitted on ${new Date(surveyResponse.submitted_at).toLocaleString()}`
                                  : 'Not submitted yet'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          >
                            {showSurvey ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      {showSurvey && (
                        <CardContent className="pt-6">
                        {surveyResponse ? (
                          <div className="space-y-6">
                            {surveyData.survey_questions.map((question, qIdx) => (
                              <div key={question.id} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Q{qIdx + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-base text-foreground mb-1">
                                      {question.question}
                                      {question.required && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className={`text-xs px-2 py-1 rounded ${
                                        question.type === 'short'
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                      }`}>
                                        {question.type === 'short' ? 'Short Answer' : 'Long Answer'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-11">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                    <div className="flex-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                      {surveyResponse.responses[question.id] ? (
                                        <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                          {surveyResponse.responses[question.id]}
                                        </p>
                                      ) : (
                                        <p className="text-muted-foreground italic">No response provided</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground mb-2">No Survey Response Yet</p>
                            <p className="text-sm text-muted-foreground">
                              This student hasn&apos;t submitted their feedback survey for this module.
                            </p>
                          </div>
                        )}
                        </CardContent>
                      )}
                    </Card>
                  </div>
                )}

                {/* Attempt Selector Tabs */}
                {Object.keys(answersByAttempt).length > 1 && (
                  <div className="mb-6 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      {Object.keys(answersByAttempt).sort((a, b) => Number(a) - Number(b)).map(attempt => (
                        <button
                          key={attempt}
                          onClick={() => setSelectedAttempt(Number(attempt))}
                          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                            selectedAttempt === Number(attempt)
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          Attempt {attempt}
                          <span className="ml-2 text-xs opacity-75">
                            ({answersByAttempt[attempt].length} questions)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Analysis Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <List className="w-6 h-6" />
                      Question Analysis {Object.keys(answersByAttempt).length > 1 && `- Attempt ${selectedAttempt}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {studentAnswers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No questions available for this module</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b-2 border-slate-200 dark:border-slate-600">
                            <tr>
                              <th className="text-left p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  SN
                                </div>
                              </th>
                              <th className="text-left p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  Question
                                </div>
                              </th>
                              <th className="text-left p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  Correct Answer
                                </div>
                              </th>
                              <th className="text-left p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  Student Answer
                                </div>
                              </th>
                              <th className="text-center p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600">
                                <div className="flex items-center justify-center gap-2">
                                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  Result
                                </div>
                              </th>
                              <th className="text-left p-5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  AI Feedback
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentAnswers
                              .filter(questionData => questionData.attempt === selectedAttempt)
                              .map((questionData, index) => (
                              <tr key={`${questionData.question_id}-${questionData.attempt}`} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                <td className="p-5 border-r border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center justify-center">
                                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                                      <span className="text-sm font-bold text-white">{index + 1}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5 max-w-md border-r border-slate-100 dark:border-slate-700">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{questionData.question_text}</p>
                                    {questionData.image_url && (
                                      <div className="mt-2 relative" style={{ maxHeight: '200px', width: '100%' }}>
                                        <Image
                                          src={questionData.image_url}
                                          alt="Question illustration"
                                          width={400}
                                          height={200}
                                          className="rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm object-contain"
                                          style={{ maxHeight: '200px', width: 'auto' }}
                                        />
                                      </div>
                                    )}
                                    {questionData.answered_at && (
                                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>Answered: {new Date(questionData.answered_at).toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-5 border-r border-slate-100 dark:border-slate-700">
                                  <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-700 shadow-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                      {questionData.correct_answer || 'Not specified'}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5 border-r border-slate-100 dark:border-slate-700">
                                  {questionData.student_answer ? (
                                    <div className={`px-4 py-3 rounded-lg text-sm font-semibold border shadow-sm ${
                                      questionData.is_correct
                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          questionData.is_correct ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}></div>
                                        {questionData.student_answer}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                        Not Answered
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="p-5 border-r border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center justify-center">
                                    {questionData.student_answer !== null ? (
                                      (() => {
                                        const feedback = getAIFeedback(questionData.answer_id);
                                        const questionType = questionData.question_type?.toLowerCase();
                                        const isMCQ = questionType === 'mcq' || questionType === 'multiple_choice';

                                        // For MCQ questions, show Correct/Wrong
                                        if (isMCQ) {
                                          return questionData.is_correct ? (
                                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
                                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                              </div>
                                              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                                Correct
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl shadow-sm">
                                              <div className="w-8 h-8 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center">
                                                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                              </div>
                                              <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                                                Wrong
                                              </span>
                                            </div>
                                          );
                                        }

                                        // For short/essay questions, show score percentage
                                        if (feedback?.score !== null && feedback?.score !== undefined) {
                                          const scorePercent = Math.round(feedback.score > 1 ? feedback.score : feedback.score * 100);

                                          // Color coding based on score ranges
                                          let bgColor, borderColor, iconBgColor, textColor, icon;
                                          if (scorePercent >= 80) {
                                            bgColor = 'bg-emerald-50 dark:bg-emerald-900/30';
                                            borderColor = 'border-emerald-200 dark:border-emerald-700';
                                            iconBgColor = 'bg-emerald-100 dark:bg-emerald-800';
                                            textColor = 'text-emerald-800 dark:text-emerald-300';
                                            icon = <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
                                          } else if (scorePercent >= 60) {
                                            bgColor = 'bg-yellow-50 dark:bg-yellow-900/30';
                                            borderColor = 'border-yellow-200 dark:border-yellow-700';
                                            iconBgColor = 'bg-yellow-100 dark:bg-yellow-800';
                                            textColor = 'text-yellow-800 dark:text-yellow-300';
                                            icon = <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
                                          } else if (scorePercent >= 40) {
                                            bgColor = 'bg-orange-50 dark:bg-orange-900/30';
                                            borderColor = 'border-orange-200 dark:border-orange-700';
                                            iconBgColor = 'bg-orange-100 dark:bg-orange-800';
                                            textColor = 'text-orange-800 dark:text-orange-300';
                                            icon = <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
                                          } else {
                                            bgColor = 'bg-rose-50 dark:bg-rose-900/30';
                                            borderColor = 'border-rose-200 dark:border-rose-700';
                                            iconBgColor = 'bg-rose-100 dark:bg-rose-800';
                                            textColor = 'text-rose-800 dark:text-rose-300';
                                            icon = <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
                                          }

                                          return (
                                            <div className={`flex flex-col items-center gap-2 px-4 py-3 ${bgColor} border ${borderColor} rounded-xl shadow-sm`}>
                                              <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
                                                {icon}
                                              </div>
                                              <span className={`text-lg font-bold ${textColor}`}>
                                                {scorePercent}%
                                              </span>
                                            </div>
                                          );
                                        }

                                        // Fallback to Correct/Wrong if no score available
                                        return questionData.is_correct ? (
                                          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                                              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                              Correct
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl shadow-sm">
                                            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center">
                                              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                                              Wrong
                                            </span>
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                          <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                          Pending
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-5 max-w-sm">
                                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                                          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                          AI Analysis
                                        </div>
                                        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                          {renderAIFeedback(questionData.answer_id, questionData.is_correct)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <StudentDetailPageContent />
    </Suspense>
  );
}