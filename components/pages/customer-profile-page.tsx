"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Edit,
  LocateFixed,
  MapPin,
  Star,
  Shield,
  Award,
  Upload,
  X,
  FileText,
  Wallet,
  Camera,
  ChevronRight,
  Settings,
} from "lucide-react";
import Image from "next/image";

interface Address {
  id: number;
  label: string;
  address: string;
  default: boolean;
}

interface WalletSummary {
  balance: number;
  totalServices: number;
  totalSpent: number;
}

export function CustomerProfilePage() {
  const { user, logout, isAuthenticated, isLoading } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationStep, setVerificationStep] = useState<
    "none" | "upload" | "waiting" | "verified"
  >("none");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [savedData, setSavedData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: "",
    bio: "",
  });
  const [formData, setFormData] = useState({ ...savedData });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", address: "" });
  const [walletSummary, setWalletSummary] = useState<WalletSummary>({
    balance: 0,
    totalServices: 0,
    totalSpent: 0,
  });

  const handleUnauthorized = useCallback(async () => {
    await logout();
  }, [logout]);

  useEffect(() => {
    setSavedData((current) => {
      const nextData = {
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: current.location,
        bio: current.bio,
      };
      setFormData(nextData);
      return nextData;
    });
  }, [user?.email, user?.name, user?.phone]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      return;
    }

    let cancelled = false;

    const loadSavedLocation = async () => {
      try {
        const response = await fetch("/api/auth/location", { cache: "no-store" });

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const payload = await response.json();
        if (!response.ok || !payload?.ok || cancelled) return;

        const location = String(payload?.data?.location || "");
        if (!location) return;

        setSavedData((current) => ({ ...current, location }));
        setFormData((current) => ({ ...current, location }));
      } catch {
        // Keep profile usable when location fetch fails.
      }
    };

    loadSavedLocation();

    return () => {
      cancelled = true;
    };
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  useEffect(() => {
    const loadWalletSummary = async () => {
      if (isLoading || !isAuthenticated || !user?.id) {
        setWalletSummary({ balance: 0, totalServices: 0, totalSpent: 0 });
        return;
      }

      try {
        const response = await fetch("/api/wallet", { cache: "no-store" });

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const payload = await response.json();
        if (!response.ok || !payload?.ok) return;

        setWalletSummary({
          balance: Number(payload?.data?.balance || 0),
          totalServices: Number(payload?.data?.totalServices || 0),
          totalSpent: Number(payload?.data?.totalSpent || 0),
        });
      } catch {
        setWalletSummary({ balance: 0, totalServices: 0, totalSpent: 0 });
      }
    };

    loadWalletSummary();
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAddAddress = () => {
    if (newAddress.label && newAddress.address) {
      setAddresses([
        ...addresses,
        {
          id: Date.now(),
          label: newAddress.label,
          address: newAddress.address,
          default: false,
        },
      ]);
      setNewAddress({ label: "", address: "" });
      setShowAddressForm(false);
    }
  };
  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };
  const handleSetDefaultAddress = (id: number) => {
    setAddresses(addresses.map((a) => ({ ...a, default: a.id === id })));
  };

  const stats = [
    {
      label: "Wallet balance",
      value: `KES ${walletSummary.balance.toLocaleString()}`,
      icon: Wallet,
    },
    {
      label: "Services paid",
      value: String(walletSummary.totalServices),
      icon: FileText,
    },
    {
      label: "Member since",
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-KE", {
            month: "short",
            year: "numeric",
          })
        : "New member",
      icon: Star,
    },
  ];

  const detectAndSaveLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported in this browser.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationMessage("Fetching your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const accuracy = Number(position.coords.accuracy.toFixed(0));
        const location = `${latitude}, ${longitude}`;

        setFormData((current) => ({ ...current, location }));
        setSavedData((current) => ({ ...current, location }));

        try {
          const response = await fetch("/api/auth/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location, latitude, longitude, accuracy }),
          });

          if (response.status === 401) {
            await handleUnauthorized();
            return;
          }

          const payload = await response.json();
          if (!response.ok || !payload?.ok) {
            throw new Error(payload?.error || "Failed to save location");
          }
          setLocationMessage("Location captured and saved.");
        } catch (error) {
          setLocationMessage(
            error instanceof Error ? error.message : "Failed to save location.",
          );
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setLocationMessage("Unable to fetch location.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        {/* Profile Hero */}
        <Card className="overflow-hidden border-0 shadow-md mb-6">
          <div className="bg-linear-to-br from-primary via-primary to-primary/80 px-6 pt-6 pb-16 relative">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary-foreground">
                My Profile
              </h1>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) setFormData(savedData);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-primary-foreground"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-background shadow-lg flex items-center justify-center text-3xl font-bold text-primary overflow-hidden ring-4 ring-background">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    savedData.name?.[0]
                  )}
                </div>
                <button
                  onClick={() => profileImageInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-all"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {savedData.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {savedData.email}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {savedData.phone || "No phone number saved"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {verificationStep === "verified" && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-semibold">
                      <Shield className="w-3 h-3" /> ID Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-semibold">
                    <Award className="w-3 h-3" /> Trusted Member
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="p-3 bg-muted/50 rounded-xl text-center"
                  >
                    <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Edit Profile */}
        {isEditing && (
          <Card className="p-5 border-0 shadow-sm mb-4">
            <h3 className="font-semibold text-foreground mb-4">Edit Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Full Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Add a short bio"
                  className="w-full p-3 border border-border rounded-xl bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Not set"
                  className="rounded-xl"
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={detectAndSaveLocation}
                    disabled={isDetectingLocation}
                  >
                    <LocateFixed className="w-4 h-4 mr-2" />
                    {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                  </Button>
                  {locationMessage && (
                    <p className="text-xs text-muted-foreground">{locationMessage}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={async () => {
                    setSavedData(formData);
                    if (formData.location.trim()) {
                      const response = await fetch("/api/auth/location", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          location: formData.location.trim(),
                          latitude: 0,
                          longitude: 0,
                          accuracy: null,
                        }),
                      }).catch(() => {
                        // Keep manual profile save non-blocking.
                        return null;
                      });

                      if (response?.status === 401) {
                        await handleUnauthorized();
                        return;
                      }
                    }
                    setIsEditing(false);
                    alert("Profile updated!");
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(savedData);
                    setIsEditing(false);
                  }}
                  className="flex-1 rounded-xl bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ID Verification */}
        <Card className="p-5 border-0 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              ID Verification
            </h3>
            {verificationStep === "verified" && (
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-lg">
                Verified
              </span>
            )}
            {verificationStep === "waiting" && (
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold rounded-lg">
                Pending
              </span>
            )}
          </div>

          {verificationStep === "none" && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Verify your ID to become a trusted member and unlock premium
                features.
              </p>
              <Button
                className="w-full rounded-xl gap-2"
                onClick={() => setVerificationStep("upload")}
              >
                <Upload className="w-4 h-4" />
                Start Verification
              </Button>
            </div>
          )}
          {verificationStep === "upload" && (
            <div className="space-y-3">
              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Upload ID Document
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or PDF (max 5MB)
                  </p>
                </div>
              ) : (
                <div className="relative border border-border rounded-xl p-3">
                  <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {uploadedFile.startsWith("data:image") ? (
                      <Image
                        src={uploadedFile}
                        alt="ID"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          PDF Uploaded
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    if (uploadedFile) {
                      setVerificationStep("waiting");
                    } else {
                      alert("Upload a document first");
                    }
                  }}
                >
                  Submit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => {
                    setVerificationStep("none");
                    setUploadedFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {verificationStep === "waiting" && (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Your ID is being reviewed. This usually takes 24 hours.
                </p>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  setVerificationStep("verified");
                  setUploadedFile(null);
                }}
              >
                Mark as Verified (Demo)
              </Button>
            </div>
          )}
        </Card>

        {/* Saved Addresses */}
        <Card className="p-5 border-0 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Saved Addresses</h3>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs h-8"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? "Cancel" : "Add New"}
            </Button>
          </div>

          {showAddressForm && (
            <div className="p-3 bg-muted/50 rounded-xl mb-3 space-y-2">
              <Input
                placeholder="Label (e.g., Home, Office)"
                value={newAddress.label}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, label: e.target.value })
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Full Address"
                value={newAddress.address}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, address: e.target.value })
                }
                className="rounded-xl"
              />
              <Button className="w-full rounded-xl" onClick={handleAddAddress}>
                Save Address
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {addresses.length === 0 && !showAddressForm && (
              <div className="p-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground text-center">
                No saved addresses yet. Add one from your current location or
                enter it manually.
              </div>
            )}
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {addr.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {addr.address}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {addr.default ? (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-md">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="px-2 py-0.5 bg-muted text-[10px] font-semibold rounded-md hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="px-2 py-0.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="border-0 shadow-sm mb-4 overflow-hidden">
          {[
            { label: "Notification Preferences", href: "/customer/settings" },
            { label: "Privacy & Security", href: "/customer/settings" },
            { label: "App Settings", href: "/customer/settings" },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
            >
              <span className="text-sm font-medium text-foreground">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full rounded-xl border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 bg-transparent"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}
