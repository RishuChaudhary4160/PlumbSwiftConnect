import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Bell, LogOut, Clock, CheckCircle, Star, Phone, Navigation, User, MapPin, Calendar, Check, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authService, authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";

export default function PlumberDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated() || currentUser?.role !== 'plumber') {
      setLocation('/login');
    }
  }, [setLocation, currentUser]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/bookings');
      return response.json() as Promise<Booking[]>;
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await authenticatedApiRequest('PATCH', `/api/bookings/${bookingId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
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

  const handleAcceptJob = (bookingId: string) => {
    updateBookingStatusMutation.mutate(
      { bookingId, status: 'accepted' },
      {
        onSuccess: () => {
          toast({
            title: "Job Accepted",
            description: "You have successfully accepted this job. Customer will be notified.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to accept the job. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRejectJob = (bookingId: string) => {
    updateBookingStatusMutation.mutate(
      { bookingId, status: 'rejected' },
      {
        onSuccess: (data) => {
          toast({
            title: "Job Rejected",
            description: data.reassigned 
              ? "Job has been reassigned to another plumber."
              : "Job rejected. No other plumbers available at the moment.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to reject the job. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleStartJob = (bookingId: string) => {
    updateBookingStatusMutation.mutate(
      { bookingId, status: 'in-progress' },
      {
        onSuccess: () => {
          toast({
            title: "Job Started",
            description: "Job status updated to in-progress. Customer has been notified.",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge className="bg-accent text-accent-foreground"><Clock className="w-3 h-3 mr-1" />New Assignment</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const assignedBookings = bookings.filter(b => b.status === 'assigned');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
  const inProgressBookings = bookings.filter(b => b.status === 'in-progress');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const stats = {
    pending: assignedBookings.length,
    active: acceptedBookings.length + inProgressBookings.length,
    completed: completedBookings.length,
    rating: 4.9,
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
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Wrench className="text-accent text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{currentUser.name}</h1>
                <p className="text-sm text-muted-foreground">Certified Plumber</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-success/10 text-success rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Available</span>
              </div>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="text-primary h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Jobs</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="text-accent h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
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
                <Star className="text-warning h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stats.rating}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs Section */}
        <Card className="shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Assigned Jobs</CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="border border-border rounded-lg p-6">
                    <div className="skeleton h-6 w-48 mb-3"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : assignedBookings.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No new assignments</h3>
                <p className="text-muted-foreground">You're all caught up! New job assignments will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedBookings.map((booking) => (
                  <div key={booking.id} className="border-2 border-accent/30 bg-accent/5 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-muted-foreground">Job #{booking.id.slice(-8)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{booking.category}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{booking.description}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <User className="text-muted-foreground w-5 h-5 mr-2" />
                        <span className="text-foreground">Customer ID: {booking.userId.slice(-8)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="text-muted-foreground w-5 h-5 mr-2" />
                        <span className="text-foreground">{booking.address}</span>
                      </div>
                      {booking.preferredDate && (
                        <div className="flex items-center text-sm">
                          <Calendar className="text-muted-foreground w-5 h-5 mr-2" />
                          <span className="text-foreground">{new Date(booking.preferredDate).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 pt-4 border-t border-border">
                      <Button
                        onClick={() => handleAcceptJob(booking.id)}
                        disabled={updateBookingStatusMutation.isPending}
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                        data-testid={`button-accept-${booking.id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept Job
                      </Button>
                      <Button
                        onClick={() => handleRejectJob(booking.id)}
                        disabled={updateBookingStatusMutation.isPending}
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                        data-testid={`button-reject-${booking.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Job
                      </Button>
                      <Button variant="outline" size="icon">
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        {(acceptedBookings.length > 0 || inProgressBookings.length > 0) && (
          <Card className="shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Active Jobs</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {[...acceptedBookings, ...inProgressBookings].map((booking) => (
                  <div key={booking.id} className="border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusBadge(booking.status)}
                          <span className="text-sm text-muted-foreground">Job #{booking.id.slice(-8)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{booking.category}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{booking.description}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <User className="text-muted-foreground w-5 h-5 mr-2" />
                        <span className="text-foreground">Customer ID: {booking.userId.slice(-8)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="text-muted-foreground w-5 h-5 mr-2" />
                        <span className="text-foreground">{booking.address}</span>
                      </div>
                      {booking.preferredDate && (
                        <div className="flex items-center text-sm">
                          <Calendar className="text-muted-foreground w-5 h-5 mr-2" />
                          <span className="text-foreground">{new Date(booking.preferredDate).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 pt-4 border-t border-border">
                      {booking.status === 'accepted' ? (
                        <Button
                          onClick={() => handleStartJob(booking.id)}
                          disabled={updateBookingStatusMutation.isPending}
                          className="flex-1"
                          data-testid={`button-start-${booking.id}`}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Start Job
                        </Button>
                      ) : (
                        <Button className="flex-1" disabled>
                          <Clock className="w-4 h-4 mr-2" />
                          In Progress
                        </Button>
                      )}
                      <Button variant="outline" size="icon">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jobs Completed</span>
                <span className="text-lg font-bold text-foreground">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Earnings</span>
                <span className="text-lg font-bold text-success">$3,840</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Time</span>
                <span className="text-lg font-bold text-foreground">2.5 hrs</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                <p className="text-sm text-foreground">"Excellent work! Very professional and quick."</p>
                <p className="text-xs text-muted-foreground mt-1">- Customer #{bookings[0]?.userId.slice(-8) || 'Anonymous'}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
                <p className="text-sm text-foreground">"Fixed the issue perfectly. Highly recommend!"</p>
                <p className="text-xs text-muted-foreground mt-1">- Customer #{bookings[1]?.userId.slice(-8) || 'Anonymous'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
