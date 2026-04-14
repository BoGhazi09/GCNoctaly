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
  ActionRowBuilder
} = require("discord.js");

const express = require("express");

// ===== keep render alive =====
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ===== config =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const OWNER_ROLE_ID = "1478554422303916185";

// ===== bot =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
});

// ===== slash command =====
const commands = [
  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Noctaly style message panel")
].map(c => c.toJSON());

// register command
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash command registered");
  } catch (err) {
    console.log(err);
  }
})();

// ===== ready =====
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== open modal =====
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

    const modal = new ModalBuilder()
      .setCustomId("sendmessage_modal")
      .setTitle("Send Message Panel");

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

// ===== modal submit =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "sendmessage_modal") {
    try {
      let msg = interaction.fields.getTextInputValue("message");

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(msg)
        .setFooter({ text: `Sent by ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({
        content: "Message sent.",
        ephemeral: true,
      });

      await interaction.channel.send({
        embeds: [embed],
      });

    } catch (err) {
      console.log("Modal error:", err);
    }
  }
});

// ===== login =====
client.login(TOKEN);
