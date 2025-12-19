'use client';

import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { apiClient } from "@/lib/auth";
import AssignmentFeaturesSelector from "@/components/AssignmentFeaturesSelector";
import { InlineLoader } from "@/components/LoadingSpinner";
import { CardSkeleton, Skeleton } from "@/components/SkeletonLoader";

function SettingsPageContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const moduleName = searchParams.get('module');
  const [moduleData, setModuleData] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    is_active: true,
    visibility: 'class-only',
    due_date: '',
    consent_required: true,
    assignment_config: {
      features: {
        multiple_attempts: {
          enabled: true,
          max_attempts: 2,
          show_feedback_after_each: true
        },
        chatbot_feedback: {
          enabled: true,
          conversation_mode: "guided",
          ai_model: "gpt-4"
        },
        mastery_learning: {
          enabled: false,
          streak_required: 3,
          queue_randomization: true,
          reset_on_wrong: false
        }
      },
      display_settings: {
        show_progress_bar: true,
        show_streak_counter: true,
        show_attempt_counter: true
      }
    }
  });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && moduleName && user) {
      fetchModuleData();
    } else if (!loading && !moduleName) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, moduleName]);

  useEffect(() => {
    if (formData && originalFormData) {
      setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalFormData));
    }
  }, [formData, originalFormData]);

  const fetchModuleData = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || user?.sub;
      if (!userId) {
        console.error('User ID not available');
        setIsLoading(false);
        return;
      }

      const response = await apiClient.get(`/api/modules?teacher_id=${userId}`);
      const modules = response?.data || response || [];
      const currentModule = modules.find(m => m.name === moduleName);

      if (currentModule) {
        setModuleData(currentModule);
        setModuleId(currentModule.id);

        const newFormData = {
          name: currentModule.name,
          description: currentModule.description || '',
          instructions: currentModule.instructions || '',
          is_active: currentModule.is_active !== undefined ? currentModule.is_active : true,
          visibility: currentModule.visibility || 'class-only',
          due_date: currentModule.due_date ? new Date(currentModule.due_date).toISOString().split('T')[0] : '',
          consent_required: currentModule.consent_required !== undefined ? currentModule.consent_required : true,
          assignment_config: currentModule.assignment_config || formData.assignment_config
        };

        setFormData(newFormData);
        setOriginalFormData(newFormData);
      } else {
        console.error('Module not found');
      }
    } catch (error) {
      console.error('Failed to fetch module:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveModule = async () => {
    if (!moduleId || !moduleData) return;

    try {
      setIsSaving(true);

      // Prepare the payload
      const payload = {
        teacher_id: moduleData.teacher_id,
        name: formData.name,
        description: formData.description,
        instructions: formData.instructions,
        is_active: formData.is_active,
        visibility: formData.visibility,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        consent_required: formData.consent_required,
        assignment_config: formData.assignment_config
      };

      await apiClient.put(`/api/modules/${moduleId}`, payload);

      // Update local data
      setModuleData(prev => ({
        ...prev,
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      }));

      setOriginalFormData(formData);
      setHasChanges(false);

      alert('Module settings updated successfully!');
    } catch (error) {
      console.error('Failed to update module:', error);
      const errorMsg = error?.message || 'Failed to update module settings. Please try again.';
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (originalFormData) {
      setFormData(originalFormData);
      setHasChanges(false);
    }
  };

  if (loading || isLoading) {
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
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-80" />
                      <Skeleton className="h-5 w-96" />
                    </div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="space-y-6">
                    <CardSkeleton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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
      <div className="p-8 text-center">
        <h1 className="text-xl mb-4">No Module Selected</h1>
        <Button asChild>
          <Link href="/mymodules">Go to My Modules</Link>
        </Button>
      </div>
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold">Settings - {moduleName}</h1>
                    <p className="text-muted-foreground">
                      Manage module configuration and assignment features
                    </p>
                  </div>
                  {hasChanges && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleDiscardChanges} disabled={isSaving}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Discard
                      </Button>
                      <Button onClick={handleSaveModule} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>

                {hasChanges && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                      You have unsaved changes
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Combined Module Settings & Assignment Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Module Settings
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure your module details and assignment features
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic Module Information */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="moduleName">Module Name</Label>
                            <Input
                              id="moduleName"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <Label htmlFor="visibility">Visibility</Label>
                            <Select
                              value={formData.visibility}
                              onValueChange={(value) => setFormData({...formData, visibility: value})}
                              disabled={isLoading}
                            >
                              <SelectTrigger id="visibility">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="class-only">Class Only</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="moduleDesc">Description</Label>
                          <Textarea
                            id="moduleDesc"
                            placeholder="Brief description of the module"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            disabled={isLoading}
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="moduleInstructions">Instructions for Students</Label>
                          <Textarea
                            id="moduleInstructions"
                            placeholder="Detailed instructions for students about this module"
                            value={formData.instructions}
                            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                            disabled={isLoading}
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="dueDate">Due Date (Optional)</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-3 border-t">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Module Active</Label>
                            <p className="text-xs text-muted-foreground">
                              Students can access this module
                            </p>
                          </div>
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex items-center justify-between py-3 border-t">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Consent Required</Label>
                            <p className="text-xs text-muted-foreground">
                              Students must complete consent form before accessing
                            </p>
                          </div>
                          <Switch
                            checked={formData.consent_required}
                            onCheckedChange={(checked) => setFormData({...formData, consent_required: checked})}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Assignment Features */}
                      <div className="border-t pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">Assignment Features</h3>
                          <p className="text-sm text-muted-foreground">
                            Configure how students interact with assignments
                          </p>
                        </div>
                        {isLoading ? (
                          <InlineLoader text="Loading module settings..." />
                        ) : (
                          <AssignmentFeaturesSelector
                            value={formData.assignment_config}
                            onChange={(config) => setFormData({...formData, assignment_config: config})}
                          />
                        )}
                      </div>

                      {/* Save Button */}
                      {hasChanges && (
                        <div className="border-t pt-6">
                          <div className="flex gap-2">
                            <Button onClick={handleSaveModule} disabled={isSaving || isLoading} className="flex-1">
                              <Save className="mr-2 w-4 h-4" />
                              {isSaving ? 'Saving Module Settings...' : 'Save All Changes'}
                            </Button>
                            <Button variant="outline" onClick={handleDiscardChanges} disabled={isSaving || isLoading}>
                              <RefreshCw className="mr-2 w-4 h-4" />
                              Discard
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}