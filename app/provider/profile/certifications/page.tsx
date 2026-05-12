"use client"

import { useEffect, useState } from "react"
import { Award, Upload, Check, Clock, X, Plus, FileText, Shield, Star, AlertCircle, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuthContext } from "@/lib/auth-context"

type Certification = {
  id: string; name: string; issuer: string; dateIssued: string; expiryDate: string
  status: "verified" | "pending" | "expired"; category: string; documentUrl?: string
}

export default function CertificationsPage() {
  const { user } = useAuthContext()
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newCert, setNewCert] = useState({ name: "", issuer: "", dateIssued: "", expiryDate: "", category: "Plumbing" })
  const [isSaving, setIsSaving] = useState(false)

  const statusConfig: Record<string, { color: string; label: string; icon: typeof Check }> = {
    verified: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Verified", icon: Check },
    pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Under Review", icon: Clock },
    expired: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Expired", icon: AlertCircle },
  }

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadCertifications = async () => {
      try {
        const response = await fetch("/api/provider/certifications", { cache: "no-store" })
        const payload = await response.json()
        if (cancelled) return

        if (response.ok && payload?.ok && Array.isArray(payload?.data)) {
          setCertifications(payload.data as Certification[])
          return
        }

        setCertifications([])
      } catch {
        if (!cancelled) {
          setCertifications([])
        }
      }
    }

    loadCertifications()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const addCert = async () => {
    if (!newCert.name.trim() || !newCert.issuer.trim() || isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/provider/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCert.name.trim(),
          issuer: newCert.issuer.trim(),
          dateIssued: newCert.dateIssued,
          expiryDate: newCert.expiryDate,
          category: newCert.category,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to add certification")
      }

      setCertifications((prev) => [payload.data as Certification, ...prev])
      setShowAdd(false)
      setNewCert({ name: "", issuer: "", dateIssued: "", expiryDate: "", category: "Plumbing" })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add certification")
    } finally {
      setIsSaving(false)
    }
  }

  const removeCert = async (id: string) => {
    try {
      const response = await fetch(`/api/provider/certifications/${encodeURIComponent(id)}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to remove certification")
      }

      setCertifications(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove certification")
    }
  }

  const verifiedCount = certifications.filter(c => c.status === "verified").length

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certifications & Badges</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload professional certifications to build trust with clients</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add Certification</Button>
      </div>

      {/* Trust Score */}
      <Card className="p-4 border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Trust Score</h3>
            <p className="text-xs text-muted-foreground mb-2">{verifiedCount} of {certifications.length} certifications verified</p>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(verifiedCount / Math.max(certifications.length, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{Math.round((verifiedCount / Math.max(certifications.length, 1)) * 100)}%</p>
          </div>
        </div>
      </Card>

      {/* Badges earned */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Earned Badges</h3>
        <div className="flex flex-wrap gap-2">
          {verifiedCount >= 1 && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium"><Award className="w-3.5 h-3.5" />Certified Pro</div>
          )}
          {verifiedCount >= 2 && (
            <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-xs font-medium"><Star className="w-3.5 h-3.5" />Multi-Skilled</div>
          )}
          {verifiedCount >= 3 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full text-xs font-medium"><Shield className="w-3.5 h-3.5" />Trusted Expert</div>
          )}
          {verifiedCount < 1 && <p className="text-xs text-muted-foreground">Complete your first certification to earn badges</p>}
        </div>
      </div>

      {/* Certifications List */}
      <div className="space-y-2">
        {certifications.length === 0 ? (
          <Card className="p-4 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground">No certifications submitted yet.</p>
          </Card>
        ) : (
          certifications.map(cert => {
            const config = statusConfig[cert.status]
            const StatusIcon = config.icon
            return (
              <Card key={cert.id} className="p-4 border border-border rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{cert.name}</h4>
                      <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Issued: {cert.dateIssued}</span>
                        <span>Expires: {cert.expiryDate}</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded-full">{cert.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />{config.label}
                    </span>
                    <button onClick={() => removeCert(cert.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors"><X className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md rounded-xl" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Add Certification</h2>
            <Input value={newCert.name} onChange={(e) => setNewCert(p => ({ ...p, name: e.target.value }))} placeholder="Certification name" className="rounded-lg bg-card border-border" />
            <Input value={newCert.issuer} onChange={(e) => setNewCert(p => ({ ...p, issuer: e.target.value }))} placeholder="Issuing body" className="rounded-lg bg-card border-border" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Date Issued</label><Input type="date" value={newCert.dateIssued} onChange={(e) => setNewCert(p => ({ ...p, dateIssued: e.target.value }))} className="rounded-lg bg-card border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label><Input type="date" value={newCert.expiryDate} onChange={(e) => setNewCert(p => ({ ...p, expiryDate: e.target.value }))} className="rounded-lg bg-card border-border" /></div>
            </div>
            <select value={newCert.category} onChange={(e) => setNewCert(p => ({ ...p, category: e.target.value }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
              <option>Plumbing</option><option>Electrical</option><option>Building</option><option>Safety</option><option>Carpentry</option><option>Other</option>
            </select>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Upload certificate document (PDF/Image)</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={addCert} disabled={!newCert.name.trim() || !newCert.issuer.trim() || isSaving} className="flex-1 rounded-xl">Submit for Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
