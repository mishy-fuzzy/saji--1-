import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/server/password'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database - CLEAN SLATE MODE...')
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'

  // Clean tables in FK-safe order.
  await prisma.paymentTransaction.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.message.deleteMany()
  await prisma.referral.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.secretary.deleteMany()
  await prisma.serviceProvider.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.service.deleteMany()
  await prisma.notificationLog.deleteMany()
  await prisma.authLog.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create ONLY Admin User.
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@saji.app',
      passwordHash: hashPassword(seedAdminPassword),
      role: 'admin',
      phone: '+254700000000',
    },
  })

  // 1b. Role-specific profile table for Admin.
  await prisma.admin.create({ data: { userId: adminUser.id } })

  console.log('Seeding completed. Only admin@saji.app remains.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
