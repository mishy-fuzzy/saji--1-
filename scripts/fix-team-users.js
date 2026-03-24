const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

(async () => {
  const subAdminPassword = "SubAdmin@12345";
  const teamPassword = "Team@12345";

  const subadmin = await prisma.user.upsert({
    where: { email: "subadmin@saji.app" },
    update: {
      role: "subadmin",
      deletedAt: null,
      isSuspended: false,
      passwordHash: hashPassword(subAdminPassword),
      name: "Sam Subadmin",
      phone: "+254700000250",
    },
    create: {
      email: "subadmin@saji.app",
      role: "subadmin",
      deletedAt: null,
      isSuspended: false,
      passwordHash: hashPassword(subAdminPassword),
      name: "Sam Subadmin",
      phone: "+254700000250",
    },
    select: { id: true, email: true, role: true },
  });

  const agent = await prisma.user.updateMany({
    where: { email: "agent@saji.app", deletedAt: null },
    data: { passwordHash: hashPassword(teamPassword), isSuspended: false },
  });

  const secretary = await prisma.user.updateMany({
    where: { email: "secretary@saji.app", deletedAt: null },
    data: { passwordHash: hashPassword(teamPassword), isSuspended: false },
  });

  console.log("SUBADMIN_READY=", subadmin.email, subadmin.role);
  console.log("SUBADMIN_PASSWORD=", subAdminPassword);
  console.log("AGENT_UPDATED=", agent.count);
  console.log("SECRETARY_UPDATED=", secretary.count);
  console.log("TEAM_PASSWORD=", teamPassword);

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
