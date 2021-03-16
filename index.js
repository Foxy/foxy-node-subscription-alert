import { config } from "./config.js";
import { Folders } from "./src/folders.js";
import { Parser } from "./src/parser.js";
import { Subscriptions } from "./src/subscriptions.js";
import { getSmtpAccount } from "./src/smtp.js";
import nodemailer from "nodemailer";

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
  const transporter = nodemailer.createTransport(config);
  return transporter;
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
async function sendMail(message, transport = null) {
  const smtpAccount = await getSmtpAccount();
  if (!transport) {
    transport = getTransporter(smtpAccount);
  }
  await transport.sendMail(message, handleMailSent);
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
export const app = {
  getTransporter,
  sendMail,
  sendEmailAlerts
}
