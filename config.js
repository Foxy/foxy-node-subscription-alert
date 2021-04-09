/**
 * This is the configuration file.
 *
 * It needs to export a "config" constant that will be used by the application
 * to send the emails.
 */

export const config = {
  // Email folder: the folder that contains the email files
  emailFolder: "emails",
  // From address
  // Be very careful to use only legitimate email address in the field bellow. Your server may blacklisted if you fail to do this.
  from: "example@example.com",
  // Add a list of email addresses to receive a copy of emails sent.
  cc: ["nelson@ocastudios.com"],
  // Add a list of email addresses to receive a blind copy of emails sent.
  bcc: ["nelsondovale@gmail.com"],
  // Configure your Simple Mail Transport Protocol - SMTP
  smtp: {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "",
      pass: "",
    },
    security: "STARTTLS",
    sendmail: false, // Set this to true if you wish to use the installed sendmail. Leave as false if you are unsure
    // Uncomment the lines bellow to configure your sendmail, if you set the above to true.
    //newline: "unix", // You may set the newline style if you are using sendmail.
    //path: "/usr/bin/sendmail" // You may set a custom sendamil path if you are using sendmail.
  },
  // Configure your Foxy store details
  store: {
    refreshToken: "",
    clientSecret: "",
    clientId: "",
  },
  // If set to true, will only send test emails
  testing: {
    enabled: true,
    // If set to true, will use an automatically generated mailbox to receive the emails
    // If set to false, you will receive the messages in the email set in the customTestEmail bellow
    autoGenerateTestEmail: true,
    customTestEmail: "example@example.tld",
  },
  // Configure the triggers
  triggers: {
    daysAhead: [14, 7, 2],
    daysAfter: [1, 7, 14],
  },
};

