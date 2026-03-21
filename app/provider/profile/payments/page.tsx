"use client"

import { ArrowLeft, CreditCard, Plus, Trash2, Edit2, X, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function PaymentMethodsPage() {
  const [payments, setPayments] = useState([
    { id: 1, type: "M-Pesa", number: "0712345678", primary: true, lastFour: "5678" },
    { id: 2, type: "Bank Account", number: "KCB ****5432", primary: false, lastFour: "5432" },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [newMethodType, setNewMethodType] = useState("mpesa")
  const [newMethodDetails, setNewMethodDetails] = useState("")
  const [methodError, setMethodError] = useState("")

  const handleAddMethod = () => {
    setMethodError("")
    
    if (!newMethodDetails.trim()) {
      setMethodError("Please enter payment method details")
      return
    }
    
    const newPayment = {
      id: Math.max(...payments.map(p => p.id), 0) + 1,
      type: newMethodType === "mpesa" ? "M-Pesa" : "Bank Account",
      number: newMethodDetails,
      primary: payments.length === 0,
      lastFour: newMethodDetails.slice(-4)
    }
    
    setPayments([...payments, newPayment])
    setShowAddModal(false)
    setNewMethodDetails("")
    alert("Payment method added successfully!")
  }

  const handleEditMethod = () => {
    setMethodError("")
    
    if (!newMethodDetails.trim()) {
      setMethodError("Please enter payment method details")
      return
    }
    
    setPayments(payments.map(p => 
      p.id === editingPayment.id 
        ? { ...p, number: newMethodDetails, lastFour: newMethodDetails.slice(-4) }
        : p
    ))
    
    setShowEditModal(false)
    setEditingPayment(null)
    setNewMethodDetails("")
    alert("Payment method updated successfully!")
  }

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment)
    setNewMethodDetails(payment.number)
    setShowEditModal(true)
  }

  const removePayment = (id: number) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      setPayments(payments.filter((p) => p.id !== id))
    }
  }

  const setPrimary = (id: number) => {
    setPayments(payments.map(p => ({
      ...p,
      primary: p.id === id
    })))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/provider/profile" className="lg:hidden hover:bg-blue-500/50 p-2 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Payment Methods</h1>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6 py-6">
        {payments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium mb-2">No Payment Methods</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add a payment method to start receiving payouts</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{payment.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{payment.number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {payment.primary ? (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                      Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => setPrimary(payment.id)}
                      className="text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Set as Primary
                    </button>
                  )}

                  <button
                    onClick={() => handleEditClick(payment)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>

                  <button
                    onClick={() => removePayment(payment.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Payment Method Type</label>
              <select
                value={newMethodType}
                onChange={(e) => setNewMethodType(e.target.value)}
                className="w-full p-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Account</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {newMethodType === "mpesa" ? "Phone Number" : "Account Details"}
              </label>
              <Input 
                value={newMethodDetails}
                onChange={(e) => setNewMethodDetails(e.target.value)}
                placeholder={newMethodType === "mpesa" ? "07XX XXX XXX" : "Account number or details"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newMethodType === "mpesa" 
                  ? "Enter your M-Pesa phone number" 
                  : "Enter your bank account details"}
              </p>
            </div>

            {methodError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {methodError}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Method
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Method Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Payment Method Type</label>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded">{editingPayment?.type}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {editingPayment?.type === "M-Pesa" ? "Phone Number" : "Account Details"}
              </label>
              <Input 
                value={newMethodDetails}
                onChange={(e) => setNewMethodDetails(e.target.value)}
                placeholder={editingPayment?.type === "M-Pesa" ? "07XX XXX XXX" : "Account number or details"}
              />
            </div>

            {methodError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {methodError}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPayment(null)
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Update Method
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
