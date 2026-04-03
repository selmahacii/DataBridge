"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

const defaultBranding: Branding = {
  primaryColor: "#000000",
  secondaryColor: "#6b7280",
  fontFamily: "Inter, sans-serif",
};

export function BrandingPage() {
  const [form, setForm] = useState<Branding>(defaultBranding);

  const { data: branding, isLoading } = useQuery({
    queryKey: ["branding"],
    queryFn: () => api.getBranding() as Promise<Branding>,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Branding) => api.updateBranding(data as Record<string, unknown>),
    onSuccess: () => {
      toast.success("Branding updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const currentBranding = branding ?? defaultBranding;

  function handleSave() {
    updateMutation.mutate(form);
  }

  function handleReset() {
    setForm(currentBranding);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand Settings</CardTitle>
            <CardDescription>
              Configure your platform colors and typography
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input"
                    />
                    <Input
                      id="primary-color"
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input"
                    />
                    <Input
                      id="secondary-color"
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          secondaryColor: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Input
                    id="font-family"
                    value={form.fontFamily}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fontFamily: e.target.value }))
                    }
                    placeholder="Inter, sans-serif"
                  />
                </div>
                <Separator />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
            <CardDescription>
              See how your branding looks in real time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className="rounded-lg border p-6 space-y-4"
              style={{
                fontFamily: form.fontFamily,
              }}
            >
              <div className="space-y-2">
                <div
                  className="h-8 w-32 rounded-md"
                  style={{ backgroundColor: form.primaryColor }}
                />
                <p className="text-sm text-muted-foreground">
                  Primary Color: {form.primaryColor}
                </p>
              </div>
              <div className="space-y-2">
                <div
                  className="h-8 w-24 rounded-md"
                  style={{ backgroundColor: form.secondaryColor }}
                />
                <p className="text-sm text-muted-foreground">
                  Secondary Color: {form.secondaryColor}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-lg font-semibold" style={{ fontFamily: form.fontFamily }}>
                  Sample Heading
                </p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: form.fontFamily }}>
                  This is how your text will appear with the selected font
                  family.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: form.primaryColor,
                    color: "#fff",
                  }}
                >
                  Primary Button
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  style={{
                    borderColor: form.secondaryColor,
                    color: form.secondaryColor,
                  }}
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
