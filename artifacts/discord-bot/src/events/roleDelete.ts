import { type Role } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleRoleDelete(role: Role) {
  await sendLog(
    role.guild,
    "#f04747",
    "🎭 Role Deleted",
    [
      { name: "Name", value: role.name, inline: true },
      { name: "ID", value: role.id, inline: true },
      { name: "Color", value: role.hexColor, inline: true },
    ],
  );
}
