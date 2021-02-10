/**
 * This is the configuration file.
 *
 * It needs to export a "config" constant that will be used by the application
 * to send the emails.
 */

const config = {
  // Email folder: the folder that contains the email files
  emailFolder: "emails",
  // From address
  // Be very careful to use only legitimate email address in the field bellow. Your server may blacklisted if you fail to do this.
  from: "example@example.com",
  // Configure your Simple Mail Transport Protocol - SMTP
  smtp: {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "",
      pass: "",
    },
    security: "STARTTLS",
  },
  // Configure your Foxy store details
  store: {
    refreshToken: "",
    clientSecret: "",
    clientId: "",
  },
  // If set to true, will only send test emails
  testMode: false,
  // Configure the triggers
  triggers: {
    daysAhead: [14, 7, 2],
    daysAfter: [1, 7, 14],
  },
};

module.exports = {
  config,
};
