import { PrismaClient } from '@prisma/client'
const prisma: any = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean tables in FK-safe order for deterministic seeding.
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

  // 1. Create users across all major roles.
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Michele Admin',
        email: 'admin@saji.app',
        role: 'admin',
        phone: '+254700000100',
      },
    }),
    prisma.user.create({
      data: {
        name: 'John Maina',
        email: 'john.maina@example.com',
        role: 'provider',
        phone: '+254700000001',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Grace Achieng',
        email: 'grace.achieng@example.com',
        role: 'provider',
        phone: '+254700000003',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Alice Wambui',
        email: 'alice.w@example.com',
        role: 'customer',
        phone: '+254700000002',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kevin Otieno',
        email: 'kevin.otieno@example.com',
        role: 'customer',
        phone: '+254700000004',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sally Agent',
        email: 'agent@saji.app',
        role: 'agent',
        phone: '+254700000200',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Nina Secretary',
        email: 'secretary@saji.app',
        role: 'secretary',
        phone: '+254700000300',
      },
    }),
  ])

  const admin = users[0]
  const providerJohn = users[1]
  const providerGrace = users[2]
  const customerAlice = users[3]
  const customerKevin = users[4]
  const agentSally = users[5]
  const secretaryNina = users[6]

  // 1b. Role-specific profile tables.
  await prisma.admin.create({ data: { userId: admin.id } })
  await prisma.serviceProvider.createMany({
    data: [{ userId: providerJohn.id }, { userId: providerGrace.id }],
  })
  await prisma.customer.createMany({
    data: [{ userId: customerAlice.id }, { userId: customerKevin.id }],
  })
  await prisma.agent.create({ data: { userId: agentSally.id } })
  await prisma.secretary.create({ data: { userId: secretaryNina.id } })

  // 2. Wallets.
  await prisma.wallet.createMany({
    data: [
      { userId: providerJohn.id, balance: 12450.5, currency: 'KES' },
      { userId: providerGrace.id, balance: 8450, currency: 'KES' },
      { userId: customerAlice.id, balance: 2100, currency: 'KES' },
      { userId: customerKevin.id, balance: 980, currency: 'KES' },
    ],
  })

  // 3. Services.
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Professional Electrical Installation',
        category: 'Electrical',
        description: 'Full house wiring and appliance installation with certificate of completion.',
        basePrice: 5000,
        providerId: providerJohn.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Emergency Plumbing Fix',
        category: 'Plumbing',
        description: '24/7 emergency plumbing services for leaks, bursts, and blockages.',
        basePrice: 3500,
        providerId: providerJohn.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Deep Home Cleaning',
        category: 'Cleaning',
        description: 'Comprehensive cleaning including carpets, windows, and kitchen sanitization.',
        basePrice: 2500,
        providerId: providerGrace.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'CCTV Installation',
        category: 'Security',
        description: 'Supply and installation of home and office surveillance systems.',
        basePrice: 12000,
        providerId: providerGrace.id,
      },
    }),
  ])

  // 4. Bookings across lifecycle states.
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        customerId: customerAlice.id,
        providerId: providerJohn.id,
        serviceId: services[0].id,
        amount: 5000,
        currency: 'KES',
        status: 'pending',
      },
    }),
    prisma.booking.create({
      data: {
        customerId: customerKevin.id,
        providerId: providerJohn.id,
        serviceId: services[1].id,
        amount: 3500,
        currency: 'KES',
        status: 'active',
      },
    }),
    prisma.booking.create({
      data: {
        customerId: customerAlice.id,
        providerId: providerGrace.id,
        serviceId: services[2].id,
        amount: 2500,
        currency: 'KES',
        status: 'completed',
      },
    }),
  ])

  // 5. Payment transactions linked to bookings.
  await prisma.paymentTransaction.createMany({
    data: [
      {
        provider: 'mpesa',
        kind: 'stkpush',
        reference: 'BO-PENDING-001',
        externalId: 'ws_CO_123',
        amount: 5000,
        currency: 'KES',
        status: 'PENDING',
        bookingId: bookings[0].id,
        request: JSON.stringify({ phone: '254700000002' }),
      },
      {
        provider: 'mpesa',
        kind: 'stkpush',
        reference: 'BO-ACTIVE-002',
        externalId: 'ws_CO_456',
        amount: 3500,
        currency: 'KES',
        status: 'SUCCESS',
        bookingId: bookings[1].id,
        response: JSON.stringify({ mpesaReceipt: 'QWE123XYZ' }),
      },
      {
        provider: 'paypal',
        kind: 'order',
        reference: 'BO-COMPLETE-003',
        externalId: 'PAYPAL_789',
        amount: 2500,
        currency: 'KES',
        status: 'SUCCESS',
        bookingId: bookings[2].id,
      },
    ],
  })

  // 6. Messages between customers and providers.
  await prisma.message.createMany({
    data: [
      {
        text: 'Hi John, can you come by tomorrow morning?',
        senderId: customerAlice.id,
        receiverId: providerJohn.id,
      },
      {
        text: 'Yes, I can be there by 9:00 AM.',
        senderId: providerJohn.id,
        receiverId: customerAlice.id,
      },
      {
        text: 'The sink is leaking again, please help.',
        senderId: customerKevin.id,
        receiverId: providerJohn.id,
      },
      {
        text: 'I am on my way and will fix it today.',
        senderId: providerJohn.id,
        receiverId: customerKevin.id,
      },
    ],
  })

  // 7. Referrals.
  await prisma.referral.create({
    data: {
      referrerId: customerAlice.id,
      referredId: customerKevin.id,
      status: 'completed',
      reward: 300,
    },
  })

  // 8. Notification and authentication logs.
  await prisma.notificationLog.createMany({
    data: [
      {
        provider: 'africastalking',
        channel: 'sms',
        recipient: '+254700000002',
        message: 'Your booking request has been sent to provider.',
        status: 'SENT',
      },
      {
        provider: 'email',
        channel: 'email',
        recipient: 'john.maina@example.com',
        message: 'New job request received.',
        status: 'SENT',
      },
    ],
  })

  await prisma.authLog.createMany({
    data: [
      {
        provider: 'local',
        mode: 'password',
        email: 'alice.w@example.com',
        status: 'SUCCESS',
      },
      {
        provider: 'google',
        mode: 'oauth',
        email: 'admin@saji.app',
        status: 'SUCCESS',
      },
      {
        provider: 'local',
        mode: 'password',
        email: 'kevin.otieno@example.com',
        status: 'FAILED',
        error: 'Invalid credentials',
      },
    ],
  })

  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    agents: await prisma.agent.count(),
    secretaries: await prisma.secretary.count(),
    serviceProviders: await prisma.serviceProvider.count(),
    admins: await prisma.admin.count(),
    services: await prisma.service.count(),
    bookings: await prisma.booking.count(),
    payments: await prisma.paymentTransaction.count(),
    wallets: await prisma.wallet.count(),
    messages: await prisma.message.count(),
    referrals: await prisma.referral.count(),
    notifications: await prisma.notificationLog.count(),
    authLogs: await prisma.authLog.count(),
  }

  console.log('Seeding finished!')
  console.log('Record counts:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
