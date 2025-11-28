'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Users,
  Lock,
  ArrowRight,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { apiClient } from "@/lib/auth";
import ModuleConsentModal from "@/components/ModuleConsentModal";

export default function ModuleAccessPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.teacherId;
  const moduleName = params?.moduleName;
  
  const [accessCode, setAccessCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleInfo, setModuleInfo] = useState(null);

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [enrolledModule, setEnrolledModule] = useState(null);

  // No initial module loading needed - we'll get module info after access code verification

  const handleConsentSubmitted = (consentStatus) => {
    // Mark consent as submitted in both localStorage and sessionStorage
    if (enrolledModule) {
      // Store in localStorage (persists across sessions)
      const consentKey = `consent_${enrolledModule.id}_${studentId.trim()}`;
      localStorage.setItem(consentKey, 'true');
      console.log('✅ Consent saved to localStorage');

      // Also update sessionStorage
      const accessData = JSON.parse(sessionStorage.getItem('student_module_access') || '{}');
      accessData.consentSubmitted = true;
      accessData.consentStatus = consentStatus;
      sessionStorage.setItem('student_module_access', JSON.stringify(accessData));

      // Redirect to module
      router.push(`/student/module/${enrolledModule.id}`);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!accessCode.trim() || !studentId.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Use existing backend endpoint to join module with access code and student_id
      const response = await apiClient.post(`/api/student/join-module?access_code=${encodeURIComponent(accessCode.trim().toUpperCase())}&student_id=${encodeURIComponent(studentId.trim())}`);

      // Handle response - it might be response.data or just response
      const moduleData = response.data || response;

      if (!moduleData || !moduleData.id) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Store module access in sessionStorage with student info
      try {
        sessionStorage.setItem('student_module_access', JSON.stringify({
          moduleId: moduleData.id,
          moduleName: moduleData.name,
          teacherId: moduleData.teacher_id,
          studentId: studentId.trim(),
          accessCode: accessCode.trim().toUpperCase(),
          accessTime: new Date().toISOString(),
          permissions: ['view_questions', 'submit_answers']
        }));
      } catch (storageError) {
        console.error('Failed to save session data:', storageError);
        setError("Failed to save session. Please enable cookies and try again.");
        return;
      }

      // Update module info for display
      setModuleInfo(moduleData);

      // Check if module requires consent
      if (moduleData.consent_required !== false) {
        // Show consent modal
        setEnrolledModule(moduleData);
        setShowConsentModal(true);
      } else {
        // No consent required, redirect immediately
        router.push(`/student/module/${moduleData.id}`);
      }
    } catch (error) {
      console.error('Access code verification failed:', error);

      // Provide user-friendly error messages
      if (error.response?.status === 404) {
        setError("Invalid access code. Please check with your instructor and try again.");
      } else if (error.response?.status === 400) {
        setError("This module is not currently active. Please contact your instructor.");
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again in a few moments.");
      } else if (error.message === 'Network Error' || !error.response) {
        setError("Network connection error. Please check your internet connection and try again.");
      } else {
        setError(error.response?.data?.detail || "Failed to join module. Please try again or contact your instructor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {moduleInfo?.name || moduleName?.charAt(0).toUpperCase() + moduleName?.slice(1)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {moduleInfo?.description || "Enter your access code to join this module"}
            </p>
            {moduleInfo?.teacher_name && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Instructor: {moduleInfo.teacher_name}
              </p>
            )}
          </div>

          {/* Access Form */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Student Access Required
              </CardTitle>
              <CardDescription>
                Enter your student ID and the access code provided by your instructor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="Enter 6-character code (e.g., ABC123)"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="mt-1 text-center text-lg font-mono tracking-wider"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  disabled={loading || !accessCode.trim() || !studentId.trim()}
                >
                  {loading ? (
                    "Verifying..."
                  ) : (
                    <>
                      Join Module
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Module Info */}
          {moduleInfo && (
            <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Module Information
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {moduleInfo.description}
                    </p>
                    {moduleInfo.due_date && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Due: {new Date(moduleInfo.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Student Access
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      View assignments, download materials, submit answers, and track your progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Secure Access
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Each access code is unique to this module and provides secure entry to course content
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Do not have a student ID or access code? Contact your instructor for access to this module.
            </p>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      {showConsentModal && enrolledModule && (
        <ModuleConsentModal
          isOpen={showConsentModal}
          moduleId={enrolledModule.id}
          moduleName={enrolledModule.name}
          consentFormText={enrolledModule.consent_form_text}
          studentId={studentId.trim()}
          onConsentSubmitted={handleConsentSubmitted}
        />
      )}
    </div>
  );
}