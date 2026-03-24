const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync, timingSafeEqual } = require("crypto");
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, encodedHash) {
  const [salt, stored] = String(encodedHash || "").split(":");
  if (!salt || !stored) return false;
  const computed = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(stored, "hex");
  if (computed.length !== storedBuffer.length) return false;
  return timingSafeEqual(computed, storedBuffer);
}

(async () => {
  const newPassword = "Admin@12345";
  const passwordHash = hashPassword(newPassword);
  const result = await prisma.user.updateMany({
    where: { email: "admin@saji.app", deletedAt: null },
    data: { passwordHash },
  });

  const admin = await prisma.user.findFirst({
    where: { email: "admin@saji.app", deletedAt: null },
    select: { email: true, passwordHash: true, role: true },
  });

  const ok = admin?.passwordHash ? verifyPassword(newPassword, admin.passwordHash) : false;
  console.log(`ADMIN_PASSWORD_UPDATED=${result.count}`);
  console.log(`ADMIN_PASSWORD_VERIFY=${ok}`);
  console.log(`ADMIN_ROLE=${admin?.role || "missing"}`);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
