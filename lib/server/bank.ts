interface BankAccountConfig {
  bankName: string
  accountName: string
  accountNumber: string
  swiftCode?: string
}

export interface BankTransferRequest {
  amount: number
  currency?: string
  payerName: string
  payerPhone?: string
  payerEmail?: string
  reference: string
}

function getDefaultBankAccount(): BankAccountConfig {
  return {
    bankName: process.env.BANK_DEFAULT_NAME || "KCB Bank Kenya",
    accountName: process.env.BANK_DEFAULT_ACCOUNT_NAME || "SAJI LIMITED",
    accountNumber: process.env.BANK_DEFAULT_ACCOUNT_NUMBER || "000123456789",
    swiftCode: process.env.BANK_DEFAULT_SWIFT || "KCBLKENX",
  }
}

export async function initiateBankTransfer(request: BankTransferRequest) {
  if (!request.payerName.trim()) {
    throw new Error("payerName is required")
  }

  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    throw new Error("amount must be greater than 0")
  }

  const amount = Math.round(request.amount)
  const currency = request.currency || "KES"
  const account = getDefaultBankAccount()
  const transferReference = `BNK-${Date.now()}`

  return {
    status: "PENDING",
    transferReference,
    amount,
    currency,
    reference: request.reference,
    bank: account,
    instructions: [
      `Transfer ${currency} ${amount} to ${account.bankName}`,
      `Use account number ${account.accountNumber}`,
      `Set transfer narration/reference as ${transferReference}`,
      "Upload proof of payment after transfer for verification",
    ],
  }
}
