import Twig from "twig";
import mjml from "mjml";
import { htmlToText } from "html-to-text";
import { config } from "../config.js";

/**
 * Given an object, returns a stripped down version with only the variables
 * that should be available for the email template.
 *
 * @param data
 * @returns {{end_date: *, items: {price: *, name: *}[], customer: {last_name, first_name, email}, start_date: *, frequency: *, status: *}}
 */
function restrictVariables(data) {
  if (!data) {
    data = {};
  }
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
      ? data.items.map((i) => ({
          name: i.name,
          price: i.price,
          code: i.code,
          url: i.url,
          image: i.image,
          quantity: i.quantity,
        }))
      : [],
    start_date: data.start_date,
    next_date: data.next_date,
    end_date: data.end_date,
    frequency: data.frequency,
    currency: data.transaction?.currency,
    total: data.transaction?.total,
  };
}

/**
 *
 * @param {MailFolder} message: the message to be sent.
 * @param {Subscription} subscription data retrieved from the API
 * @param {Object?} cfg: Optional. the configuration object to be used. The default configuration will be used if none is provided.
 * @returns {{text: string, html: string, subject: string}}
 */
function folder2message(message, subscription, cfg = config) {
  const html = message.files.mjml
    ? processMjml(message.files.mjml.content).html
    : message.files.html
    ? message.files.html.content
    : "";
  const text = message.files.txt
    ? message.files.txt.content
    : plainTextVersion(html);
  const subject = plainTextVersion(message.subject);
  const result = {}
  result.text = processVariables(text, subscription);
  result.html = processVariables(html, subscription);
  result.subject = processVariables(subject, subscription);
  result.to = plainTextVersion(subscription.customer.email);
  result.from = plainTextVersion(cfg.from);
  if (cfg.cc && cfg.cc.length) {
    result.cc = cfg.cc.join(', ');
  }
  if (cfg.bcc && cfg.bcc.length) {
    result.bcc = cfg.bcc.join(', ');
  }
  return result;
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
  return mjml(content, { validationLevel: "strict" });
}

function plainTextVersion(content) {
  return htmlToText(content);
}

function processVariables(content, variables) {
  const restricted = restrictVariables(variables);
  return Twig.twig({ data: content }).render(restricted);
}

export const Parser = {
  processVariables,
  html2text: plainTextVersion,
  mjml2html: processMjml,
  folder2message,
};

