import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { issuesAPI } from "../api/issues";
import type { IssueCategory } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { RiLoader4Line, RiCloseLine, RiMapPin2Line, RiCameraLine, RiAlertLine } from "react-icons/ri";
import toast from 'react-hot-toast';

const categories: IssueCategory[] = [
  "Pothole",
  "Garbage",
  "Streetlight",
  "Water Supply",
  "Drainage",
  "Road Damage",
  "Parks",
  "Other",
];

// Reverse geocode using OpenStreetMap Nominatim API
async function getHumanReadableLocation(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("Error fetching address:", error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Fetch location suggestions from OpenStreetMap Nominatim API
async function fetchLocationSuggestions(query: string): Promise<any[]> {
  if (!query || query.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

export function ReportIssuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Pothole" as IssueCategory,
    priority: "medium" as "low" | "medium" | "high",
    address: "",
    latitude: 40.7128,
    longitude: -74.006,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [gpsDisabled, setGpsDisabled] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...filesArray]);

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.address.trim()) newErrors.address = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    setIsSubmitting(true);

    try {
      // Upload images first if any
      let photoUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        photoUrls = await issuesAPI.uploadIssueImages(uploadedFiles);
      }
      
      await issuesAPI.createIssue(
        formData.title,
        formData.description,
        formData.category,
        formData.priority,
        {
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        photoUrls,
        user.id,
        user.name
      );

      toast.success('Issue reported successfully!');
      navigate("/my-issues");
    } catch (error) {
      console.error("Failed to create issue:", error);
      toast.error(`Failed to create issue: ${error instanceof Error ? error.message : 'Please try again later.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setGpsDisabled(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await getHumanReadableLocation(lat, lng);

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: address,
        }));
        setSuggestions([]);

        // Re-enable GPS button after 2 seconds
        setTimeout(() => setGpsDisabled(false), 2000);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your location. Please enter it manually.");
        setGpsDisabled(false);
      }
    );
  };

  // Handle location input with debounce
  const handleLocationInput = async (val: string) => {
    handleChange("address", val);

    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsLoadingSuggestions(true);

    // Set new timer with 500ms delay
    debounceTimer.current = window.setTimeout(async () => {
      try {
        const results = await fetchLocationSuggestions(val);
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);
  };

  const selectSuggestion = (place: any) => {
    setFormData((prev) => ({
      ...prev,
      address: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    }));
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Report a Civic Issue
          </h1>
          <p className="text-muted-foreground text-lg">
            Help improve your community by reporting issues that need attention
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">Issue Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Brief description of the issue"
                required
                aria-invalid={!!errors.title}
                className="h-12 text-base"
              />
              {errors.title && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <RiAlertLine className="w-4 h-4" />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Provide more details about the issue..."
                rows={6}
                required
                aria-invalid={!!errors.description}
                className="text-base resize-none"
              />
              {errors.description && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <RiAlertLine className="w-4 h-4" />
                  {errors.description}
                </div>
              )}
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => handleChange("category", val)}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => handleChange("priority", val)}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Location</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  placeholder="Enter address or location"
                  required
                  className="w-full py-2.5 h-12"
                  aria-invalid={!!errors.address}
                />

                {/* Use Current Location Button */}
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={gpsDisabled}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <RiMapPin2Line className="w-3 h-3" />
                  Use my current location
                </button>

                {/* Location Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {suggestions.map((place, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 text-sm"
                        onClick={() => selectSuggestion(place)}
                      >
                        <div className="flex items-start gap-2">
                          <RiMapPin2Line className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span className="line-clamp-2">{place.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isLoadingSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <RiLoader4Line className="w-4 h-4 animate-spin" />
                      Searching locations...
                    </div>
                  </div>
                )}
              </div>
              {errors.address && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <RiAlertLine className="w-4 h-4" />
                  {errors.address}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Photos (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/20">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <RiCameraLine className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground mb-1">
                        Click to upload photos
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG up to 10MB (Max 5 images)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for Effective Reporting
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Be specific and descriptive in your title</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Include as many details as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Provide accurate location information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Add photos if available for better context</span>
                </li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <RiLoader4Line className="h-5 w-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Report
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
