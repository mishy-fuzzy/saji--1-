const { PrismaClient } = require("@prisma/client");
const { scryptSync, timingSafeEqual } = require("crypto");

const prisma = new PrismaClient();

function verifyPassword(password, encodedHash) {
  const [salt, stored] = String(encodedHash || "").split(":");
  if (!salt || !stored) {
    return false;
  }

  const computed = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(stored, "hex");

  if (computed.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computed, storedBuffer);
}

(async () => {
  const checks = [
    { role: "secretary", password: "Secretary@12345" },
    { role: "agent", password: "Agent@12345" },
    { role: "customer", password: "Customer@12345" },
  ];

  for (const check of checks) {
    const users = await prisma.user.findMany({
      where: { role: check.role, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        email: true,
        role: true,
        isSuspended: true,
        passwordHash: true,
      },
    });

    console.log(`VERIFY_ROLE=${check.role} COUNT=${users.length}`);
    for (const user of users) {
      const ok = user.passwordHash ? verifyPassword(check.password, user.passwordHash) : false;
      console.log(JSON.stringify({
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        hasPasswordHash: Boolean(user.passwordHash),
        passwordMatches: ok,
      }));
    }
  }

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
