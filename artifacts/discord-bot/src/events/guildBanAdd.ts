import { type GuildBan } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleGuildBanAdd(ban: GuildBan) {
  await sendLog(
    ban.guild,
    "#ff0000",
    "🔨 Member Banned",
    [
      { name: "User", value: `${ban.user.tag} (<@${ban.user.id}>)`, inline: true },
      { name: "ID", value: ban.user.id, inline: true },
      { name: "Reason", value: ban.reason ?? "No reason provided" },
    ],
  );
}
