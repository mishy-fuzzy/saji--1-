import { db } from "@/lib/server/db";

const prismaDb: any = db;

type UserWithStats = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isSuspended: boolean;
  emailVerified: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  bookings: Array<{ amount: number; status: string }>;
  jobs: Array<{ amount: number; status: string }>;
};

function toTitleCase(value: string): string {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatJoinedDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function mapUser(user: UserWithStats) {
  const isIncoming = !user.emailVerified;

  const completedJobs = user.jobs.filter(
    (job) => String(job.status).toLowerCase() === "completed",
  );
  const earnings = completedJobs.reduce(
    (sum, job) => sum + Number(job.amount || 0),
    0,
  );

  const orders =
    user.role === "provider" ? user.jobs.length : user.bookings.length;
  const disputes = [...user.bookings, ...user.jobs].filter(
    (entry) => String(entry.status).toLowerCase() === "cancelled",
  ).length;

  const type = user.deletedAt
    ? "deactivated"
    : disputes > 0
      ? "disputed"
      : isIncoming
        ? "incoming"
        : orders > 0
          ? "completed"
          : "active";

  const status = user.deletedAt
    ? "Deactivated"
    : user.isSuspended
      ? "Suspended"
      : disputes > 0
        ? "Disputed"
        : isIncoming
          ? "Pending"
          : "Active";

  return {
    id: user.id,
    name: user.name || "Unnamed User",
    email: user.email,
    phone: user.phone || "-",
    role: toTitleCase(user.role),
    status,
    earnings,
    joined: formatJoinedDate(new Date(user.createdAt)),
    orders,
    disputes,
    type,
  };
}

export async function fetchMappedUsers(
  roleFilter?: string[],
  includeDeleted = false,
) {
  const whereBase = includeDeleted ? {} : { deletedAt: null };

  const where =
    roleFilter && roleFilter.length > 0
      ? {
          ...whereBase,
          role: { in: roleFilter },
        }
      : whereBase;

  const users = await prismaDb.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isSuspended: true,
      emailVerified: true,
      deletedAt: true,
      createdAt: true,
      bookings: {
        select: {
          amount: true,
          status: true,
        },
      },
      jobs: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  });

  return users.map((user: UserWithStats) => mapUser(user));
}
