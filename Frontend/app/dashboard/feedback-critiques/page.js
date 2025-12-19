import { Suspense } from "react";
import FeedbackCritiquesClient from "./FeedbackCritiquesClient";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

function FeedbackCritiquesLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function FeedbackCritiquesPage() {
  return (
    <Suspense fallback={<FeedbackCritiquesLoading />}>
      <FeedbackCritiquesClient />
    </Suspense>
  );
}
