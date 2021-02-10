const { config } = require("./config.js");
const { Folders } = require("./src/folders.js");
const { Parser } = require("./src/parser.js");
const { Subscriptions } = require("./src/subscriptions.js");
const { getSmtpAccount } = require("./src/smtp.js");
const nodemailer = require("nodemailer");

const cfg = config;

// Test should be true even if testing.enabled is set to false if the command line argument "test" is provided.
if (process.argv.length > 3) {
  throw new Error("Only one command line argument is allowed.");
}
if (process.argv[2] === "test") {
  cfg.testing.enabled = true;
}

/**
 * Creates a transport agent with the given configuration.
 *
 * @param {{host:string, port: number, auth: {user: string, pass:string},
 * security: string }} config to be used to create the transporter.
 * @returns Object the transporter agent.
 */
function getTransporter(config = cfg.smtp) {
  return nodemailer.createTransport(config);
}

async function sendMail(message, transport = null) {
  const smtpAccount = await getSmtpAccount();
  if (!transport) {
    transport = getTransporter(smtpAccount);
  }
  transport.sendMail(message, handleMailSent);
}

function handleMailSent(err, info) {
  if (err) console.error("Error sending email:", err);
  else console.log("Successfully sent mail:", info);
}

async function sendEmailAlerts(config = cfg) {
  const folders = Folders.findFolders();
  for (let folder of folders) {
    console.assert(["within", "past"].includes(folder.type));
    const days = folder.type === "past" ? folder.days * -1 : folder.days;
    const subscriptions = await Subscriptions.getSubscriptions(
      days,
      folder.status
    );
    const messages = subscriptions.map((subscription) =>
      Parser.folder2message(folder, subscription)
    );
    messages.forEach((m) => {
      m.to = cfg.testing.enabled ? cfg.testing.customTestEmail : m.to;
      sendMail(m);
    });
  }
}

sendEmailAlerts().then(() => console.log("done."));
