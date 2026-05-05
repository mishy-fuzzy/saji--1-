import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/server/password'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database - CLEAN SLATE MODE...')
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'

  // Clean tables in FK-safe order.
  await prisma.liveSession.deleteMany()
  await prisma.shopOperationalStatus.deleteMany()
  await prisma.serviceCategoryMeta.deleteMany()
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
  await prisma.virtualGift.deleteMany()
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

  // 2. Seed Virtual Gifts
  const gifts = [
    { name: 'Thumbs Up', icon: '👍', price: 10 },
    { name: 'Clap', icon: '👏', price: 20 },
    { name: 'Heart', icon: '❤️', price: 50 },
    { name: 'Fire', icon: '🔥', price: 100 },
    { name: 'Star', icon: '⭐', price: 200 },
    { name: 'Diamond', icon: '💎', price: 500 },
    { name: 'Crown', icon: '👑', price: 1000 },
    { name: 'Rocket', icon: '🚀', price: 2000 },
  ]

  for (const gift of gifts) {
    await prisma.virtualGift.create({
      data: {
        ...gift,
        isActive: true,
      },
    })
  }

  console.log('Seeding completed: Admin user and 8 virtual gifts created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
