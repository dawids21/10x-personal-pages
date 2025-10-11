import { Toaster } from "sonner";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { PageSettingsCard } from "@/components/dashboard/PageSettingsCard";
import { PageContentCard } from "@/components/dashboard/PageContentCard";
import { ProjectsCard } from "@/components/dashboard/ProjectsCard";
import type { AdminDashboardProps } from "@/components/dashboard/dashboard.types";

export function AdminDashboard({ initialPage, baseUrl }: AdminDashboardProps) {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your personal page and projects</p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="space-y-6">
            <PageSettingsCard page={initialPage} baseUrl={baseUrl} />
            <PageContentCard />
          </div>
          <div>
            <ProjectsCard />
          </div>
        </div>
      </main>
      <Toaster position="bottom-right" />
    </>
  );
}
