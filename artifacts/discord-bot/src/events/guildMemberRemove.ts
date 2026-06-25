import { type GuildMember, type PartialGuildMember } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  const roles = member.roles.cache
    .filter((r) => r.name !== "@everyone")
    .map((r) => r.toString())
    .join(", ") || "None";

  await sendLog(
    member.guild,
    "#f04747",
    "🚪 Member Left",
    [
      { name: "User", value: member.user ? `${member.user.tag} (<@${member.id}>)` : `<@${member.id}>`, inline: true },
      { name: "ID", value: member.id, inline: true },
      { name: "Roles", value: roles },
    ],
  );
}
