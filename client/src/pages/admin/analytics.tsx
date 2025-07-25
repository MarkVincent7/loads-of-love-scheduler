import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import { useAuthStore } from "@/lib/auth";
import { useAdminStats, useRecentActivity } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Activity,
  BarChart3,
  FileText
} from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  activeEvents: number;
  totalRegistrations: number;
  waitlistCount: number;
  noShowRate: number;
  dailyAverage: number;
  weeklyTotal: number;
  capacityUtilization: number;
  statusDistribution: {
    confirmed: number;
    waitlist: number;
    cancelled: number;
    no_show: number;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status?: string;
  eventTitle?: string;
}

export default function AdminAnalytics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useAdminStats() as {
    data: AdminStats | undefined;
    isLoading: boolean;
  };
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity() as {
    data: ActivityItem[] | undefined;
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



  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'cancellation': return <UserX className="h-4 w-4 text-red-600" />;
      case 'waitlist': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'status_change': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'no_show': return <TrendingDown className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.activeEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Events with future dates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalRegistrations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Confirmed registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlist Count</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.waitlistCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                People waiting for slots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-show Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : `${stats?.noShowRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Percentage of no-shows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Average</span>
                  <span className="text-lg font-bold">
                    {statsLoading ? "..." : stats?.dailyAverage || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weekly Total</span>
                  <span className="text-lg font-bold">
                    {statsLoading ? "..." : stats?.weeklyTotal || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Capacity Utilization</span>
                  <span className="text-lg font-bold">
                    {statsLoading ? "..." : `${stats?.capacityUtilization || 0}%`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confirmed</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {statsLoading ? "..." : stats?.statusDistribution?.confirmed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Waitlisted</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {statsLoading ? "..." : stats?.statusDistribution?.waitlist || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cancelled</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {statsLoading ? "..." : stats?.statusDistribution?.cancelled || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">No-shows</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {statsLoading ? "..." : stats?.statusDistribution?.no_show || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading activity...</p>
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: ActivityItem, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                        {activity.status && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            activity.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'waitlist' ? 'bg-yellow-100 text-yellow-800' :
                            activity.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            activity.status === 'no_show' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      {activity.eventTitle && (
                        <p className="text-xs text-gray-600 mt-1">
                          Event: {activity.eventTitle}
                        </p>
                      )}
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