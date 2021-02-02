import Twig from "twig";
import mjml2html from "mjml";
import jsdom from "jsdom";
import * as JSDOM from "jsdom";
import { htmlToText } from "html-to-text";
import { config } from "../config.js";

/**
 * Given an object, returns a stripped down version with only the variables that should be available for the email template.
 *
 * @param data
 * @returns {{end_date: *, items: {price: *, name: *}[], customer: {last_name, first_name, email}, start_date: *, frequency: *, status: *}}
 */
function restrictVariables(data) {
  if (!data.customer) {
    data.customer = {};
  }
  return {
    customer: {
      first_name: data.customer.first_name,
      last_name: data.customer.last_name,
      email: data.customer.email,
    },
    items: data.items
      ? data.items.map((i) => ({ name: i.name, price: i.price }))
      : [],
    start_date: data.start_date,
    end_date: data.end_date,
    frequency: data.frequency,
    status: data.status,
  };
}

/**
 *
 * @param {MailFolder} message: the message to be sent.
 * @param {Subscription} subscription data retrieved from the API
 * @param {Object?} cfg: Optional. the configuration object to be used. The default configuration will be used if none is provided.
 * @returns {{txt: string, html: string, subject: string}}
 */
function folder2message(message, subscription, cfg = config) {
  const html = message.files.mjml
    ? processMjml(message.files.mjml.content)
    : message.files.html
    ? message.files.html.content
    : "";
  const txt = message.files.txt
    ? message.files.txt.content
    : plainTextVersion(html);
  const subject = plainTextVersion(message.subject);
  return {
    txt: processVariables(txt, subscription),
    html: processVariables(html, subscription),
    subject: processVariables(subject, subscription),
    to: plainTextVersion(subscription.customer.email),
    from: plainTextVersion(cfg.from),
  };
}

/**
 * Converts mjml content to HTML in a strict fashion.
 *
 * Errors are thrown if there are errors in mjml.
 *
 * @param content
 * @returns {string} the html content.
 */
function processMjml(content) {
  return mjml2html(content, { validationLevel: "strict" });
}

function plainTextVersion(content) {
  return htmlToText(content);
}

function processVariables(content, variables) {
  return Twig.twig({ data: content }).render(restrictVariables(variables));
}

export const Parser = {
  processVariables,
  html2text: plainTextVersion,
  mjml2html: processMjml,
  folder2message,
};
