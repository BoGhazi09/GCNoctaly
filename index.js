const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const express = require("express");

// ===== keep alive (Render) =====
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Web server running"));

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
    .setDescription("Open message panel")
].map(c => c.toJSON());

// register slash command
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

// ===== READY =====
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (interaction) => {

  // /sendmessage
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "sendmessage") return;

    if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
      return interaction.reply({
        content: "No permission.",
        ephemeral: true
      });
    }

    const button = new ButtonBuilder()
      .setCustomId("open_modal")
      .setLabel("Write Message")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    return interaction.reply({
      content: "Click to open message panel",
      components: [row],
      ephemeral: true
    });
  }

  // button click
  if (interaction.isButton()) {
    if (interaction.customId !== "open_modal") return;

    const modal = new ModalBuilder()
      .setCustomId("msg_modal")
      .setTitle("Noctaly Message Panel");

    const input = new TextInputBuilder()
      .setCustomId("message")
      .setLabel("Write your message")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  // modal submit
  if (interaction.isModalSubmit()) {
    if (interaction.customId !== "msg_modal") return;

    const msg = interaction.fields.getTextInputValue("message");

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(msg)
      .setFooter({ text: `Sent by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({
      content: "Message sent.",
      ephemeral: true
    });

    await interaction.channel.send({
      embeds: [embed]
    });
  }
});

// ===== LOGIN =====
client.login(TOKEN);
