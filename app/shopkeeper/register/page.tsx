"use client"

import React from "react"

import { useEffect, useState } from "react"
import { 
  Store, ChevronRight, ChevronLeft, Upload, MapPin, Phone, Mail, User, Building2,
  FileText, Camera, CheckCircle2, Clock, AlertCircle, Eye, EyeOff
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"

export default function ShopkeeperRegistrationPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, login } = useAuthContext()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Shop Info
    shopName: "",
    shopCategory: "",
    shopDescription: "",
    shopLogo: null as string | null,
    // Location
    county: "",
    town: "",
    streetAddress: "",
    buildingName: "",
    // Documents
    idNumber: "",
    idFront: null as string | null,
    idBack: null as string | null,
    businessPermit: null as string | null,
    kraPIN: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [counties, setCounties] = useState<string[]>([])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/auth/login?role=shopkeeper&next=/shopkeeper/register")
      return
    }

    const role = String(user.role || "").toLowerCase()
    if (role !== "shopkeeper") {
      router.replace("/")
      return
    }

    if (user.shopkeeperRegistrationComplete) {
      router.replace("/shopkeeper")
      return
    }

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || String(user.name || ""),
      email: prev.email || String(user.email || ""),
      phone: prev.phone || String(user.phone || ""),
    }))
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch("/api/shopkeeper/register-options", {
          cache: "no-store",
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || !payload?.data) return

        setCategories(
          Array.isArray(payload.data.categories)
            ? payload.data.categories.map((item: unknown) => String(item)).filter(Boolean)
            : [],
        )
        setCounties(
          Array.isArray(payload.data.counties)
            ? payload.data.counties.map((item: unknown) => String(item)).filter(Boolean)
            : [],
        )
      } catch {
        setCategories([])
        setCounties([])
      }
    }

    loadOptions()
  }, [])

  const handleImageUpload = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!isStepValid()) {
      alert("Please complete all required fields on this step")
      return
    }

    if (step < 4) {
      setStep(step + 1)
      return
    }

    // Final submission - call the protected registration API
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/shopkeeper/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          shopName: formData.shopName,
          shopCategory: formData.shopCategory,
          shopDescription: formData.shopDescription,
          county: formData.county,
          town: formData.town,
          streetAddress: formData.streetAddress,
          buildingName: formData.buildingName,
          idNumber: formData.idNumber,
          kraPIN: formData.kraPIN,
          idFront: formData.idFront,
          idBack: formData.idBack,
          businessPermit: formData.businessPermit,
          shopLogo: formData.shopLogo,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Registration failed")
      }

      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" })
        const mePayload = await meResponse.json()
        if (meResponse.ok && mePayload?.ok && mePayload?.data) {
          login(mePayload.data)
        }
      } catch {
        // Continue even if auth sync fails, registration has already been saved.
      }

      setIsSubmitting(false)
      setSubmitted(true)
    } catch (error) {
      setIsSubmitting(false)
      alert(error instanceof Error ? error.message : "Registration failed")
    }
  }

  if (isLoading || !isAuthenticated || !user || String(user.role || "").toLowerCase() !== "shopkeeper") {
    return <LoadingScreen />
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phone && formData.password && formData.password === formData.confirmPassword
      case 2:
        return formData.shopName && formData.shopCategory && formData.shopDescription
      case 3:
        return formData.county && formData.town && formData.streetAddress
      case 4:
        return formData.idNumber && formData.idFront && formData.idBack
      default:
        return false
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-xl">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Application Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Your shop registration is under review. Our team will verify your documents and notify you within 24-48 hours.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-amber-900 dark:text-amber-200 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
              <li className="flex items-start gap-2">
                <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                Document verification (1-2 business days)
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                You'll receive an email with your approval status
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                Once approved, you can start listing products
              </li>
            </ul>
          </div>
          <Link href="/">
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-amber-100 hover:text-white mb-4 text-sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Register Your Shop</h1>
              <p className="text-amber-100 text-sm">Join SAJI Marketplace and reach thousands of customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <Card className="p-4 mb-6 shadow-lg border-0">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Shop Details" },
              { num: 3, label: "Location" },
              { num: 4, label: "Documents" }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center ${idx > 0 ? 'ml-2' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step > s.num 
                      ? 'bg-green-500 text-white' 
                      : step === s.num 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${step >= s.num ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`h-1 w-8 sm:w-16 mx-2 rounded-full ${step > s.num ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Form Steps */}
        <Card className="p-6 shadow-lg border-0 mb-8">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>

              <div>
                <Label>Full Name *</Label>
                <Input 
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Email Address *</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0712 345 678"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative mt-1.5">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a strong password"
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Confirm Password *</Label>
                <Input 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  className="mt-1.5"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Shop Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Shop Details</h2>
                <p className="text-sm text-muted-foreground">Tell us about your business</p>
              </div>

              <div>
                <Label>Shop Name *</Label>
                <Input 
                  value={formData.shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  placeholder="Enter your shop name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Shop Category *</Label>
                <select 
                  value={formData.shopCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopCategory: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Shop Description *</Label>
                <Textarea 
                  value={formData.shopDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopDescription: e.target.value }))}
                  placeholder="Describe your shop, products, and what makes you unique..."
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <div>
                <Label>Shop Logo</Label>
                <div className="mt-1.5">
                  {formData.shopLogo ? (
                    <div className="relative w-32 h-32">
                      <Image 
                        src={formData.shopLogo || "/placeholder.svg"} 
                        alt="Shop logo"
                        fill
                        className="object-cover rounded-xl"
                      />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, shopLogo: null }))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload('shopLogo')} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Shop Location</h2>
                <p className="text-sm text-muted-foreground">Where is your shop located?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>County *</Label>
                  <select 
                    value={formData.county}
                    onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                    className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="">Select county</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Town/Area *</Label>
                  <Input 
                    value={formData.town}
                    onChange={(e) => setFormData(prev => ({ ...prev, town: e.target.value }))}
                    placeholder="e.g., Westlands"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Street Address *</Label>
                <Input 
                  value={formData.streetAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                  placeholder="Enter street name and number"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Building/Mall Name (Optional)</Label>
                <Input 
                  value={formData.buildingName}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildingName: e.target.value }))}
                  placeholder="e.g., Sarit Centre, Floor 2"
                  className="mt-1.5"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">Location Verification</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    We may verify your location to ensure customers can find your shop easily.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Verification Documents</h2>
                <p className="text-sm text-muted-foreground">Upload required documents for verification</p>
              </div>

              <div>
                <Label>National ID Number *</Label>
                <Input 
                  value={formData.idNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Enter your ID number"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>ID Card Photos *</Label>
                <div className="grid grid-cols-2 gap-4 mt-1.5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Front Side</p>
                    {formData.idFront ? (
                      <div className="relative aspect-[3/2]">
                        <Image 
                          src={formData.idFront || "/placeholder.svg"} 
                          alt="ID Front"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, idFront: null }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[3/2] border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload Front</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload('idFront')} />
                      </label>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Back Side</p>
                    {formData.idBack ? (
                      <div className="relative aspect-[3/2]">
                        <Image 
                          src={formData.idBack || "/placeholder.svg"} 
                          alt="ID Back"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, idBack: null }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[3/2] border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload Back</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload('idBack')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>KRA PIN (Optional)</Label>
                <Input 
                  value={formData.kraPIN}
                  onChange={(e) => setFormData(prev => ({ ...prev, kraPIN: e.target.value }))}
                  placeholder="Enter your KRA PIN"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Business Permit (Optional)</Label>
                <div className="mt-1.5">
                  {formData.businessPermit ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-200 text-sm">Document uploaded</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Click to replace</p>
                      </div>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, businessPermit: null }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload business permit (PDF or Image)</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleImageUpload('businessPermit')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Important</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    All documents will be securely stored and only used for verification purposes. Your information is protected.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </Card>

        {/* Benefits Section */}
        <Card className="p-6 mb-8 border-0 shadow-sm bg-gradient-to-br from-amber-600 to-orange-600 text-white">
          <h3 className="font-bold text-lg mb-4">Why sell on SAJI?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-200 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Reach Local Customers</p>
                <p className="text-xs text-amber-100">Connect with buyers in your area</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-200 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Endorse Specialists</p>
                <p className="text-xs text-amber-100">Build trust with service providers</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-200 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Easy Management</p>
                <p className="text-xs text-amber-100">Simple tools to manage your shop</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-200 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Payments</p>
                <p className="text-xs text-amber-100">Get paid safely via M-Pesa</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
