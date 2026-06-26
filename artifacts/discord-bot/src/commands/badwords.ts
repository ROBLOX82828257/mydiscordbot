import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { getGuildConfig, upsertGuildConfig } from "../lib/db.js";

function getList(config: { badWordsList: string } | null): string[] {
  try { return JSON.parse(config?.badWordsList ?? "[]"); } catch { return []; }
}

export const data = new SlashCommandBuilder()
  .setName("badwords")
  .setDescription("Manage the bad words filter")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((s) =>
    s.setName("add").setDescription("Add a word to the filter")
      .addStringOption((o) => o.setName("word").setDescription("Word to block").setRequired(true)),
  )
  .addSubcommand((s) =>
    s.setName("remove").setDescription("Remove a word from the filter")
      .addStringOption((o) => o.setName("word").setDescription("Word to unblock").setRequired(true)),
  )
  .addSubcommand((s) => s.setName("list").setDescription("Show all filtered words"))
  .addSubcommand((s) => s.setName("enable").setDescription("Enable the bad words filter"))
  .addSubcommand((s) => s.setName("disable").setDescription("Disable the bad words filter"));

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();
  const config = await getGuildConfig(guildId);
  const list = getList(config);

  if (sub === "add") {
    const word = interaction.options.getString("word", true).toLowerCase().trim();
    if (list.includes(word)) {
      await interaction.reply({ content: `\`${word}\` is already in the filter.`, ephemeral: true });
      return;
    }
    list.push(word);
    await upsertGuildConfig({ guildId, badWordsList: JSON.stringify(list) });
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("#f04747").setTitle("🚫 Word Added").setDescription(`\`${word}\` is now blocked.`)],
      ephemeral: true,
    });
    return;
  }

  if (sub === "remove") {
    const word = interaction.options.getString("word", true).toLowerCase().trim();
    const updated = list.filter((w) => w !== word);
    if (updated.length === list.length) {
      await interaction.reply({ content: `\`${word}\` is not in the filter.`, ephemeral: true });
      return;
    }
    await upsertGuildConfig({ guildId, badWordsList: JSON.stringify(updated) });
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("#43b581").setTitle("✅ Word Removed").setDescription(`\`${word}\` is no longer blocked.`)],
      ephemeral: true,
    });
    return;
  }

  if (sub === "list") {
    const enabled = config?.badWordsEnabled ?? false;
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#7289da")
          .setTitle("🛡️ Bad Words Filter")
          .addFields(
            { name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
            { name: "Words", value: list.length ? list.map((w) => `\`${w}\``).join(", ") : "None added yet" },
          ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "enable") {
    await upsertGuildConfig({ guildId, badWordsEnabled: true });
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("#43b581").setTitle("✅ Filter Enabled").setDescription("Bad words will now be automatically deleted.")],
      ephemeral: true,
    });
    return;
  }

  if (sub === "disable") {
    await upsertGuildConfig({ guildId, badWordsEnabled: false });
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("#f04747").setTitle("🚫 Filter Disabled").setDescription("Bad words filter has been turned off.")],
      ephemeral: true,
    });
  }
}
