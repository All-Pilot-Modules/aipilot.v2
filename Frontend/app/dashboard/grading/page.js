'use client';

import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Users, BookOpen, Award, Clock, CheckCircle,
  XCircle, ChevronLeft, ChevronRight, Save, AlertCircle, User,
  FileText, Bot, History, TrendingUp, BarChart3, Edit2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, Suspense, useMemo, memo } from "react";
import { apiClient } from "@/lib/auth";

// ============================================================================
// UTILITY FUNCTIONS - Separated for testability and reusability
// ============================================================================

/**
 * Safely renders an answer with proper formatting
 * @param {*} answer - The answer to render
 * @param {Object|Array} options - Available options for the question (can be {"A": "Apple"} or [{id: "A", text: "Apple"}])
 * @returns {string|null} Formatted answer string
 */
const formatAnswer = (answer, options = null) => {
  if (!answer) return null;

  // Normalize options to a dictionary format {"A": "Apple", "B": "Ball"}
  let optionsDict = {};

  if (options) {
    if (Array.isArray(options)) {
      // Convert array format to dict: [{id: "A", text: "Apple"}] => {"A": "Apple"}
      options.forEach(opt => {
        if (opt?.id && opt?.text) {
          optionsDict[opt.id] = opt.text;
        }
      });
    } else if (typeof options === 'object') {
      // Already in dict format {"A": "Apple"}
      optionsDict = options;
    }
  }

  // Handle object answers (e.g., {selected_option_id: "A"})
  if (typeof answer === 'object' && !Array.isArray(answer)) {
    // Handle text_response objects (e.g., {text_response: "two"})
    if (answer.text_response !== undefined) {
      return answer.text_response;
    }

    // Handle selected_option_id objects
    if (answer.selected_option_id !== undefined) {
      const optionId = answer.selected_option_id;

      if (optionsDict[optionId]) {
        return `${optionId}: ${optionsDict[optionId]}`;
      }
      return `Option ${optionId}`;
    }

    // Generic object formatting (fallback)
    return Object.entries(answer)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  // Handle arrays
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }

  // Handle string option IDs (e.g., just "A")
  if (typeof answer === 'string' && optionsDict[answer]) {
    return `${answer}: ${optionsDict[answer]}`;
  }

  return String(answer);
};

/**
 * Compares student answer with correct answer
 * @param {*} studentAnswer
 * @param {*} correctAnswer
 * @returns {boolean} Whether the answers match
 */
const compareAnswers = (studentAnswer, correctAnswer) => {
  if (!studentAnswer || !correctAnswer) return false;

  // Handle object comparison
  if (typeof studentAnswer === 'object' && studentAnswer.selected_option_id) {
    return studentAnswer.selected_option_id === correctAnswer ||
           studentAnswer.selected_option_id === correctAnswer?.selected_option_id;
  }

  // Fallback to JSON comparison
  return JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer);
};

/**
 * Validates grade input
 * @param {number} value - The grade value
 * @param {number} maxPoints - Maximum allowed points
 * @returns {boolean} Whether the grade is valid
 */
const isValidGrade = (value, maxPoints) => {
  return !isNaN(value) && value >= 0 && value <= maxPoints;
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

/**
 * Skeleton loader for student list
 */
const StudentListSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-700 py-3 px-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-5 w-8 rounded" />
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="w-4 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for question cards
 */
const QuestionCardSkeleton = () => {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-b border-slate-200 dark:border-slate-700 py-3 px-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 bg-white dark:bg-slate-950">
        {/* Answer boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
        {/* Grading section */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GradingPageContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleName = searchParams.get('module');

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(1);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [moduleData, setModuleData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [aiFeedbackMap, setAiFeedbackMap] = useState({});
  const [teacherGradesMap, setTeacherGradesMap] = useState({});
  const [teacherGradesData, setTeacherGradesData] = useState(null);
  const [answersByAttempt, setAnswersByAttempt] = useState({});
  const [gradeInputs, setGradeInputs] = useState({});
  const [savingGrade, setSavingGrade] = useState(null);
  const [gradingStats, setGradingStats] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoadingData(true);
      setError('');

      const teacherId = user?.id || user?.sub;
      if (!teacherId) {
        setError('Unable to identify teacher. Please sign in again.');
        return;
      }

      // Get module by name
      console.log('🔄 Fetching modules...');
      const modulesResponse = await apiClient.get(`/api/modules?teacher_id=${teacherId}`);
      const modules = modulesResponse.data || modulesResponse;
      const foundModule = modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase());

      if (!foundModule) {
        setError(`Module "${moduleName}" not found`);
        return;
      }

      setModuleData(foundModule);

      // Log module configuration for debugging
      console.log('📋 Module Config:', {
        name: foundModule.name,
        assignment_config: foundModule.assignment_config,
        max_attempts_path: foundModule.assignment_config?.features?.multiple_attempts?.max_attempts,
        full_config: JSON.stringify(foundModule.assignment_config, null, 2)
      });

      // Get all student answers for this module
      console.log('🔄 Fetching student answers...');
      let allModuleAnswers = [];
      try {
        const moduleAnswersResponse = await apiClient.get(`/api/student-answers?module_id=${foundModule.id}`);
        allModuleAnswers = moduleAnswersResponse.data || moduleAnswersResponse || [];
        console.log(`📝 Total student answers in module: ${allModuleAnswers.length}`);
      } catch (err) {
        console.error('❌ Failed to fetch student answers:', err);
        // Continue with empty array if this fails
      }

      // Get questions to know total count
      console.log('🔄 Fetching questions...');
      const questionsResponse = await apiClient.get(`/api/student/modules/${foundModule.id}/questions`);
      const questions = questionsResponse.data || questionsResponse;

      console.log(`❓ Total questions in module: ${questions.length}`);

      // Extract unique students with grade info
      const studentMap = new Map();
      allModuleAnswers.forEach(answer => {
        if (answer.student_id) {
          if (!studentMap.has(answer.student_id)) {
            studentMap.set(answer.student_id, {
              id: answer.student_id,
              name: answer.student_id,
              student_id: answer.student_id,
              last_access: answer.submitted_at,
              attempts: new Set([answer.attempt || 1]),
              answers: [answer]
            });
          } else {
            const existing = studentMap.get(answer.student_id);
            if (answer.submitted_at && new Date(answer.submitted_at) > new Date(existing.last_access)) {
              existing.last_access = answer.submitted_at;
            }
            existing.attempts.add(answer.attempt || 1);
            existing.answers.push(answer);
          }
        }
      });

      // Log student map details
      console.log('👥 Student Map Created:');
      studentMap.forEach((student, id) => {
        console.log(`  - ${id}: ${student.attempts.size} attempts [${Array.from(student.attempts).join(', ')}], ${student.answers.length} answers`);
      });

      // Filter students who have completed all attempts
      const filteredStudents = Array.from(studentMap.values()).filter(student => {
        // Get max attempts from assignment config with multiple fallbacks
        let maxAttempts = 2; // Default fallback

        if (foundModule.assignment_config?.features?.multiple_attempts?.max_attempts) {
          maxAttempts = foundModule.assignment_config.features.multiple_attempts.max_attempts;
        } else if (foundModule.assignment_config?.features?.multiple_attempts?.enabled) {
          // If multiple attempts is enabled but no max specified, use 2
          maxAttempts = 2;
        } else {
          // If multiple attempts not configured, default to 2
          maxAttempts = 2;
        }

        console.log(`🔍 Checking student ${student.student_id}: has ${student.attempts.size} attempts, needs ${maxAttempts} (config: ${foundModule.assignment_config?.features?.multiple_attempts?.max_attempts || 'not set'})`);

        // Student must have completed EXACTLY the max number of attempts (not more, not less)
        const hasCompletedAllAttempts = student.attempts.size === maxAttempts;

        if (!hasCompletedAllAttempts) {
          console.log(`❌ Student ${student.student_id} excluded: ${student.attempts.size} attempts ≠ ${maxAttempts} required`);
          return false;
        }

        const uniqueQuestionsAnswered = new Set(student.answers.map(a => a.question_id)).size;
        const hasAnsweredAllQuestions = uniqueQuestionsAnswered >= questions.length;

        if (!hasAnsweredAllQuestions) {
          console.log(`❌ Student ${student.student_id} excluded: only answered ${uniqueQuestionsAnswered}/${questions.length} questions`);
          return false;
        }

        // Ensure all attempts are complete (each attempt has answers for all questions)
        const attemptsArray = Array.from(student.attempts);
        const allAttemptsComplete = attemptsArray.every(attempt => {
          const answersInAttempt = student.answers.filter(a => (a.attempt || 1) === attempt);
          const questionsInAttempt = new Set(answersInAttempt.map(a => a.question_id)).size;
          return questionsInAttempt >= questions.length;
        });

        if (!allAttemptsComplete) {
          console.log(`❌ Student ${student.student_id} excluded: not all attempts are complete`);
          return false;
        }

        console.log(`✅ Student ${student.student_id} included: completed all ${maxAttempts} attempts`);
        return true;
      });

      console.log(`🎯 Filtered Results: ${filteredStudents.length} students out of ${studentMap.size} passed the filter`);

      // OPTIMIZED: Batch fetch all grades in one request instead of N requests
      const studentIds = filteredStudents.map(s => s.student_id);
      let allGradesMap = new Map();

      if (studentIds.length > 0) {
        try {
          // Fetch all grades for all students in parallel (much faster than sequential)
          const gradeRequests = studentIds.map(studentId =>
            apiClient.get(`/api/student-answers/teacher-grades/module/${foundModule.id}/student/${studentId}`)
              .then(res => ({ studentId, data: res.data || res }))
              .catch(() => ({ studentId, data: { total_grades: 0 } }))
          );

          const allGradesResults = await Promise.all(gradeRequests);
          allGradesResults.forEach(({ studentId, data }) => {
            allGradesMap.set(studentId, data?.total_grades || 0);
          });
        } catch (err) {
          console.error('Error fetching grades:', err);
        }
      }

      // Enrich student data with grades
      const studentList = filteredStudents.map(student => ({
        ...student,
        attempts: student.attempts.size,
        gradedCount: allGradesMap.get(student.student_id) || 0,
        totalQuestions: questions.length
      }));

      setStudents(studentList);

    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, [user, moduleName]);

  const fetchStudentData = useCallback(async (student) => {
    if (!student || !moduleData) return;

    try {
      setLoadingData(true);

      // Get questions
      const questionsResponse = await apiClient.get(`/api/student/modules/${moduleData.id}/questions`);
      const questionsData = questionsResponse.data || questionsResponse;
      setQuestions(questionsData);

      // Get all student answers
      const moduleAnswersResponse = await apiClient.get(`/api/student-answers?module_id=${moduleData.id}`);
      const allModuleAnswers = moduleAnswersResponse.data || moduleAnswersResponse || [];
      const studentModuleAnswers = allModuleAnswers.filter(answer => answer.student_id === student.student_id);

      // Get AI feedback
      let feedbackByAnswerId = {};
      try {
        const feedbackResponse = await apiClient.get(`/api/student/modules/${moduleData.id}/feedback?student_id=${student.student_id}`);
        const feedbackData = feedbackResponse.data || feedbackResponse || [];

        feedbackData.forEach(feedback => {
          feedbackByAnswerId[feedback.answer_id] = feedback;
        });
        setAiFeedbackMap(feedbackByAnswerId);
      } catch (err) {
        console.log('No AI feedback available');
      }

      // Get teacher grades for this student
      let teacherGradesByAnswerId = {};
      let teacherGradesResponse = null;
      try {
        const gradesResponse = await apiClient.get(`/api/student-answers/teacher-grades/module/${moduleData.id}/student/${student.student_id}`);
        teacherGradesResponse = gradesResponse.data || gradesResponse;

        if (teacherGradesResponse?.grades) {
          teacherGradesResponse.grades.forEach(grade => {
            teacherGradesByAnswerId[grade.answer_id] = grade;
          });
        }
        setTeacherGradesMap(teacherGradesByAnswerId);
        setTeacherGradesData(teacherGradesResponse);

        // Calculate grading statistics
        if (teacherGradesResponse?.grades && questionsData.length > 0) {
          const totalQuestions = questionsData.length;
          const gradedQuestions = teacherGradesResponse.grades.length;
          const totalPointsPossible = questionsData.reduce((sum, q) => sum + (q.points || 0), 0);
          const totalPointsAwarded = teacherGradesResponse.grades.reduce((sum, g) => sum + (g.points_awarded || 0), 0);
          const averageScore = totalPointsPossible > 0 ? (totalPointsAwarded / totalPointsPossible) * 100 : 0;
          const aiOverrides = teacherGradesResponse.grades.filter(g => g.overridden_ai).length;

          setGradingStats({
            totalQuestions,
            gradedQuestions,
            ungradedQuestions: totalQuestions - gradedQuestions,
            totalPointsPossible,
            totalPointsAwarded,
            averageScore,
            aiOverrides,
            completionPercentage: totalQuestions > 0 ? (gradedQuestions / totalQuestions) * 100 : 0
          });
        }
      } catch (err) {
        console.log('No teacher grades available');
        setTeacherGradesData(null);
        setGradingStats(null);
      }

      // Group answers by attempt
      const attemptGroups = {};
      studentModuleAnswers.forEach(answer => {
        const attempt = answer.attempt || 1;
        if (!attemptGroups[attempt]) {
          attemptGroups[attempt] = [];
        }
        attemptGroups[attempt].push(answer);
      });

      setAnswersByAttempt(attemptGroups);

      // Always use the most recent attempt (no selector needed)
      const attempts = Object.keys(attemptGroups).map(Number).sort((a, b) => b - a);
      const latestAttempt = attempts.length > 0 ? attempts[0] : 1;
      setSelectedAttempt(latestAttempt);

      // Build student answers
      const answersData = questionsData.map(question => {
        const answerForQuestion = studentModuleAnswers.find(
          answer => answer.question_id === question.id && (answer.attempt || 1) === selectedAttempt
        );

        if (!answerForQuestion) {
          return {
            question_id: question.id,
            answer_id: null,
            question_text: question.question_text || question.text,
            question_type: question.question_type || question.type,
            image_url: question.image_url,
            student_answer: null,
            correct_answer: question.correct_answer || question.correct_option_id,
            points_possible: question.points || 0,
            options: question.options || null
          };
        }

        return {
          question_id: answerForQuestion.question_id,
          answer_id: answerForQuestion.id,
          question_text: answerForQuestion.question_text || question.question_text || question.text,
          question_type: answerForQuestion.question_type || question.question_type || question.type,
          image_url: question.image_url,
          student_answer: answerForQuestion.answer,
          correct_answer: answerForQuestion.correct_answer || question.correct_answer || question.correct_option_id,
          answered_at: answerForQuestion.submitted_at,
          points_possible: question.points || 0,
          options: question.options || null
        };
      });

      setStudentAnswers(answersData);

    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load student data');
    } finally {
      setLoadingData(false);
    }
  }, [moduleData, selectedAttempt]);

  useEffect(() => {
    if (moduleName && isAuthenticated && user) {
      fetchStudents();
    }
  }, [moduleName, isAuthenticated, user, fetchStudents]);

  useEffect(() => {
    if (selectedStudent && moduleData) {
      fetchStudentData(selectedStudent);
    }
  }, [selectedStudent, moduleData, selectedAttempt, fetchStudentData]);

  const handleSaveGrade = async (answerId, questionId) => {
    const gradeData = gradeInputs[answerId];

    // Validation
    if (!gradeData?.points) {
      setError('Please enter points awarded');
      return;
    }

    const teacherId = user?.id || user?.sub;
    if (!teacherId) {
      setError('Authentication error. Please sign in again.');
      return;
    }

    // Find the question to get max points
    const question = studentAnswers.find(a => a.answer_id === answerId);
    const maxPoints = question?.points_possible || 0;

    if (!isValidGrade(parseFloat(gradeData.points), maxPoints)) {
      setError(`Invalid grade. Must be between 0 and ${maxPoints}`);
      return;
    }

    setSavingGrade(answerId);
    setError('');

    try {
      const params = new URLSearchParams({
        answer_id: answerId,
        points_awarded: parseFloat(gradeData.points),
        teacher_id: teacherId
      });

      if (gradeData.feedback?.trim()) {
        params.append('feedback_text', gradeData.feedback.trim());
      }

      await apiClient.post(`/api/student-answers/teacher-grade?${params.toString()}`);

      // OPTIMISTIC UPDATE: Update state directly instead of refetching everything
      const now = new Date().toISOString();
      const pointsAwarded = parseFloat(gradeData.points);

      // Get old grade if it exists
      const oldGrade = teacherGradesMap[answerId];
      const oldPoints = oldGrade?.points_awarded || 0;

      // Create new grade object
      const newGrade = {
        answer_id: answerId,
        points_awarded: pointsAwarded,
        feedback_text: gradeData.feedback?.trim() || oldGrade?.feedback_text || null,
        graded_at: now,
        teacher_id: teacherId,
        ai_suggested_score: oldGrade?.ai_suggested_score || null,
        overridden_ai: oldGrade?.ai_suggested_score !== null
      };

      // Update teacherGradesMap
      setTeacherGradesMap(prev => ({
        ...prev,
        [answerId]: newGrade
      }));

      // Update teacherGradesData
      if (teacherGradesData) {
        const updatedGrades = oldGrade
          ? teacherGradesData.grades.map(g => g.answer_id === answerId ? newGrade : g)
          : [...(teacherGradesData.grades || []), newGrade];

        const totalGrades = updatedGrades.length;
        const totalPointsAwarded = updatedGrades.reduce((sum, g) => sum + (g.points_awarded || 0), 0);

        setTeacherGradesData({
          ...teacherGradesData,
          grades: updatedGrades,
          total_grades: totalGrades,
          total_points: totalPointsAwarded
        });

        // Update grading stats
        if (questions.length > 0) {
          const totalPointsPossible = questions.reduce((sum, q) => sum + (q.points || 0), 0);
          const averageScore = totalPointsPossible > 0 ? (totalPointsAwarded / totalPointsPossible) * 100 : 0;
          const aiOverrides = updatedGrades.filter(g => g.overridden_ai).length;

          setGradingStats({
            totalQuestions: questions.length,
            gradedQuestions: totalGrades,
            ungradedQuestions: questions.length - totalGrades,
            totalPointsPossible,
            totalPointsAwarded,
            averageScore,
            aiOverrides,
            completionPercentage: questions.length > 0 ? (totalGrades / questions.length) * 100 : 0
          });
        }
      } else {
        // First grade for this student
        setTeacherGradesData({
          grades: [newGrade],
          total_grades: 1,
          total_points: pointsAwarded
        });

        if (questions.length > 0) {
          const totalPointsPossible = questions.reduce((sum, q) => sum + (q.points || 0), 0);
          const averageScore = totalPointsPossible > 0 ? (pointsAwarded / totalPointsPossible) * 100 : 0;

          setGradingStats({
            totalQuestions: questions.length,
            gradedQuestions: 1,
            ungradedQuestions: questions.length - 1,
            totalPointsPossible,
            totalPointsAwarded: pointsAwarded,
            averageScore,
            aiOverrides: 0,
            completionPercentage: (1 / questions.length) * 100
          });
        }
      }

      // Clear input
      setGradeInputs(prev => {
        const { [answerId]: _, ...rest } = prev;
        return rest;
      });

    } catch (error) {
      console.error('Error saving grade:', error);
      setError(error.response?.data?.detail || 'Failed to save grade. Please try again.');
    } finally {
      setSavingGrade(null);
    }
  };

  const handleGradeInputChange = (answerId, field, value) => {
    setGradeInputs(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value
      }
    }));
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

  if (!moduleName) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <GraduationCap className="w-16 h-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Select a Module</h1>
            <p className="text-muted-foreground">Choose a module from the sidebar to start grading</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error && !loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Error Loading Data</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (loadingData && !selectedStudent) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  {/* Header Skeleton */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-slate-900/40 dark:to-slate-800/20 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                  {/* Student List Skeleton */}
                  <StudentListSkeleton />
                </div>
              </div>
            </div>
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
        <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-blue-50/10 to-purple-50/10 dark:from-slate-950 dark:via-blue-950/5 dark:to-purple-950/5 min-h-screen">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Premium Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 blur-3xl"></div>
                    <div className="relative flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-white/80 via-blue-50/50 to-purple-50/50 dark:from-slate-900/80 dark:via-blue-950/30 dark:to-purple-950/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl blur-xl opacity-50"></div>
                        <div className="relative p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl">
                          <Edit2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-0.5 sm:mb-1 truncate">
                          Grading Center
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 sm:gap-2 truncate">
                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">{moduleName}</span>
                        </p>
                      </div>
                      {students.length > 0 && !selectedStudent && (
                        <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-blue-100/80 to-purple-100/80 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Students</div>
                            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                              {students.length}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show student list if no student selected */}
                {!selectedStudent ? (
                  <div className="relative">
                    <div className="bg-white dark:bg-slate-950 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                      <div className="border-b-2 border-slate-200 dark:border-slate-700 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-purple-950/20">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex-shrink-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent truncate">
                              Select a Student
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">Click on any student to begin grading</p>
                          </div>
                          <div className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 shadow-md flex-shrink-0">
                            <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Students</div>
                            <div className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent text-center">
                              {students.length}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {students.length === 0 ? (
                          <div className="p-16 text-center">
                            <div className="mb-6 p-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 w-24 h-24 flex items-center justify-center mx-auto shadow-lg">
                              <Users className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Students Ready</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                              Students who have completed all attempts will appear here for grading.
                            </p>
                          </div>
                        ) : (
                          students.map((student, index) => (
                            <button
                              key={student.student_id}
                              onClick={() => setSelectedStudent(student)}
                            className="w-full px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-purple-50/30 hover:to-pink-50/20 dark:hover:from-blue-950/30 dark:hover:via-purple-950/20 dark:hover:to-pink-950/10 transition-all duration-200 text-left flex items-center gap-4 group relative"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>

                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm group-hover:shadow-md group-hover:from-blue-100 group-hover:to-purple-100 dark:group-hover:from-blue-950/50 dark:group-hover:to-purple-950/50 transition-all">
                              <User className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {student.student_id}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <div className="flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  <span>{student.attempts} {student.attempts === 1 ? 'attempt' : 'attempts'}</span>
                                </div>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{student.last_access ? new Date(student.last_access).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No activity'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold shadow-md border-2 transition-all ${
                                student.gradedCount === student.totalQuestions
                                  ? 'bg-gradient-to-br from-emerald-100 to-emerald-200/80 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                  : student.gradedCount > 0
                                  ? 'bg-gradient-to-br from-amber-100 to-amber-200/80 dark:from-amber-900/40 dark:to-amber-800/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                                  : 'bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600'
                              }`}>
                                {student.gradedCount === student.totalQuestions ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                                <span>{student.gradedCount}/{student.totalQuestions}</span>
                              </div>

                              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Student Header with Back Button */}
                    <div className="mb-4 sm:mb-6">
                      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-slate-200/80 dark:border-slate-700/80 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>
                        <div className="relative bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm p-3 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStudent(null)}
                                className="border-2 border-slate-300 dark:border-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all h-8 sm:h-10 px-3 sm:px-4 font-medium shadow-md text-xs sm:text-sm flex-shrink-0"
                              >
                                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Back to Students</span>
                                <span className="sm:hidden">Back</span>
                              </Button>

                              <div className="h-8 sm:h-10 w-px bg-slate-300 dark:bg-slate-600 flex-shrink-0"></div>

                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">
                                    {selectedStudent.student_id}
                                  </h2>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{selectedStudent.last_access ? new Date(selectedStudent.last_access).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No activity'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {gradingStats && (
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-100/80 to-emerald-200/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border border-emerald-300 dark:border-emerald-800 shadow-md">
                                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                  <div>
                                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Progress</div>
                                    <div className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                                      {gradingStats.gradedQuestions}/{gradingStats.totalQuestions} graded
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show latest attempt badge (no selector) */}
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-blue-100/80 to-purple-100/50 dark:from-blue-950/50 dark:to-purple-900/30 border border-blue-300 dark:border-blue-800 shadow-md">
                                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-blue-900 dark:text-blue-100">Latest Attempt:</span>
                                <span className="text-sm font-black bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                  #{selectedAttempt}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Questions */}
                    {loadingData ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <QuestionCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                    <div className="space-y-5">
                      {studentAnswers.map((answerData, index) => {
                        const aiFeedback = aiFeedbackMap[answerData.answer_id];
                        const teacherGrade = teacherGradesMap[answerData.answer_id];
                        const gradeInput = gradeInputs[answerData.answer_id] || {};
                        const isCorrect = compareAnswers(answerData.student_answer, answerData.correct_answer);

                        return (
                          <Card key={answerData.question_id} className="border-2 border-slate-200/80 dark:border-slate-700/80 shadow-xl hover:shadow-2xl transition-all duration-200 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-900/60 dark:via-blue-950/20 dark:to-purple-950/20 border-b-2 border-slate-200 dark:border-slate-700 py-4 px-6">
                              <CardTitle className="text-base flex items-center gap-3">
                                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-black shadow-lg flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span className="flex-1 font-bold text-slate-900 dark:text-slate-100 leading-tight">{answerData.question_text}</span>
                                <div className="flex items-center gap-2">
                                  {teacherGrade ? (
                                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm font-black border border-emerald-300 dark:border-emerald-700 shadow-md flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      {teacherGrade.points_awarded}/{answerData.points_possible}
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 text-amber-700 dark:text-amber-400 text-sm font-black border border-amber-300 dark:border-amber-700 shadow-md">
                                      {answerData.points_possible} {answerData.points_possible === 1 ? 'pt' : 'pts'}
                                    </span>
                                  )}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5 bg-white dark:bg-slate-950">
                              {/* Question Image */}
                              {answerData.image_url && (
                                <div className="mb-4">
                                  <Image
                                    src={answerData.image_url}
                                    alt="Question"
                                    width={400}
                                    height={200}
                                    className="rounded-lg border"
                                  />
                                </div>
                              )}

                              {/* Answer Comparison */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Student Answer */}
                                <div className="group">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Student Answer</span>
                                      {answerData.student_answer && answerData.correct_answer && (
                                        isCorrect ? (
                                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Correct</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700">
                                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />
                                            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Incorrect</span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                    {answerData.answered_at && (
                                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(answerData.answered_at).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20 shadow-lg p-4 transition-all group-hover:shadow-xl">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-2xl"></div>
                                    <div className="relative text-base text-slate-800 dark:text-slate-100 break-words font-medium leading-relaxed">
                                      {formatAnswer(answerData.student_answer, answerData.options) || (
                                        <span className="text-slate-400 dark:text-slate-500 italic font-normal">Not answered</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Correct Answer */}
                                <div className="group">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Correct Answer</span>
                                  </div>
                                  <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 shadow-lg p-4 transition-all group-hover:shadow-xl">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-2xl"></div>
                                    <div className="relative text-base text-slate-800 dark:text-slate-100 break-words font-medium leading-relaxed">
                                      {formatAnswer(answerData.correct_answer, answerData.options) || (
                                        <span className="text-slate-400 dark:text-slate-500 italic font-normal">N/A</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* AI Feedback */}
                              {aiFeedback && aiFeedback.explanation && (
                                <div className="relative overflow-hidden rounded-xl border-2 border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50/80 to-purple-50/40 dark:from-violet-950/30 dark:to-purple-950/10 shadow-lg p-4">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-2xl"></div>
                                  <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
                                        <Bot className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-sm font-bold text-violet-700 dark:text-violet-400">AI Analysis</span>
                                      {aiFeedback.score !== null && (
                                        <span className="ml-auto px-3 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/40 border border-violet-300 dark:border-violet-700 text-sm font-black text-violet-900 dark:text-violet-200 shadow-md">
                                          {Math.round(aiFeedback.score > 1 ? aiFeedback.score : aiFeedback.score * 100)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{aiFeedback.explanation}</p>
                                  </div>
                                </div>
                              )}

                              {/* Teacher Grading */}
                              {teacherGrade ? (
                                <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 shadow-lg p-5">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-2xl"></div>
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                                          <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Graded by Teacher</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black bg-gradient-to-r from-emerald-700 to-emerald-900 dark:from-emerald-400 dark:to-emerald-100 bg-clip-text text-transparent">
                                          {teacherGrade.points_awarded}/{answerData.points_possible}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-sm font-black text-emerald-900 dark:text-emerald-200 shadow-md">
                                          {((teacherGrade.points_awarded / answerData.points_possible) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>

                                    {teacherGrade.feedback_text && (
                                      <div className="mb-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                          {teacherGrade.feedback_text}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs pt-3 border-t border-emerald-200 dark:border-emerald-800/50 mb-4">
                                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="font-medium">
                                          {new Date(teacherGrade.graded_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {teacherGrade.ai_suggested_score !== null && teacherGrade.overridden_ai && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700">
                                          <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                          <span className="font-bold text-violet-700 dark:text-violet-400">AI: {teacherGrade.ai_suggested_score.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Edit Grade Section */}
                                    <div className="space-y-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Edit2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Update Grade</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">New Points</Label>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              min="0"
                                              max={answerData.points_possible}
                                              step={answerData.points_possible === 1 ? "1" : "0.5"}
                                              placeholder={teacherGrade.points_awarded}
                                              value={gradeInput.points ?? ''}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                const max = answerData.points_possible;
                                                if (value <= max || e.target.value === '') {
                                                  handleGradeInputChange(answerData.answer_id, 'points', e.target.value);
                                                }
                                              }}
                                              className="h-9 text-sm font-bold border-2 border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-500 rounded-lg"
                                            />
                                            <span className="text-sm font-black text-emerald-900 dark:text-emerald-300">/ {answerData.points_possible}</span>
                                          </div>
                                        </div>

                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">New Feedback</Label>
                                          <Input
                                            type="text"
                                            placeholder={teacherGrade.feedback_text || "Update feedback..."}
                                            value={gradeInput.feedback ?? ''}
                                            onChange={(e) => handleGradeInputChange(answerData.answer_id, 'feedback', e.target.value)}
                                            className="h-9 text-xs border-2 border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-500 rounded-lg"
                                          />
                                        </div>
                                      </div>

                                      <Button
                                        onClick={() => handleSaveGrade(answerData.answer_id, answerData.question_id)}
                                        disabled={savingGrade === answerData.answer_id || !gradeInput.points}
                                        size="sm"
                                        className="w-full h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                      >
                                        {savingGrade === answerData.answer_id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Updating...
                                          </>
                                        ) : (
                                          <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Grade
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : answerData.answer_id ? (
                                <div className="relative overflow-hidden rounded-xl border-2 border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10 shadow-lg p-5">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-2xl"></div>
                                  <div className="relative space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg">
                                        <Edit2 className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Enter Grade</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-bold text-amber-900 dark:text-amber-300">Points Awarded</Label>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={answerData.points_possible}
                                            step={answerData.points_possible === 1 ? "1" : "0.5"}
                                            placeholder="0.0"
                                            value={gradeInput.points || ''}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value);
                                              const max = answerData.points_possible;
                                              if (value <= max || e.target.value === '') {
                                                handleGradeInputChange(answerData.answer_id, 'points', e.target.value);
                                              }
                                            }}
                                            className="h-11 text-base font-bold border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 rounded-lg shadow-sm"
                                          />
                                          <span className="text-lg font-black text-amber-900 dark:text-amber-300">/ {answerData.points_possible}</span>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-sm font-bold text-amber-900 dark:text-amber-300">Feedback (Optional)</Label>
                                        <Input
                                          type="text"
                                          placeholder="Add a note for the student..."
                                          value={gradeInput.feedback || ''}
                                          onChange={(e) => handleGradeInputChange(answerData.answer_id, 'feedback', e.target.value)}
                                          className="h-11 text-sm border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 rounded-lg shadow-sm"
                                        />
                                      </div>
                                    </div>

                                    <Button
                                      onClick={() => handleSaveGrade(answerData.answer_id, answerData.question_id)}
                                      disabled={savingGrade === answerData.answer_id || !gradeInput.points}
                                      size="lg"
                                      className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {savingGrade === answerData.answer_id ? (
                                        <>
                                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                          Saving Grade...
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-5 h-5 mr-2" />
                                          Save Grade
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-slate-900/20 dark:to-slate-800/10 p-6 text-center">
                                  <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No Answer Submitted</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Student did not answer this question</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function GradingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading grading interface...</p>
        </div>
      </div>
    }>
      <GradingPageContent />
    </Suspense>
  );
}
