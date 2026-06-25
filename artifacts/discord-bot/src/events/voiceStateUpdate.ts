import { type VoiceState } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const member = newState.member ?? oldState.member;
  if (!member) return;
  if (member.user.bot) return;

  const guild = newState.guild;
  const userField = { name: "User", value: `<@${member.id}> (${member.user.tag})`, inline: true };

  // Joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    await sendLog(guild, "#43b581", "🔊 Joined Voice Channel", [
      userField,
      { name: "Channel", value: newState.channel!.toString(), inline: true },
    ]);
    return;
  }

  // Left a voice channel
  if (oldState.channelId && !newState.channelId) {
    await sendLog(guild, "#f04747", "🔇 Left Voice Channel", [
      userField,
      { name: "Channel", value: oldState.channel!.toString(), inline: true },
    ]);
    return;
  }

  // Moved between channels
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    await sendLog(guild, "#7289da", "🔁 Moved Voice Channel", [
      userField,
      { name: "From", value: oldState.channel!.toString(), inline: true },
      { name: "To", value: newState.channel!.toString(), inline: true },
    ]);
    return;
  }

  // Muted / unmuted by moderator
  if (!oldState.serverMute && newState.serverMute) {
    await sendLog(guild, "#faa61a", "🔕 Server Muted", [userField]);
  } else if (oldState.serverMute && !newState.serverMute) {
    await sendLog(guild, "#43b581", "🔔 Server Unmuted", [userField]);
  }

  // Deafened / undeafened by moderator
  if (!oldState.serverDeaf && newState.serverDeaf) {
    await sendLog(guild, "#faa61a", "🙉 Server Deafened", [userField]);
  } else if (oldState.serverDeaf && !newState.serverDeaf) {
    await sendLog(guild, "#43b581", "👂 Server Undeafened", [userField]);
  }
}
