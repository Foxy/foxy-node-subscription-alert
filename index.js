import { config } from "./config.js";
import { Folders } from "./src/folders.js";
import { Parser } from "./src/parser.js";
import { Subscriptions } from "./src/subscriptions.js";
import nodemailer from "nodemailer";

const cfg = config;
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

/**
 * Sends a message by email using the given transport agent.
 *
 * If no transport agent is provided, creates a default transfort agent using
 * the global config file.
 *
 * @param {Object} message to be sent.
 * @param {Object} transport agent to be used to send the email.
 */
function sendMail(message, transport = null) {
  if (!transport) {
    transport = getTransporter(config.smtp);
  }
  transport.sendMail(message, handleMailSent);
}

function handleMailSent(err, info) {
  if (err) console.error("Error sending email:", err);
  else console.log("Successfully sent mail:", info);
}

async function sendEmailAlerts() {
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
    messages.forEach((m) => sendMail(m));
  }
}

sendEmailAlerts().then(() => console.log("done."));
