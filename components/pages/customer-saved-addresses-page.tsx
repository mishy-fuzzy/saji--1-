"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Home,
  Building,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Navigation,
} from "lucide-react";

interface Address {
  id: number;
  label: string;
  type: "home" | "office" | "other";
  address: string;
  isDefault: boolean;
}

const initialAddresses: Address[] = [];

const typeIcons: Record<string, typeof Home> = {
  home: Home,
  office: Building,
  other: MapPin,
};

export function CustomerSavedAddressesPage() {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formType, setFormType] = useState<"home" | "office" | "other">("home");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormAddress(
          `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        );
      },
      () => {
        // Keep the dialog usable even when location access is denied.
        setFormAddress("Unable to detect current location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const openAdd = () => {
    setEditingId(null);
    setFormLabel("");
    setFormAddress("");
    setFormType("home");
    setShowForm(true);
  };
  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setFormLabel(a.label);
    setFormAddress(a.address);
    setFormType(a.type);
    setShowForm(true);
    setMenuOpen(null);
  };
  const handleSave = () => {
    if (!formLabel || !formAddress) return;
    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, label: formLabel, address: formAddress, type: formType }
            : a,
        ),
      );
    } else {
      setAddresses((prev) => [
        ...prev,
        {
          id: Date.now(),
          label: formLabel,
          type: formType,
          address: formAddress,
          isDefault: false,
        },
      ]);
    }
    setShowForm(false);
  };
  const handleDelete = (id: number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setMenuOpen(null);
  };
  const setDefault = (id: number) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    setMenuOpen(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Saved Addresses
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your frequently used locations
            </p>
          </div>
          <Button onClick={openAdd} className="rounded-xl gap-1.5">
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>

        <div className="space-y-3">
          {addresses.length === 0 && (
            <Card className="p-8 text-center border-0 shadow-sm">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                No saved addresses yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your home, office, or any frequently used location.
              </p>
              <Button onClick={openAdd} className="rounded-xl gap-1.5">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </Card>
          )}
          {addresses.map((addr) => {
            const Icon = typeIcons[addr.type];
            return (
              <Card
                key={addr.id}
                className="p-4 border-0 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${addr.isDefault ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-foreground">
                        {addr.label}
                      </p>
                      {addr.isDefault && (
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {addr.address}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === addr.id ? null : addr.id)
                      }
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {menuOpen === addr.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-8 w-40 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden py-1">
                          <button
                            onClick={() => openEdit(addr)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefault(addr.id)}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                            >
                              <Star className="w-3.5 h-3.5" />
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-destructive/10 text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent
            className="max-w-md rounded-2xl"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Address" : "Add Address"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Label</label>
                <Input
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. Home, Office"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["home", "office", "other"] as const).map((t) => {
                    const TIcon = typeIcons[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setFormType(t)}
                        className={`p-3 rounded-xl text-center border-2 transition-all ${formType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <TIcon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium capitalize">
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Full Address
                </label>
                <Input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={handleUseCurrentLocation}
                variant="outline"
                className="w-full rounded-xl bg-transparent gap-2"
              >
                <Navigation className="w-4 h-4" />
                Use Current Location
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 rounded-xl"
                disabled={!formLabel || !formAddress}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
