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
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('Target channel')
          .setRequired(false)
      )
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

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'sendmessage') {

      if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
        return interaction.reply({ content: "No permission", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`modal_${interaction.options.getChannel('channel')?.id || interaction.channel.id}`)
        .setTitle('Send Message');

      const inputs = [
        ["msg", "Message", TextInputStyle.Paragraph, true],
        ["username", "Username", TextInputStyle.Short, false],
        ["avatar", "Avatar URL", TextInputStyle.Short, false],
        ["embed", "Embed? yes/no", TextInputStyle.Short, false],
        ["title", "Embed Title", TextInputStyle.Short, false],
        ["image", "Embed Image URL", TextInputStyle.Short, false],
        ["color", "Embed Color (hex)", TextInputStyle.Short, false],
        ["buttons", "Buttons (text|link,comma separated)", TextInputStyle.Paragraph, false],
        ["reply", "Reply message ID", TextInputStyle.Short, false]
      ];

      inputs.forEach(i => {
        const input = new TextInputBuilder()
          .setCustomId(i[0])
          .setLabel(i[1])
          .setStyle(i[2])
          .setRequired(i[3]);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
      });

      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith("modal_")) {

      const channelId = interaction.customId.split("_")[1];
      const channel = await client.channels.fetch(channelId);

      const get = (id) => interaction.fields.getTextInputValue(id);

      const message = get("msg");
      const username = get("username") || interaction.user.username;
      const avatar = get("avatar") || interaction.user.displayAvatarURL();
      const useEmbed = get("embed")?.toLowerCase() === "yes";
      const title = get("title");
      const image = get("image");
      const color = get("color");
      const buttonsInput = get("buttons");
      const replyId = get("reply");

      await interaction.reply({ content: "Sent!", ephemeral: true });

      const webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(w => w.owner.id === client.user.id);

      if (!webhook) {
        webhook = await channel.createWebhook({ name: "Noctaly" });
      }

      let payload = {
        username,
        avatarURL: avatar
      };

      // embed
      if (useEmbed) {
        const embed = new EmbedBuilder().setDescription(message);

        if (title) embed.setTitle(title);
        if (image) embed.setImage(image);
        if (color) embed.setColor(color);

        payload.embeds = [embed];
      } else {
        payload.content = message;
      }

      // multiple buttons
      if (buttonsInput) {
        const buttons = buttonsInput.split(",");

        const row = new ActionRowBuilder();

        buttons.forEach(b => {
          const parts = b.split("|");
          if (parts.length === 2) {
            row.addComponents(
              new ButtonBuilder()
                .setLabel(parts[0].trim())
                .setStyle(ButtonStyle.Link)
                .setURL(parts[1].trim())
            );
          }
        });

        payload.components = [row];
      }

      // reply system
      if (replyId) {
        try {
          const msg = await channel.messages.fetch(replyId);
          await msg.reply(payload);
          return;
        } catch {}
      }

      await webhook.send(payload);
    }
  }

});

client.login(process.env.TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
