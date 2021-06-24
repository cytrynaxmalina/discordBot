const Discord = require("discord.js")

module.exports.run = async (msg, args) => {

    let member = args[0]

    let reason = [...args].slice(1).join(" ")

    const errEmbed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.error)
        .setTitle(client.lib.data.status.error)
        .setFooter(footer)

    const banList = await msg.guild.fetchBans()

    const bannedUser = await banList.find(user => user.user.id === member)

    if (!bannedUser) {
        errEmbed.setDescription(`Podany użytkownik nie został zablokowany!`)

        if (!msg.guild.members.cache.get(member)) {
            errEmbed.setDescription(`Nie mogę znaleźć podanego użytkownika!`)
        }

        return msg.channel.send(errEmbed)
    }

    if (!reason)
        reason = `Nie podano.`

    await msg.guild.members.unban(member, reason)

    const unbanEmbed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.bot)
        .setTitle(client.lib.data.status.success)
        .setDescription(`Pomyślnie odblokowano użytkownika o ID **\`${member}\`**`)
        .addFields(
            {name: `Akcja:`, value: `> Usunięcie blokady`},
            {name: `Moderator:`, value: `> **${msg.author}** ||(*${msg.author.id}*)||`},
            {name: `Poszkodowany:`, value: `> **${member}**`},
            {name: `Powód:`, value: `> ${reason}`},
        )
        .setFooter(footer)

    return msg.channel.send(unbanEmbed)
}

module.exports.config = {
    name: "unban",
    cooldown: 3,
    onlyOwner: false,
    aliases: [`ub`],
    checkRoles: ['832710354127159346', '832961964007358504'],
}

module.exports.help = {
    description: 'Usuwanie blokady użytkownikom',
    category: 'admin',
    usage: [`<id>`],
}
