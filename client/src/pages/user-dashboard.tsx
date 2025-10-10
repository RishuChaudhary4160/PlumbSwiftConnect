import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Clock, CheckCircle, Star, Bell, LogOut, MapPin, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService, authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BookingModal from "@/components/booking-modal";
import type { Booking } from "@shared/schema";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated() || currentUser?.role !== 'user') {
      setLocation('/login');
    }
  }, [setLocation, currentUser]);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/bookings');
      return response.json() as Promise<Booking[]>;
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

  const handleBookingSuccess = () => {
    refetch();
    setIsBookingModalOpen(false);
    toast({
      title: "Booking Created",
      description: "Your plumbing service request has been submitted successfully.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Assigned</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(booking => 
    statusFilter === 'all' || booking.status === statusFilter
  );

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    total: bookings.length,
  };

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
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CalendarPlus className="text-primary text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{currentUser.name}</h1>
                <p className="text-sm text-muted-foreground">Customer Dashboard</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>
              <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Action Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CalendarPlus className="h-8 w-8" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBookingModalOpen(true)}
                  data-testid="button-book-now"
                >
                  Book Now
                </Button>
              </div>
              <div className="text-2xl font-bold mb-1">New Booking</div>
              <div className="text-sm opacity-90">Schedule a service</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="text-warning h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Bookings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="text-success h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed Jobs</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Star className="text-accent h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">4.8</div>
              <div className="text-sm text-muted-foreground">Avg Rating Given</div>
            </CardContent>
          </Card>
        </div>

        {/* My Bookings Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">My Bookings</CardTitle>
              <div className="flex items-center space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
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
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-border rounded-lg p-6">
                    <div className="skeleton h-6 w-48 mb-3"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' ? 'You haven\'t made any bookings yet.' : `No ${statusFilter} bookings found.`}
                </p>
                <Button onClick={() => setIsBookingModalOpen(true)} data-testid="button-create-first-booking">
                  Create Your First Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-muted-foreground">Booking #{booking.id.slice(-8)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{booking.category}</h3>
                        <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{booking.address}</span>
                          </div>
                          {booking.preferredDate && (
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{new Date(booking.preferredDate).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.description}</p>

                        {booking.assignedPlumber && (
                          <div className="mt-3 flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">Plumber Assigned</div>
                              <div className="text-xs text-muted-foreground">ID: {booking.assignedPlumber.slice(-8)}</div>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto">
                              <Phone className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" size="sm" data-testid={`button-view-details-${booking.id}`}>
                          View Details
                        </Button>
                        {booking.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                            Cancel Booking
                          </Button>
                        )}
                        {booking.status === 'completed' && (
                          <Button variant="outline" size="sm" className="bg-accent/10 text-accent border-accent/30 hover:bg-accent/20">
                            <Star className="w-4 h-4 mr-2" />
                            Rate Service
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
