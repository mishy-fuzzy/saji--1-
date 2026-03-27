"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Users,
  Heart,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Client = {
  id: number;
  name: string;
  phone: string;
  location: string;
  avatar: string;
  totalJobs: number;
  totalSpent: number;
  avgRating: number;
  lastJobDate: string;
  lastService: string;
  isFavorite: boolean;
  joinedDate: string;
  jobs: {
    id: number;
    service: string;
    date: string;
    amount: number;
    rating: number;
    status: string;
  }[];
};

export default function ClientsPage() {
  const [providerCount, setProviderCount] = useState(0);
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "Sarah Wanjiku",
      phone: "+254 712 345 678",
      location: "Westlands, Nairobi",
      avatar: "S",
      totalJobs: 8,
      totalSpent: 68000,
      avgRating: 4.9,
      lastJobDate: "2026-02-18",
      lastService: "Kitchen Plumbing",
      isFavorite: true,
      joinedDate: "2025-06-10",
      jobs: [
        {
          id: 1,
          service: "Kitchen Plumbing Repair",
          date: "2026-02-18",
          amount: 8500,
          rating: 5,
          status: "Completed",
        },
        {
          id: 2,
          service: "Bathroom Pipe Fix",
          date: "2026-01-22",
          amount: 5500,
          rating: 5,
          status: "Completed",
        },
        {
          id: 3,
          service: "Water Heater Install",
          date: "2025-12-05",
          amount: 12000,
          rating: 4,
          status: "Completed",
        },
      ],
    },
    {
      id: 2,
      name: "John Kamau",
      phone: "+254 723 456 789",
      location: "Kilimani, Nairobi",
      avatar: "J",
      totalJobs: 6,
      totalSpent: 52000,
      avgRating: 4.7,
      lastJobDate: "2026-02-12",
      lastService: "Electrical Wiring",
      isFavorite: false,
      joinedDate: "2025-08-15",
      jobs: [
        {
          id: 4,
          service: "Electrical Wiring",
          date: "2026-02-12",
          amount: 15000,
          rating: 5,
          status: "Completed",
        },
        {
          id: 5,
          service: "Socket Installation",
          date: "2026-01-05",
          amount: 3000,
          rating: 4,
          status: "Completed",
        },
      ],
    },
    {
      id: 3,
      name: "Grace Muthoni",
      phone: "+254 734 567 890",
      location: "Karen, Nairobi",
      avatar: "G",
      totalJobs: 5,
      totalSpent: 43000,
      avgRating: 4.8,
      lastJobDate: "2026-02-17",
      lastService: "Full Bathroom Install",
      isFavorite: true,
      joinedDate: "2025-05-20",
      jobs: [
        {
          id: 6,
          service: "Full Bathroom Install",
          date: "2026-02-17",
          amount: 25000,
          rating: 5,
          status: "Completed",
        },
      ],
    },
    {
      id: 4,
      name: "Peter Odhiambo",
      phone: "+254 745 678 901",
      location: "South B, Nairobi",
      avatar: "P",
      totalJobs: 4,
      totalSpent: 38000,
      avgRating: 4.5,
      lastJobDate: "2026-02-10",
      lastService: "Pipe Replacement",
      isFavorite: false,
      joinedDate: "2025-09-01",
      jobs: [],
    },
    {
      id: 5,
      name: "Mary Njeri",
      phone: "+254 756 789 012",
      location: "Lavington, Nairobi",
      avatar: "M",
      totalJobs: 4,
      totalSpent: 31000,
      avgRating: 4.6,
      lastJobDate: "2026-02-05",
      lastService: "Water Tank Install",
      isFavorite: false,
      joinedDate: "2025-07-12",
      jobs: [],
    },
    {
      id: 6,
      name: "David Mwangi",
      phone: "+254 767 890 123",
      location: "Langata, Nairobi",
      avatar: "D",
      totalJobs: 3,
      totalSpent: 24000,
      avgRating: 4.8,
      lastJobDate: "2026-01-28",
      lastService: "Drain Clearing",
      isFavorite: false,
      joinedDate: "2025-10-05",
      jobs: [],
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/provider/users", {
          cache: "no-store",
          headers: {
            "x-user-role": "provider",
          },
        });
        const payload = await response.json();

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return;
        }

        setProviderCount(payload.data.length);
      } catch {
        // Keep page usable even when provider users endpoint is unavailable.
      }
    };

    fetchProviders();
  }, []);

  const filtered = clients
    .filter(
      (c) =>
        filterType === "All" ||
        (filterType === "Favorites" && c.isFavorite) ||
        (filterType === "Repeat" && c.totalJobs >= 3),
    )
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const toggleFavorite = (id: number) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)),
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your customer relationships
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{clients.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Clients</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <RefreshCw className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{providerCount}</p>
          <p className="text-[10px] text-muted-foreground">Service Providers</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">
            KES{" "}
            {(clients.reduce((a, c) => a + c.totalSpent, 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">
            {(
              clients.reduce((a, c) => a + c.avgRating, 0) / clients.length
            ).toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground">Avg Rating</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="pl-9 rounded-xl bg-card border-border"
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "Favorites", "Repeat"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-2">
        {filtered.map((client) => (
          <Card
            key={client.id}
            className="border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedClient(
                  expandedClient === client.id ? null : client.id,
                )
              }
              className="w-full p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {client.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {client.name}
                    </span>
                    {client.isFavorite && (
                      <Heart className="w-3 h-3 text-red-500 fill-current flex-shrink-0" />
                    )}
                    {client.totalJobs >= 3 && (
                      <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                        Repeat
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {client.location}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    KES {client.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {client.totalJobs} jobs
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expandedClient === client.id ? "rotate-90" : ""}`}
                />
              </div>
            </button>
            {expandedClient === client.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Since {client.joinedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    {client.avgRating}
                  </span>
                </div>
                {client.jobs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent Jobs
                    </p>
                    {client.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {job.service}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {job.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">
                            KES {job.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-0.5 justify-end">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-current" />
                            <span className="text-[10px] text-muted-foreground">
                              {job.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFavorite(client.id)}
                    className="flex-1 rounded-lg text-xs"
                  >
                    <Heart
                      className={`w-3 h-3 mr-1 ${client.isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {client.isFavorite ? "Unfavorite" : "Favorite"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      alert(`Open message dialog for ${client.name}`)
                    }
                    className="flex-1 rounded-lg text-xs"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => alert(`Initiate call with ${client.name}`)}
                    className="flex-1 rounded-lg text-xs"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
