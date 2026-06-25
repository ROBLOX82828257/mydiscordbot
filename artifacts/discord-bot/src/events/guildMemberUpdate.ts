import { type GuildMember, type PartialGuildMember } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
) {
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "User", value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
    { name: "ID", value: newMember.id, inline: true },
  ];

  // Nickname change
  if (oldMember.nickname !== newMember.nickname) {
    fields.push({
      name: "Nickname Changed",
      value: `**Before:** ${oldMember.nickname ?? "None"}\n**After:** ${newMember.nickname ?? "None"}`,
    });
    await sendLog(newMember.guild, "#7289da", "✏️ Nickname Changed", fields);
    return;
  }

  // Roles added/removed
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id) && r.name !== "@everyone");
  const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id) && r.name !== "@everyone");

  if (addedRoles.size > 0) {
    fields.push({
      name: "Roles Added",
      value: addedRoles.map((r) => r.toString()).join(", "),
    });
    await sendLog(newMember.guild, "#43b581", "🏷️ Role Added", fields);
  }

  if (removedRoles.size > 0) {
    const removeFields = [
      { name: "User", value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
      { name: "ID", value: newMember.id, inline: true },
      {
        name: "Roles Removed",
        value: removedRoles.map((r) => r.toString()).join(", "),
      },
    ];
    await sendLog(newMember.guild, "#f04747", "🏷️ Role Removed", removeFields);
  }

  // Timeout
  if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
    fields.push({
      name: "Timed Out Until",
      value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp! / 1000)}:F>`,
    });
    await sendLog(newMember.guild, "#ff7700", "⏰ Member Timed Out", fields);
  } else if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
    await sendLog(newMember.guild, "#43b581", "⏰ Timeout Removed", fields);
  }
}
