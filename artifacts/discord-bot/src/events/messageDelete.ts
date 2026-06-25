import { type Message, type PartialMessage } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleMessageDelete(message: Message | PartialMessage) {
  if (!message.guild) return;
  if (message.author?.bot) return;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "Author",
      value: message.author ? `<@${message.author.id}> (${message.author.tag})` : "Unknown",
      inline: true,
    },
    {
      name: "Channel",
      value: message.channel.toString(),
      inline: true,
    },
  ];

  if (message.content) {
    fields.push({
      name: "Content",
      value: message.content.slice(0, 1020) || "*(empty)*",
    });
  }

  if (message.attachments.size > 0) {
    fields.push({
      name: "Attachments",
      value: message.attachments.map((a) => a.url).join("\n").slice(0, 1020),
    });
  }

  await sendLog(message.guild, "#f04747", "🗑️ Message Deleted", fields);
}
