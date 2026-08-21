import { createServerFn } from "@tanstack/react-start";

export const checkGate = createServerFn({ method: "GET" }).handler(async () => {
  const { gateSession } = await import("./gate.server");
  const session = await gateSession();
  return { unlocked: session.data.unlocked === true };
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { gateSession, passwordMatches } = await import("./gate.server");
    const expected = process.env["SITE_PASSWORD"];
    if (!expected) {
      throw new Error("SITE_PASSWORD is not set");
    }

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }

    const session = await gateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { gateSession } = await import("./gate.server");
  const session = await gateSession();
  await session.clear();
  return { ok: true as const };
});
