const Discord = require("discord.js")

module.exports.run = async (msg, args) => {

    // let member = msg.mentions.users.first() ? msg.mentions.users.first() : msg.guild.members.cache.get(args[0])

    let muteRole = msg.guild.roles.cache.find(r => r.name === `Wyciszony`)

    if (!muteRole) msg.guild.roles.create({data: {name: `Wyciszony`}})

    let member = msg.guild.members.cache.get(args[0])

    if (!member) member = msg.mentions.members.first()

    let reason = [...args].slice(1).join(" ")

    const errEmbed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.error)
        .setTitle(client.lib.data.status.error)
        .setFooter(footer)

    if (!member) {
        errEmbed.setDescription(`Nie mogę znaleźć podanego użytkownika!`)
        return msg.channel.send(errEmbed)
    }

    if (member.roles.highest.position >= msg.member.roles.highest.position) {
        errEmbed.setDescription(`Nie możesz odciszyć użytkownika z wyższą lub równą rolą!`)
        return msg.channel.send(errEmbed)
    }

    msg.guild.channels.cache.forEach(f => {
        f.updateOverwrite(muteRole, {SEND_MESSAGES: false, ADD_REACTIONS: false})
    })

    if (!member.roles.cache.has(muteRole.id)) {
        errEmbed.setDescription(`Podany użytkownik nie jest wyciszony!`)
        return msg.channel.send(errEmbed)
    }

    await member.roles.remove(muteRole)

    if (!reason)
        reason = `Nie podano.`

    const muteEmbed_DM = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.warn)
        .setTitle(`Zostałeś odciszony na serwerze ${msg.guild.name}`)
        .addFields(
            {name: `Akcja:`, value: `> Usunięcie wyciszenia`},
            {name: `Moderator:`, value: `> **${msg.author}** ||(*${msg.author.id}*)||`},
            {name: `Poszkodowany:`, value: `> **${member}** ||(*${member.id}*)||`},
            {name: `Powód:`, value: `> ${reason}`},
        )
        .setFooter(footer2)

    let checkDM = "Dostarczono"

    await member.send(muteEmbed_DM).catch(err => (
        checkDM = "Nie dostarczono"
    ))

    const muteEmbed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.bot)
        .setTitle(client.lib.data.status.success)
        .setDescription(`Pomyślnie usunięto wyciszenie użytkownika **\`${member.user.username}\`**`)
        .addFields(
            {name: `Akcja:`, value: `> Usunięcie wyciszenia`},
            {name: `Moderator:`, value: `> **${msg.author}** ||(*${msg.author.id}*)||`},
            {name: `Poszkodowany:`, value: `> **${member}** ||(*${member.id}*)||`},
            {name: `Powiadomienie:`, value: `> ${checkDM}`},
            {name: `Powód:`, value: `> ${reason}`},
        )
        .setFooter(footer)

    return msg.channel.send(muteEmbed)
}

module.exports.config = {
    name: "unmute",
    cooldown: 3,
    onlyOwner: false,
    aliases: [],
    checkRoles: ['832710354127159346', '832961964007358504', '831640098222374962', '831642492729294938'],
}

module.exports.help = {
    description: 'Usuwanie wyciszenia użytkownikom',
    category: 'admin',
    usage: [`<@oznaczenie/id>`],
}
