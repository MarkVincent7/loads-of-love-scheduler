import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import { useAuthStore } from "@/lib/auth";
import { useAdminStats, useRecentActivity } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, TrendingDown, Activity, UserCheck, UserX } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { data: stats, isLoading } = useAdminStats() as {
    data: {
      activeEvents: number;
      totalRegistrations: number;
      waitlistCount: number;
      noShowRate: number;
    } | undefined;
    isLoading: boolean;
  };
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity() as {
    data: Array<{ type: string; description: string; timestamp: string }> | undefined;
    isLoading: boolean;
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage events and registrations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats?.activeEvents || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats?.totalRegistrations || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats?.waitlistCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-show Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : `${stats?.noShowRate || 0}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading activity...</p>
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity: { type: string; description: string; timestamp: string }, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="flex-shrink-0 mt-1">
                      {activity.type === 'registration' && <UserCheck className="h-4 w-4 text-green-600" />}
                      {activity.type === 'cancellation' && <UserX className="h-4 w-4 text-red-600" />}
                      {activity.type === 'waitlist' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {activity.type === 'no_show' && <TrendingDown className="h-4 w-4 text-gray-600" />}
                      {!['registration', 'cancellation', 'waitlist', 'no_show'].includes(activity.type) && <Activity className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No recent activity found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
