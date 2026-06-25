import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { upsertGuildConfig, getGuildConfig } from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("autorole")
  .setDescription("Configure automatic role assignment for new members")
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Set the role to give new members automatically")
      .addRoleOption((opt) =>
        opt
          .setName("role")
          .setDescription("The role to assign on join")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("disable")
      .setDescription("Disable auto role assignment"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("settings")
      .setDescription("Show the current auto role setting"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  if (sub === "set") {
    const role = interaction.options.getRole("role", true);

    // Warn if bot can't assign this role (role is higher than bot's top role)
    const botMember = await interaction.guild!.members.fetchMe();
    const botTopRole = botMember.roles.highest;

    if (role.position >= botTopRole.position) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#f04747")
            .setTitle("❌ Role Too High")
            .setDescription(
              `I can't assign ${role.toString()} because it is at or above my highest role (${botTopRole.toString()}).\n\nMove my role above it in **Server Settings → Roles**, then try again.`,
            ),
        ],
        ephemeral: true,
      });
      return;
    }

    await upsertGuildConfig({ guildId, autoRoleId: role.id });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle("✅ Auto Role Set")
          .setDescription(`New members will automatically receive ${role.toString()} when they join.`),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "disable") {
    await upsertGuildConfig({ guildId, autoRoleId: null });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#f04747")
          .setTitle("🚫 Auto Role Disabled")
          .setDescription("New members will no longer be assigned a role automatically."),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "settings") {
    const config = await getGuildConfig(guildId);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#7289da")
          .setTitle("⚙️ Auto Role Settings")
          .addFields({
            name: "Auto Role",
            value: config?.autoRoleId ? `<@&${config.autoRoleId}>` : "Not set (disabled)",
            inline: true,
          }),
      ],
      ephemeral: true,
    });
  }
}
