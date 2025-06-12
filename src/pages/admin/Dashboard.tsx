import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Add API calls to fetch dashboard stats
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-foreground">Total Orders</h3>
            <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-foreground">Total Users</h3>
            <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-foreground">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary">₱{stats.totalRevenue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
