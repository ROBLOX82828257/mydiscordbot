import { type Interaction, PermissionFlagsBits } from "discord.js";
import { commands } from "../commands/index.js";
import { logger } from "../lib/logger.js";

export async function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (!command) return;

  // Require Manage Guild permission for all config commands
  const member = interaction.member;
  if (
    !member ||
    !(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))
  ) {
    await interaction.reply({ content: "You need the **Manage Server** permission to use this command.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command error");
    const msg = { content: "An error occurred while running this command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
