const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function updateRolePasswords(role, password) {
  const users = await prisma.user.findMany({
    where: { role, deletedAt: null },
    select: { id: true, email: true, role: true },
  });

  if (users.length === 0) {
    return { role, password, updated: 0, emails: [] };
  }

  let updated = 0;
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        isSuspended: false,
      },
    });
    updated += 1;
  }

  return {
    role,
    password,
    updated,
    emails: users.map((u) => u.email),
  };
}

(async () => {
  const rolePasswordMap = [
    { role: "secretary", password: "Secretary@12345" },
    { role: "agent", password: "Agent@12345" },
    { role: "customer", password: "Customer@12345" },
  ];

  const results = [];
  for (const item of rolePasswordMap) {
    results.push(await updateRolePasswords(item.role, item.password));
  }

  console.log("ROLE_PASSWORDS_UPDATED");
  for (const result of results) {
    console.log(JSON.stringify(result));
  }

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
