import { db } from "@workspace/db";
import { guildConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { GuildConfig, InsertGuildConfig } from "@workspace/db";

export async function getGuildConfig(guildId: string): Promise<GuildConfig | null> {
  const rows = await db
    .select()
    .from(guildConfigsTable)
    .where(eq(guildConfigsTable.guildId, guildId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertGuildConfig(data: InsertGuildConfig): Promise<GuildConfig> {
  const rows = await db
    .insert(guildConfigsTable)
    .values(data)
    .onConflictDoUpdate({
      target: guildConfigsTable.guildId,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();
  return rows[0]!;
}
