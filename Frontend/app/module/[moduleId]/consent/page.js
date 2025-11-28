'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/auth';
import ConsentFormEditor from '@/components/ConsentFormEditor';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CardSkeleton, Skeleton } from '@/components/SkeletonLoader';

export default function ModuleConsentPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params?.moduleId;

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/modules/${moduleId}`);
      setModule(data);

      // Add module name to URL for sidebar navigation
      if (data?.name) {
        const url = new URL(window.location.href);
        if (!url.searchParams.get('module')) {
          url.searchParams.set('module', data.name);
          window.history.replaceState({}, '', url);
        }
      }
    } catch (err) {
      console.error('Failed to load module:', err);

      let errorMessage = 'Failed to load module. Please try again.';
      if (err.response?.status === 404) {
        errorMessage = 'Module not found. It may have been deleted.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else if (err.message === 'Network Error' || !err.response) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleId) {
      loadModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const handleUpdate = (updatedModule) => {
    setModule(updatedModule);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-6 py-12">
              {/* Header Skeleton */}
              <div className="mb-8">
                <Skeleton className="h-10 w-32 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-96" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !module) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error || 'Module not found'}</p>
                  <Button asChild>
                    <Link href={`/dashboard?module=${module?.name || ''}`}>Back to Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        <div className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard?module=${module.name}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Consent Form Settings
            </h1>
            <p className="text-muted-foreground">
              Module: <span className="font-semibold">{module.name}</span>
            </p>
          </div>
        </div>

        {/* Consent Form Editor */}
        <ConsentFormEditor
          moduleId={moduleId}
          initialConsentText={module.consent_form_text}
          initialConsentRequired={module.consent_required}
          onUpdate={handleUpdate}
        />

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">How Consent Forms Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • When enabled, students will see this consent form immediately after joining your module
            </p>
            <p>
              • Students must select one of three options: Agree to research, Do not agree, or Not eligible
            </p>
            <p>
              • Their consent choice is recorded in the system and can be viewed in student analytics
            </p>
            <p>
              • You can disable consent requirements at any time by toggling the &quot;Require Consent&quot; switch
            </p>
            <p>
              • The consent form supports basic Markdown formatting for better readability
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
