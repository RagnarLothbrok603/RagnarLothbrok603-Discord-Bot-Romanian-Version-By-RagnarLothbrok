module.exports = (bot, message, track) => {

    message.channel.send(` Acum canta ${track.title} in ${message.member.voice.channel.name} ...`);

};