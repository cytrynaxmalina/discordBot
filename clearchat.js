const Discord = require("discord.js")

module.exports.run = async (msg, args) => {

    let numDelete = parseInt(args[0]), helpNum = 0;

    if (isNaN(numDelete) || numDelete <= 0) {
        const embed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.error)
            .setTitle(client.lib.data.status.error)
            .setDescription("Podaj ilość wiadomości do usunięcia!")
            .setFooter(footer)
        return msg.channel.send(embed)
    }

    // if (numDelete > 99) {
    //     msg.channel.send(`Wieksza liczba i petla`)
    //     // const embed = new Discord.MessageEmbed()
    //     //     .setColor(client.lib.data.colors.error)
    //     //     .setTitle(client.lib.data.status.error)
    //     //     .setDescription('Nie możesz usuwnąć wiecej niż `99` wiadomości jednocześnie oraz starszych niż 2 tygodnie!')
    //     //     .setFooter(footer)
    //     // return msg.channel.send(embed)
    // }

    // while (Math.round(numDelete / 100) >= 0) {

    await msg.delete()

    while (numDelete > 0) {

        if (numDelete <= 100) {
            await msg.channel.bulkDelete(numDelete, true).then(delMessages => helpNum += delMessages.size)
            // await msg.channel.messages.fetch({ limit: numDelete }).then(messages => {
            //     msg.channel.bulkDelete(messages, true)
            //     helpNum += messages.size
            // });
            // helpNum = numDelete;
            numDelete = 0;
        } else {
            numDelete -= 100;
            // helpNum += 100;
            await msg.channel.bulkDelete(100, true).then(delMessages => helpNum += delMessages.size)
            // await msg.channel.messages.fetch({ limit: 100 }).then(messages => {
            //     msg.channel.bulkDelete(messages, true)
            //     helpNum += messages.size
            // });
        }

        // msg.channel.bulkDelete(numDelete + 1, true);
    }

    // msg.channel.bulkDelete(numDelete + 1, true);

    const embed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.bot)
        .setTitle(client.lib.data.status.success)
        .setDescription(`Usunięto \`${helpNum}/${args[0]}\` wiadomości!`)
        .setFooter(footer)

    return msg.channel.send(embed).then(msg => {
            msg.delete({timeout: 5000})
    });
}

module.exports.config = {
    name: "clear",
    cooldown: 3,
    onlyOwner: false,
    aliases: false,
    checkRoles: ['831639536622501899', `831640879780462622`, `831624853563113472`],
}

module.exports.help = {
    description: 'Czyszczenie czatu',
    category: 'admin',
    usage: [`<liczba_wiadomości>`],
}
