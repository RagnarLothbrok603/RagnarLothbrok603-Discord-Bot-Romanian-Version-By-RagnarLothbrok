module.exports = (bot, message, queue, track) => {

    const { MessageEmbed } = require("discord.js")

        const embed = new MessageEmbed()
        .setColor(bot.color)
        .setDescription(`${track.title} a fost adaugat in lista de redare.`)
    message.channel.send(embed);

};