import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const onboardSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  licenseNumber: z.string().min(3, "Please enter a valid license number"),
  experienceYears: z.string().min(1, "Please select experience level"),
  specializations: z.array(z.string()).min(1, "Please select at least one specialization"),
});

type OnboardForm = z.infer<typeof onboardSchema>;

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const availableSpecializations = [
  "Leak Repair",
  "Installation", 
  "Maintenance",
  "Emergency",
  "Pipe Repair",
  "Drain Cleaning",
  "Water Heater",
  "Bathroom Fixtures",
  "Kitchen Fixtures",
];

const experienceOptions = [
  { value: "1", label: "1-2 years" },
  { value: "3", label: "3-5 years" },
  { value: "7", label: "5-10 years" },
  { value: "12", label: "10+ years" },
];

export default function OnboardModal({ isOpen, onClose, onSuccess }: OnboardModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      licenseNumber: "",
      experienceYears: "",
      specializations: [],
    },
  });

  const onboardPlumberMutation = useMutation({
    mutationFn: async (data: OnboardForm) => {
      const response = await authenticatedApiRequest('POST', '/api/plumbers/onboard', {
        ...data,
        experienceYears: parseInt(data.experienceYears),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plumbers'] });
      form.reset();
      setUploadedFiles([]);
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Onboarding Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    const currentSpecializations = form.getValues("specializations");
    if (checked) {
      form.setValue("specializations", [...currentSpecializations, specialization]);
    } else {
      form.setValue("specializations", currentSpecializations.filter(s => s !== specialization));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const onSubmit = (data: OnboardForm) => {
    onboardPlumberMutation.mutate(data);
  };

  const handleClose = () => {
    if (!onboardPlumberMutation.isPending) {
      form.reset();
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Onboard New Plumber</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              disabled={onboardPlumberMutation.isPending}
              data-testid="button-close-onboard-modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        data-testid="input-plumber-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        data-testid="input-plumber-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        data-testid="input-plumber-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-plumber-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Professional Information */}
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PL-12345"
                      data-testid="input-license-number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-experience">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {experienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specializations */}
            <FormField
              control={form.control}
              name="specializations"
              render={() => (
                <FormItem>
                  <FormLabel>Specializations *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {availableSpecializations.map((specialization) => (
                      <div key={specialization} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialization}
                          onCheckedChange={(checked) => 
                            handleSpecializationChange(specialization, checked as boolean)
                          }
                          data-testid={`checkbox-${specialization.toLowerCase().replace(' ', '-')}`}
                        />
                        <Label 
                          htmlFor={specialization}
                          className="text-sm cursor-pointer"
                        >
                          {specialization}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Upload */}
            <div>
              <Label>Upload Documents</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mt-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <div className="mb-4">
                  <p className="text-sm text-foreground mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">
                    License, certifications, ID (PDF, JPG, PNG up to 10MB)
                  </p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                  data-testid="input-documents"
                />
                <Label htmlFor="document-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>Select Files</span>
                  </Button>
                </Label>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{file.name}</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Information Alert */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                The plumber will be automatically verified and activated upon successful onboarding. 
                They will receive login credentials via email.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={onboardPlumberMutation.isPending}
                data-testid="button-cancel-onboard"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={onboardPlumberMutation.isPending}
                data-testid="button-submit-onboard"
              >
                {onboardPlumberMutation.isPending ? "Onboarding..." : "Onboard Plumber"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
