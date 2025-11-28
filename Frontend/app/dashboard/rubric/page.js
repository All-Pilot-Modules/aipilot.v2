'use client';

import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/auth";
import SimpleRubricEditor from "@/components/rubric/SimpleRubricEditor";
import { Spinner } from "@/components/ui/spinner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CardSkeleton, Skeleton } from "@/components/SkeletonLoader";

function RubricSettingsContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const moduleName = searchParams.get('module'); // Use 'module' param like other pages

  const [moduleId, setModuleId] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [originalRubric, setOriginalRubric] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingRubric, setLoadingRubric] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Fetch module by name to get moduleId
  useEffect(() => {
    if (moduleName && user) {
      fetchModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName, user]);

  useEffect(() => {
    if (moduleId) {
      fetchRubric();
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      const response = await apiClient.get(`/api/modules?teacher_id=${user.id}`);
      const modules = response?.data || response || [];
      const foundModule = modules.find(m => m.name === moduleName);
      if (foundModule) {
        setModuleId(foundModule.id);
      }
    } catch (error) {
      console.error('Failed to fetch module:', error);
    }
  };

  useEffect(() => {
    if (rubric && originalRubric) {
      setHasChanges(JSON.stringify(rubric) !== JSON.stringify(originalRubric));
    }
  }, [rubric, originalRubric]);

  const fetchRubric = async () => {
    try {
      setLoadingRubric(true);
      const data = await apiClient.get(`/api/modules/${moduleId}/rubric`);
      setRubric(data.rubric);
      setOriginalRubric(data.rubric);
    } catch (error) {
      console.error('Failed to fetch rubric:', error);
    } finally {
      setLoadingRubric(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await apiClient.get('/api/rubric-templates');
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSave = async () => {
    if (!moduleId || !rubric) return;

    setIsSaving(true);
    try {
      // Save all rubric settings including grading criteria, scoring, and question types
      const rubricToSave = {
        enabled: true, // Always enabled
        feedback_style: rubric.feedback_style,
        custom_instructions: rubric.custom_instructions,
        rag_settings: rubric.rag_settings,
        grading_criteria: rubric.grading_criteria,
        question_type_settings: rubric.question_type_settings,
        grading_thresholds: rubric.grading_thresholds,
      };

      await apiClient.put(`/api/modules/${moduleId}/rubric`, rubricToSave);
      setOriginalRubric(rubric);
      setHasChanges(false);
      alert('Rubric settings saved successfully!');
    } catch (error) {
      console.error('Failed to save rubric:', error);
      const errorMsg = error?.message || 'Failed to save rubric settings. Please try again.';
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = async (templateName) => {
    if (!moduleId) return;

    setIsApplyingTemplate(true);
    try {
      const response = await apiClient.post(
        `/api/modules/${moduleId}/rubric/apply-template?template_name=${templateName}&preserve_custom_instructions=true`
      );
      setRubric(response.rubric);
      setOriginalRubric(response.rubric);
      alert(`Template "${templateName}" applied successfully!`);
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const updateRubric = (newRubric) => {
    setRubric(newRubric);
  };

  if (loading || loadingRubric) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-900">
            <div className="p-8 max-w-[1600px] mx-auto">
              {/* Header Skeleton */}
              <div className="mb-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-20 h-20 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-80" />
                        <Skeleton className="h-6 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-full max-w-3xl" />
                  </div>
                  <Skeleton className="h-12 w-40" />
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-8 text-center">
            <h1 className="text-xl mb-4">Access Denied</h1>
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!moduleId) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-8 text-center">
            <h1 className="text-xl mb-4">No Module Selected</h1>
            <Button asChild>
              <Link href="/mymodules">Go to My Modules</Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-900">
          <div className="p-8 max-w-[1600px] mx-auto">
            {/* Premium Header */}
            <div className="mb-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-25"></div>
                      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                        <Save className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                        AI Grading Rubric
                      </h1>
                      {moduleName && (
                        <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md">
                          📚 Module: {moduleName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-base max-w-3xl leading-relaxed">
                    Configure AI feedback criteria and grading standards to provide personalized,
                    consistent feedback to your students based on your course materials.
                  </p>
                </div>

                <div className="flex gap-3 items-start lg:items-center">
                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRubric(originalRubric);
                        setHasChanges(false);
                      }}
                      className="shadow-md hover:shadow-lg transition-all border-2 border-slate-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Discard Changes
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    size="lg"
                    className="shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 px-8 font-semibold"
                  >
                    {isSaving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {hasChanges && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <div className="relative overflow-hidden p-5 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-2xl shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 animate-pulse"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <RefreshCw className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-amber-900 dark:text-amber-100">
                          You have unsaved changes
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                          Don&apos;t forget to save your settings before leaving this page
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simplified Editor */}
            <SimpleRubricEditor
              value={rubric}
              onChange={updateRubric}
              templates={templates}
              onApplyTemplate={handleApplyTemplate}
              isApplyingTemplate={isApplyingTemplate}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RubricSettings() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <RubricSettingsContent />
    </Suspense>
  );
}
