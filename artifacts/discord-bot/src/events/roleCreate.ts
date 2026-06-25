import { type Role } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleRoleCreate(role: Role) {
  await sendLog(
    role.guild,
    "#43b581",
    "🎭 Role Created",
    [
      { name: "Name", value: role.name, inline: true },
      { name: "ID", value: role.id, inline: true },
      { name: "Color", value: role.hexColor, inline: true },
      { name: "Mentionable", value: String(role.mentionable), inline: true },
      { name: "Hoisted", value: String(role.hoist), inline: true },
    ],
  );
}
