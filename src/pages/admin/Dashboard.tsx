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
    // Remove min-h-screen to prevent double scrollbars
    <div className="bg-background p-1 xs:p-2 sm:p-4">
      {/* Stats Grid - Make cards smaller and more compact */}
      <div className="grid grid-cols-2 gap-1 xs:gap-2 sm:gap-4 mb-2 xs:mb-4">
        <Card className="p-2 xs:p-3">
          <CardHeader className="p-0 pb-1 xs:pb-2">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="p-2 xs:p-3">
          <CardHeader className="p-0 pb-1 xs:pb-2">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="p-2 xs:p-3">
          <CardHeader className="p-0 pb-1 xs:pb-2">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-[8px] xs:text-[10px] text-muted-foreground">
              {stats.lowStockProducts} items low on stock
            </p>
          </CardContent>
        </Card>
        <Card className="p-2 xs:p-3">
          <CardHeader className="p-0 pb-1 xs:pb-2">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm xs:text-lg sm:text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-[8px] xs:text-[10px] text-muted-foreground">From delivered orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Improve responsive sizing */}
      <div className="flex flex-col gap-2 xs:gap-4">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="p-2 xs:p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm">Monthly Revenue</CardTitle>
            <CardDescription className="text-[10px] xs:text-xs">Total revenue by month</CardDescription>
          </CardHeader>
          <CardContent className="p-0 xs:p-2">
            <div className="h-[200px] xs:h-[250px] sm:h-[300px] w-full">
              <ChartContainer config={chartConfig}>
                <BarChart 
                  data={stats.revenueData}
                  margin={{ 
                    top: 10,
                    right: 5,
                    bottom: 30,
                    left: 30
                  }}
                  width={undefined}
                  height={undefined}
                >
                  {/* Adjust chart components for better mobile display */}
                  <CartesianGrid vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '8px',
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    interval={0}
                    scale="point"
                    padding={{ left: 5, right: 5 }}
                  />
                  <YAxis 
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '8px',
                    }}
                    width={30}
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
        <Card>
          <CardHeader className="p-2 xs:p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm">Most Ordered Items</CardTitle>
            <CardDescription className="text-[10px] xs:text-xs">Top selling products by quantity</CardDescription>
          </CardHeader>
          <CardContent className="p-0 xs:p-2">
            <div className="h-[200px] xs:h-[250px] sm:h-[300px] w-full">
              <ChartContainer config={mostOrderedConfig}>
                <BarChart
                  data={stats.mostOrderedItems || []}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 30,
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
                      fontSize: '8px',
                    }}
                  />
                  <XAxis 
                    type="number"
                    tick={{ 
                      fill: 'var(--muted-foreground)',
                      fontSize: '8px',
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
      <div className="mt-2 xs:mt-4">
        <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2">Recent Orders</h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[500px]"> {/* Reduced minimum width */}
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-1 xs:p-2 text-left text-[10px] xs:text-xs font-medium text-foreground">ID</th>
                      <th className="p-1 xs:p-2 text-left text-[10px] xs:text-xs font-medium text-foreground">Customer</th>
                      <th className="p-1 xs:p-2 text-left text-[10px] xs:text-xs font-medium text-foreground">Amount</th>
                      <th className="p-1 xs:p-2 text-left text-[10px] xs:text-xs font-medium text-foreground">Status</th>
                      <th className="p-1 xs:p-2 text-left text-[10px] xs:text-xs font-medium text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-muted/50">
                        <td className="p-1 xs:p-2 text-[10px] xs:text-xs text-foreground">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="p-1 xs:p-2 text-[10px] xs:text-xs text-foreground truncate max-w-[150px]">
                          {order.user?.name || 'Guest Order'}
                        </td>
                        <td className="p-1 xs:p-2 text-[10px] xs:text-xs text-foreground">
                          ₱{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-1 xs:p-2 text-[10px] xs:text-xs text-foreground capitalize">
                          {order.status}
                        </td>
                        <td className="p-1 xs:p-2 text-[10px] xs:text-xs text-foreground">
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
