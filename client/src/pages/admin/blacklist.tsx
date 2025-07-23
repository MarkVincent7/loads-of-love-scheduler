import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import AddBlacklistDialog from "@/components/add-blacklist-dialog";
import { useAuthStore } from "@/lib/auth";
import { useBlacklist } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminBlacklist() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { data: blacklist, isLoading } = useBlacklist();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blacklist</h1>
            <p className="text-gray-600">Manage blocked users</p>
          </div>
          <AddBlacklistDialog>
            <Button>Add to Blacklist</Button>
          </AddBlacklistDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Blacklisted Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : blacklist && blacklist.length > 0 ? (
              <div className="space-y-4">
                {blacklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.email} • {item.phone}</p>
                      <p className="text-sm text-gray-500">{item.reason}</p>
                    </div>
                    <Button variant="outline" size="sm">Remove</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No blacklisted users</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
