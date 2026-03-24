const { PrismaClient } = require("@prisma/client");
const { scryptSync, timingSafeEqual } = require("crypto");

const prisma = new PrismaClient();

function verifyPassword(password, encodedHash) {
  const [salt, stored] = String(encodedHash || "").split(":");
  if (!salt || !stored) return false;
  const computed = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(stored, "hex");
  if (computed.length !== storedBuffer.length) return false;
  return timingSafeEqual(computed, storedBuffer);
}

(async () => {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["sub-admin", "subadmin", "secretary", "agent"] },
      deletedAt: null,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      isSuspended: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log("TEAM_USER_COUNT:", users.length);
  for (const user of users) {
    const testPwd = "SubAdmin@12345";
    const verify = user.passwordHash ? verifyPassword(testPwd, user.passwordHash) : false;
    console.log({
      id: user.id,
      email: user.email,
      role: user.role,
      isSuspended: user.isSuspended,
      hasPasswordHash: Boolean(user.passwordHash),
      matchesSubAdmin12345: verify,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
