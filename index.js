const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType
} = require("discord.js");

const express = require("express");

// ===== KEEP RENDER ALIVE =====
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const OWNER_ROLE_ID = "1478554422303916185";

// ===== BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ===== SLASH COMMAND =====
const commands = [
  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Noctaly style message panel")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Pick a channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// register command
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
      console.log("Missing env variables");
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash command registered");
  } catch (err) {
    console.log("Command register error:", err);
  }
})();

// ===== READY =====
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== OPEN MODAL =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sendmessage") {
    const hasRole = interaction.member.roles.cache.has(OWNER_ROLE_ID);

    if (!hasRole) {
      return interaction.reply({
        content: "No permission.",
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("channel");

    const modal = new ModalBuilder()
      .setCustomId(`sendmessage_modal_${channel.id}`)
      .setTitle("Send Embed Message");

    const input = new TextInputBuilder()
      .setCustomId("message")
      .setLabel("Write your message")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
});

// ===== MODAL SUBMIT =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId.startsWith("sendmessage_modal_")) {
    try {
      const channelId = interaction.customId.split("_")[2];
      const channel = await client.channels.fetch(channelId);

      const msg = interaction.fields.getTextInputValue("message");

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(msg)
        .setFooter({ text: `Sent by ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({
        content: "Message sent.",
        ephemeral: true,
      });

      await channel.send({ embeds: [embed] });

    } catch (err) {
      console.log(err);
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
