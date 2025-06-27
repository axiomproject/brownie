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
    <div className="min-h-screen bg-background p-2 xs:p-4 sm:p-6 lg:p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground">
              {stats.lowStockProducts} items low on stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground">From delivered orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col gap-4 mb-4 xs:mb-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="p-3 xs:p-4 sm:p-6">
            <CardTitle className="text-sm xs:text-base">Monthly Revenue</CardTitle>
            <CardDescription className="text-xs xs:text-sm">Total revenue by month</CardDescription>
          </CardHeader>
          <CardContent className="p-0 xs:p-2 sm:p-4">
            <div className="h-[250px] xs:h-[300px] sm:h-[400px] w-full">
              <ChartContainer config={chartConfig}>
                <BarChart 
                  data={stats.revenueData}
                  margin={{ 
                    top: 20, 
                    right: 10, 
                    bottom: 40, 
                    left: 35 
                  }}
                  width={undefined}
                  height={undefined}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '10px',
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    scale="point"
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis 
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '10px',
                    }}
                    width={35}
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

        {/* Most Ordered Items Chart */}
        <Card>
          <CardHeader className="p-3 xs:p-4 sm:p-6">
            <CardTitle className="text-sm xs:text-base">Most Ordered Items</CardTitle>
            <CardDescription className="text-xs xs:text-sm">Top selling products by quantity</CardDescription>
          </CardHeader>
          <CardContent className="p-0 xs:p-2 sm:p-4">
            <div className="h-[250px] xs:h-[300px] sm:h-[400px] w-full">
              <ChartContainer config={mostOrderedConfig}>
                <BarChart
                  data={stats.mostOrderedItems || []}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    bottom: 20,
                    left: 35,
                  }}
                  width={undefined}
                  height={undefined}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '10px',
                    }}
                  />
                  <XAxis 
                    type="number"
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '10px',
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
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="mt-4 xs:mt-6">
        <h3 className="text-sm xs:text-base font-medium text-foreground mb-3 xs:mb-4">Recent Orders</h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 xs:px-4 xs:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-foreground">Order ID</th>
                      <th className="p-2 xs:px-4 xs:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-foreground">Customer</th>
                      <th className="p-2 xs:px-4 xs:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-foreground">Amount</th>
                      <th className="p-2 xs:px-4 xs:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-foreground">Status</th>
                      <th className="p-2 xs:px-4 xs:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-muted/50">
                        <td className="p-2 xs:px-4 xs:py-3 text-[10px] xs:text-xs sm:text-sm text-foreground">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="p-2 xs:px-4 xs:py-3 text-[10px] xs:text-xs sm:text-sm text-foreground truncate max-w-[150px]">
                          {order.user?.name || 'Guest Order'}
                        </td>
                        <td className="p-2 xs:px-4 xs:py-3 text-[10px] xs:text-xs sm:text-sm text-foreground">
                          ₱{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-2 xs:px-4 xs:py-3 text-[10px] xs:text-xs sm:text-sm text-foreground capitalize">
                          {order.status}
                        </td>
                        <td className="p-2 xs:px-4 xs:py-3 text-[10px] xs:text-xs sm:text-sm text-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
