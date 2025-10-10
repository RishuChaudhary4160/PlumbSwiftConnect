import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Crown, Bell, LogOut, TrendingUp, Users, DollarSign, UserPlus, Download, Eye, UserX, UserCheck, Search, BarChart3, PieChart, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authService, authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import OnboardModal from "@/components/onboard-modal";
import type { Booking, User, Plumber } from "@shared/schema";

interface PlumberWithUser extends Plumber {
  user: User;
}

interface DashboardStats {
  totalBookings: number;
  activePlumbers: number;
  totalCustomers: number;
  pendingBookings: number;
  completedBookings: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated() || currentUser?.role !== 'admin') {
      setLocation('/login');
    }
  }, [setLocation, currentUser]);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/dashboard/stats');
      return response.json() as Promise<DashboardStats>;
    },
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/bookings');
      return response.json() as Promise<Booking[]>;
    },
  });

  const { data: plumbers = [], isLoading: isLoadingPlumbers } = useQuery({
    queryKey: ['/api/plumbers'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/plumbers');
      return response.json() as Promise<PlumberWithUser[]>;
    },
  });

  const handleLogout = () => {
    authService.logout();
    setLocation('/');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleOnboardSuccess = () => {
    setIsOnboardModalOpen(false);
    toast({
      title: "Plumber Onboarded",
      description: "New plumber has been successfully added to the platform.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Assigned</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Accepted</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlumberStatusBadge = (plumber: PlumberWithUser) => {
    if (!plumber.isVerified) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
    }
    if (plumber.isAvailable) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/30">
        <div className="w-2 h-2 bg-success rounded-full mr-1"></div>Active
      </Badge>;
    }
    return <Badge variant="outline" className="bg-muted/10 text-muted border-muted/30">Inactive</Badge>;
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customers = Array.from(new Set(bookings.map(b => b.userId))).map(userId => {
    const userBookings = bookings.filter(b => b.userId === userId);
    return {
      id: userId,
      totalBookings: userBookings.length,
      joinedDate: new Date(Math.min(...userBookings.map(b => new Date(b.createdAt || '').getTime()))).toLocaleDateString(),
    };
  });

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <Crown className="text-destructive text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Platform Management</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Button onClick={() => setIsOnboardModalOpen(true)} data-testid="button-onboard-plumber">
                <UserPlus className="w-4 h-4 mr-2" />
                Onboard Plumber
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 mb-4" />
              <div className="text-3xl font-bold mb-1" data-testid="stat-total-bookings">
                {isLoadingStats ? "..." : stats?.totalBookings || 0}
              </div>
              <div className="text-sm opacity-90">Total Bookings</div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg">
            <CardContent className="p-6">
              <Users className="h-8 w-8 mb-4" />
              <div className="text-3xl font-bold mb-1" data-testid="stat-active-plumbers">
                {isLoadingStats ? "..." : stats?.activePlumbers || 0}
              </div>
              <div className="text-sm opacity-90">Active Plumbers</div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>5 new this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 mb-4" />
              <div className="text-3xl font-bold mb-1">$94,580</div>
              <div className="text-sm opacity-90">Monthly Revenue</div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>18% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-lg">
            <CardContent className="p-6">
              <Users className="h-8 w-8 mb-4" />
              <div className="text-3xl font-bold mb-1" data-testid="stat-total-customers">
                {isLoadingStats ? "..." : stats?.totalCustomers || 0}
              </div>
              <div className="text-sm opacity-90">Total Customers</div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>234 new this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="bookings" data-testid="tab-bookings">All Bookings</TabsTrigger>
                  <TabsTrigger value="plumbers" data-testid="tab-plumbers">Plumbers</TabsTrigger>
                  <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
                  <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* All Bookings Tab */}
            <TabsContent value="bookings" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-bookings"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {isLoadingBookings ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <div className="skeleton h-6 w-48 mb-2"></div>
                      <div className="skeleton h-4 w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Plumber</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id} data-testid={`booking-row-${booking.id}`}>
                          <TableCell className="font-medium">#{booking.id.slice(-8)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Customer</div>
                              <div className="text-xs text-muted-foreground">ID: {booking.userId.slice(-8)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.category}</TableCell>
                          <TableCell>
                            {booking.assignedPlumber ? (
                              <div>
                                <div className="font-medium">Assigned</div>
                                <div className="text-xs text-muted-foreground">ID: {booking.assignedPlumber.slice(-8)}</div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">Not Assigned</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.preferredDate 
                              ? new Date(booking.preferredDate).toLocaleDateString()
                              : "Not specified"
                            }
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-${booking.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!booking.assignedPlumber && booking.status === 'pending' && (
                                <Button variant="ghost" size="sm" className="text-primary">
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search criteria.' 
                          : 'No bookings have been created yet.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Plumbers Tab */}
            <TabsContent value="plumbers" className="p-6">
              {isLoadingPlumbers ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="skeleton h-6 w-48 mb-4"></div>
                        <div className="skeleton h-4 w-full mb-2"></div>
                        <div className="skeleton h-4 w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plumbers.map((plumber) => (
                    <Card key={plumber.id} data-testid={`plumber-card-${plumber.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{plumber.user?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">ID: {plumber.id.slice(-8)}</div>
                            </div>
                          </div>
                          {getPlumberStatusBadge(plumber)}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <Trophy className="text-warning w-4 h-4 mr-2" />
                            <span className="text-foreground">{((plumber.rating || 0) / 10).toFixed(1)} ({plumber.totalJobs} jobs)</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Users className="text-muted-foreground w-4 h-4 mr-2" />
                            <span className="text-foreground">{plumber.totalJobs} jobs completed</span>
                          </div>
                          {plumber.user?.phone && (
                            <div className="flex items-center text-sm">
                              <span className="text-foreground">{plumber.user.phone}</span>
                            </div>
                          )}
                        </div>

                        {plumber.specializations.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-foreground mb-2">Specializations:</div>
                            <div className="flex flex-wrap gap-1">
                              {plumber.specializations.map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button className="flex-1" size="sm" data-testid={`button-view-plumber-${plumber.id}`}>
                            View Profile
                          </Button>
                          {!plumber.isVerified && (
                            <Button variant="outline" size="sm" className="text-success border-success">
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>First Booking</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                        <TableCell className="font-medium">#{customer.id.slice(-8)}</TableCell>
                        <TableCell>{customer.totalBookings}</TableCell>
                        <TableCell>{customer.joinedDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {customers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
                    <p className="text-muted-foreground">No customer bookings have been created yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Booking Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="mx-auto h-16 w-16 mb-4" />
                        <p>Booking trends visualization</p>
                        <p className="text-sm mt-2">Chart implementation pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Service Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChart className="mx-auto h-16 w-16 mb-4" />
                        <p>Service distribution chart</p>
                        <p className="text-sm mt-2">Chart implementation pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <DollarSign className="mx-auto h-16 w-16 mb-4" />
                        <p>Revenue analytics</p>
                        <p className="text-sm mt-2">Analytics implementation pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Plumber Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Trophy className="mx-auto h-16 w-16 mb-4" />
                        <p>Performance metrics</p>
                        <p className="text-sm mt-2">Leaderboard implementation pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Onboard Modal */}
      <OnboardModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onSuccess={handleOnboardSuccess}
      />
    </div>
  );
}
