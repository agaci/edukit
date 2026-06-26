"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TutorDashboard } from "@/components/dashboard/TutorDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return user.role === "tutor" ? <TutorDashboard /> : <StudentDashboard />;
}
