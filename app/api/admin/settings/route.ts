import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

const DEFAULT_PREFERENCES = {
  platformFee: 5,
  autoApprove: true,
  requireVerification: true,
  enableDisputeResolution: true,
};

const DEFAULT_RULES = [
  {
    id: 1,
    service: "Electrical Installation",
    level: "Skilled",
    jobSize: "Various",
    paymentType: "Deposit + Balance",
    rule: "Pending",
  },
  {
    id: 2,
    service: "Health",
    level: "Skilled",
    jobSize: "-",
    paymentType: "Full Upfront",
    rule: "Active",
  },
  {
    id: 3,
    service: "Car Mechanics",
    level: "Skilled",
    jobSize: "-",
    paymentType: "Upfront",
    rule: "Pending",
  },
  {
    id: 4,
    service: "Psychiatrists",
    level: "Skilled",
    jobSize: "20%",
    paymentType: "Milestones",
    rule: "Active",
  },
  {
    id: 5,
    service: "Gastroenterology",
    level: "Skilled",
    jobSize: "Large",
    paymentType: "Milestones",
    rule: "Active",
  },
  {
    id: 6,
    service: "Appliance Repair",
    level: "Semi-Skilled",
    jobSize: "Remote",
    paymentType: "Higher deposit in remote",
    rule: "Pending",
  },
  {
    id: 7,
    service: "Plumbing Repairs",
    level: "Skilled",
    jobSize: "Small",
    paymentType: "Full Upfront",
    rule: "Pending",
  },
];

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sanitizePreferences(raw: Record<string, unknown>) {
  const platformFee = Number.parseInt(
    String(raw.platformFee ?? DEFAULT_PREFERENCES.platformFee),
    10,
  );
  return {
    platformFee: Number.isFinite(platformFee)
      ? Math.max(1, Math.min(20, platformFee))
      : DEFAULT_PREFERENCES.platformFee,
    autoApprove: Boolean(raw.autoApprove),
    requireVerification: Boolean(raw.requireVerification),
    enableDisputeResolution: Boolean(raw.enableDisputeResolution),
  };
}

function normalizeRule(raw: Record<string, unknown>) {
  return {
    id: Number(raw.id),
    service: String(raw.service || ""),
    level: String(raw.level || ""),
    jobSize: String(raw.jobSize || ""),
    paymentType: String(raw.paymentType || ""),
    rule: String(raw.rule || "Pending") === "Active" ? "Active" : "Pending",
  };
}

async function getPreferences() {
  const latest = await prismaDb.authLog.findFirst({
    where: {
      provider: "system",
      mode: "admin-settings",
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { response: true },
  });

  const payload = safeParse(latest?.response || null);
  if (!payload) return DEFAULT_PREFERENCES;
  return sanitizePreferences(payload);
}

async function getRules() {
  const latest = await prismaDb.authLog.findFirst({
    where: {
      provider: "system",
      mode: "admin-payment-rules",
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { response: true },
  });

  const payload = safeParse(latest?.response || null);
  if (!payload || !Array.isArray(payload.rules)) return DEFAULT_RULES;

  const rules = payload.rules
    .map((item) =>
      item && typeof item === "object"
        ? normalizeRule(item as Record<string, unknown>)
        : null,
    )
    .filter(Boolean);

  return rules.length > 0 ? rules : DEFAULT_RULES;
}

export async function GET(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const [preferences, rules] = await Promise.all([
    getPreferences(),
    getRules(),
  ]);
  return NextResponse.json({ ok: true, data: { preferences, rules } });
}

export async function POST(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json();

  if (body?.preferences && typeof body.preferences === "object") {
    const sanitized = sanitizePreferences(
      body.preferences as Record<string, unknown>,
    );

    await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "admin-settings",
        email: actor.email,
        status: "SUCCESS",
        response: JSON.stringify(sanitized),
      },
    });

    return NextResponse.json({ ok: true, data: { preferences: sanitized } });
  }

  const ruleAction = String(body?.ruleAction || "")
    .trim()
    .toLowerCase();
  if (ruleAction !== "create" && ruleAction !== "update") {
    return NextResponse.json(
      { ok: false, error: "Unsupported settings action" },
      { status: 400 },
    );
  }

  const rules = await getRules();
  const incoming =
    body?.rule && typeof body.rule === "object"
      ? normalizeRule(body.rule as Record<string, unknown>)
      : null;
  if (!incoming) {
    return NextResponse.json(
      { ok: false, error: "Invalid rule payload" },
      { status: 400 },
    );
  }

  let nextRules = [...rules];
  if (ruleAction === "create") {
    const nextId =
      nextRules.reduce((max, rule) => Math.max(max, Number(rule.id) || 0), 0) +
      1;
    nextRules = [{ ...incoming, id: nextId }, ...nextRules];
  } else {
    const index = nextRules.findIndex((rule) => rule.id === incoming.id);
    if (index < 0) {
      return NextResponse.json(
        { ok: false, error: "Rule not found" },
        { status: 404 },
      );
    }
    nextRules[index] = incoming;
  }

  await prismaDb.authLog.create({
    data: {
      provider: "system",
      mode: "admin-payment-rules",
      email: actor.email,
      status: "SUCCESS",
      response: JSON.stringify({ rules: nextRules }),
    },
  });

  const latestRule = ruleAction === "create" ? nextRules[0] : incoming;
  return NextResponse.json({
    ok: true,
    data: { rule: latestRule, rules: nextRules },
  });
}
