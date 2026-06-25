import { type GuildBan } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleGuildBanRemove(ban: GuildBan) {
  await sendLog(
    ban.guild,
    "#faa61a",
    "🔓 Member Unbanned",
    [
      { name: "User", value: `${ban.user.tag} (<@${ban.user.id}>)`, inline: true },
      { name: "ID", value: ban.user.id, inline: true },
    ],
  );
}
