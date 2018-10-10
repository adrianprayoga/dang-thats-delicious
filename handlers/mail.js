const nodemailer = require('nodemailer')
const pug = require('pug')
const juice = require('juice')
const htmlToText = require('html-to-text')
const promisify = require('es6-promisify')

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
})

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`)
    const inline = juice(html)
    return inline
}

exports.send = async (options) => {
    const html = generateHTML(options.filename, options) //(password-reset, options)
    const textHtml = htmlToText.fromString(html)
    const mailOptions = {
        from: 'Adrian Prayoga',
        to: options.user.email,
        subject: options.subject,
        html: html,
        text: textHtml
    }
    const sendMail = promisify(transport.sendMail, transport)
    return sendMail(mailOptions)
}