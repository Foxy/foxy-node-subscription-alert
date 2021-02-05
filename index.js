import { config } from "./config.js";
import { Folders } from "./src/folders.js";
import { Parser } from "./src/parser.js";
import { Subscriptions } from "./src/subscriptions.js";
import { getSmtpAccount } from "./src/smtp.js";
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
