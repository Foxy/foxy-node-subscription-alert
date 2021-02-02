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

function sendMail(message, transport = null) {
  if (!transport) {
    transport = getTransporter(config.smtp);
  }
  transport.sendMail(message, handleMailSent);
}

function handleMailSent(err, info) {
  console.err(err);
  console.log(info);
}

async function sendEmailAlerts() {
  const alerts = Folders.findFolders();
  for (let a of alerts) {
    console.assert(["within", "past"].includes(a.type));
    const days = a.type === "past" ? a.days * -1 : a.days;
    const subscriptions = await Subscriptions.getSubscriptions(days);
    console.log("subscriptions", subscriptions);
    const messages = subscriptions.map((s) => Parser.folder2message(a, s));
    console.log("Messages", messages);
    messages.forEach((m) => sendMail(m));
  }
}

sendEmailAlerts().then(console.log);
