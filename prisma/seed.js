const { PrismaClient } = require("@prisma/client")
const { hash } = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "Owner@123"
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || "Admin@123"

  const ownerPasswordHash = await hash(ownerPassword, 12)
  const adminPasswordHash = await hash(adminPassword, 12)

  const users = [
    {
      name: "System Owner",
      email: "owner@saji.local",
      phone: "+254700000001",
      role: "admin",
      passwordHash: ownerPasswordHash,
    },
    {
      name: "Super Admin",
      email: "admin@gmail.com",
      phone: "+254700000002",
      role: "admin",
      passwordHash: adminPasswordHash,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        phone: user.phone,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      create: user,
    })
  }

  console.log("Seeded owner and super-admin users with hashed passwords")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
