import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {  CartesianGrid, XAxis, YAxis, Bar, BarChart, LabelList } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  ordersByStatus: {
    received: number;
    baking: number;
    'out for delivery': number;
    delivered: number;
  };
  recentOrders: Array<{
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user: { name: string } | null;
  }>;
  revenueData: {
    name: string;
    total: number;
  }[];
  mostOrderedItems: Array<{
    name: string;
    quantity: number;
  }>;
}

export default function Dashboard() {
  useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    ordersByStatus: {
      received: 0,
      baking: 0,
      'out for delivery': 0,
      delivered: 0,
    },
    revenueData: [],
    recentOrders: [],
    mostOrderedItems: [], // Make sure this is initialized as an empty array
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        console.log('Fetched stats data:', data); // Add this debug log
        console.log('Most ordered items:', data.mostOrderedItems); // Add this debug log
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartConfig = {
    total: {
      label: "Revenue",
      theme: {
        light: "hsl(var(--muted-foreground))",
        dark: "hsl(var(--accent))" 
      },
    },
  } satisfies ChartConfig;

  const mostOrderedConfig = {
    quantity: {
      label: "Quantity",
      color: "var(--chart-2)",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-2 xs:p-4 sm:p-6 w-full bg-background min-h-screen">
      {/* Stats cards grid - Improved responsiveness */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl xs:text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl xs:text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl xs:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockProducts} items low on stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl xs:text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From delivered orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid Section - Better scaling for smaller screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
        {/* Revenue Chart */}
        <Card className="col-span-1">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-sm xs:text-base">Monthly Revenue</CardTitle>
            <CardDescription className="text-xs xs:text-sm">Total revenue by month</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 xs:pl-2 p-2 xs:p-4">
            <div className="h-[250px] xs:h-[300px] sm:h-[350px]">
              <ChartContainer config={chartConfig}>
                <BarChart 
                  data={stats.revenueData}
                  margin={{ 
                    top: 20, 
                    right: 5,  // Reduced right margin
                    bottom: 40, // Reduced bottom margin
                    left: 40   // Reduced left margin
                  }}
                  height={250}  // Match container height
                >
                  <CartesianGrid vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    scale="point"
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    width={50}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--accent)' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="currentColor"
                    className="fill-current text-primary"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Ordered Items Chart - Similar adjustments */}
        <Card className="col-span-1">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-sm xs:text-base">Most Ordered Items</CardTitle>
            <CardDescription className="text-xs xs:text-sm">Top selling products by quantity</CardDescription>
          </CardHeader>
          <CardContent className="p-2 xs:p-4">
            <div className="h-[250px] xs:h-[300px] sm:h-[350px]">
              <ChartContainer config={mostOrderedConfig}>
                <BarChart
                  data={stats.mostOrderedItems || []}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    bottom: 5,
                    left: 60,  // Reduced for smaller screens
                  }}
                  height={250}  // Match container height
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: 12 
                    }}
                  />
                  <XAxis 
                    type="number"
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: 12
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="currentColor"
                    className="fill-current text-primary"
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="quantity"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-4 xs:mt-6">
        <h3 className="text-sm xs:text-base font-medium text-foreground mb-2 xs:mb-4">Recent Orders</h3>
        <div className="bg-card rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[500px] xs:min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 xs:px-4 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-foreground">Order ID</th>
                <th className="px-2 xs:px-4 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-foreground">Customer</th>
                <th className="px-2 xs:px-4 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-foreground">Amount</th>
                <th className="px-2 xs:px-4 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-foreground">Status</th>
                <th className="px-2 xs:px-4 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentOrders.map((order) => (
                <tr key={order._id} className="text-[10px] xs:text-xs sm:text-sm">
                  <td className="px-2 xs:px-4 py-2 xs:py-3 text-foreground">#{order._id.slice(-6)}</td>
                  <td className="px-2 xs:px-4 py-2 xs:py-3 text-foreground">{order.user?.name || 'Guest Order'}</td>
                  <td className="px-2 xs:px-4 py-2 xs:py-3 text-foreground">₱{order.totalAmount.toFixed(2)}</td>
                  <td className="px-2 xs:px-4 py-2 xs:py-3 text-foreground capitalize">{order.status}</td>
                  <td className="px-2 xs:px-4 py-2 xs:py-3 text-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
