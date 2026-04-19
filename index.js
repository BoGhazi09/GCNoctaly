const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const OWNER_ROLE_ID = "1478554422303916185";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// register command
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('sendmessage')
      .setDescription('Ultimate message tool')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Ready");
});

client.on(Events.InteractionCreate, async (interaction) => {

  try {

    // SLASH COMMAND
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'sendmessage') {

        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
          return interaction.reply({ content: "No permission", ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId('modal_main')
          .setTitle('Send Message');

        const input = new TextInputBuilder()
          .setCustomId('msg')
          .setLabel('Message')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return await interaction.showModal(modal);
      }
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {

      if (interaction.customId === "modal_main") {

        // ✅ VERY IMPORTANT (FIRST THING)
        await interaction.deferReply({ ephemeral: true });

        const message = interaction.fields.getTextInputValue('msg');

        const channel = interaction.channel;

        // webhook
        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(w => w.owner.id === client.user.id);

        if (!webhook) {
          webhook = await channel.createWebhook({ name: "Noctaly" });
        }

        await webhook.send({
          content: message,
          username: interaction.user.username,
          avatarURL: interaction.user.displayAvatarURL()
        });

        await interaction.editReply("Sent!");
      }
    }

  } catch (err) {
    console.error(err);

    if (interaction.deferred || interaction.replied) {
      interaction.editReply("Error happened");
    } else {
      interaction.reply({ content: "Error happened", ephemeral: true });
    }
  }

});

client.login(process.env.TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
