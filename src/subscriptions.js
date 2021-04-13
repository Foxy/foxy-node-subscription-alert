import { config } from "../config.js";
import * as EmailValidator from "email-validator";
import * as FoxySDK from "@foxy.io/sdk";
import fs from "fs";
import path from "path";

const Config = config;

const __dirname=fs.realpathSync('.');

/**
 * @typedef Subscription
 *
 * @typedef {{customer: Customer, transaction: Transaction, items: Item[]}} Subscription
 */

/**
 * @typedef {{first_name: string, last_name: string, email: string}} Customer
 */

/**
 * @typedef {{total: number, currency: string}} Transaction
 */

/**
 * @typedef {{name: string, quantity: number, code: string, price: number, url: string}} Item
 */

/**
 * Retrieve the subscriptions that should be alerted for the given day.
 *
 * @param days
 * @param {"any"|"active"|"inactive"} status
 * @param api
 * @returns {Promise<*>}
 */
async function getSubscriptions(days, status = "any", api = getApi()) {
  let fetched;
  if (config.testing.enabled) {
    fetched = new Promise((resolve, reject) => {
      fs.readFile(
        path.resolve(__dirname, "src", "example.json"),
        "UTF-8",
        (err, content) => {
          if (err) reject(err);
          else resolve(JSON.parse(content));
        }
  );
    });
  } else {
    fetched = fetchSubscriptions(days, status, api);
  }
  return (await fetched).map(apiSubscription2Subscription);
}

/**
 * Retrieve subscriptions with next transaction date within a given number of
 * days and with a given status.
 *
 * @param {number} days the number of days from now to get subscriptions with next transaction dates.
 * @param {api} the API instance to use.
 */
export async function fetchSubscriptions(days, activeStatus, api = getApi()) {
  const today = new Date();
  const d1 = new Date(new Date(today).setDate(today.getDate() + days));
  const d2 = new Date(new Date(d1).setDate(d1.getDate() + 1));
  const [a, b] = [d1.toISOString(), d2.toISOString()].map(i => i.replace(/T.*/,''));
  const options = {
    zoom: {
      customer: ["first_name", "last_name", "email"],
      original_transaction: ["items"],
    },
    filters: [`end_date=${a}..${b}`],
  };
  if (activeStatus !== "any") {
    options.zoom.is_active = activeStatus === "active";
  }
  try {
  const subscriptionsResponse = await api
    .follow("fx:store")
    .follow("fx:subscriptions")
    .get(options);
  const subscriptions = await subscriptionsResponse.json();
  return subscriptions["_embedded"]["fx:subscriptions"];
  } catch (e) {
    console.error(e);
  }
}

/**
 * Creates an instance of the FoxySDK API using the given configuration.
 *
 * If no config is provided, it uses the config from the config file.
 *
 * @param {Object} config configuration with the store details.
 * @returns {API} the API instance.
 */
function getApi(cfg = Config) {
  if (!isConfigValid(cfg)) {
    throw new Error("Invalid configuration. Please, check config.js file.");
  }
  return new FoxySDK.Integration.API({
    refreshToken: cfg.store.refreshToken || cfg.store.refresh_token,
    clientSecret: cfg.store.clientSecret || cfg.store.client_secret,
    clientId: cfg.store.clientId || cfg.store.refresh_id,
  });
}

/**
 * Verifies that a configuration object is valid.
 *
 * @param {{
 *  from: string,
 *  store: {refreshToken: string, clientSecret: string, clientid; string},
 *  smtp: {host: string, port: string|number}
 * }} cfg the configuration object to be validated.
 *
 * @returns {boolean} the configuration is valid.
 */
function isConfigValid(cfg) {
  return cfg.from && EmailValidator.validate(cfg.from) &&
    cfg.store && 
    cfg.store.refreshToken &&
    cfg.store.clientSecret &&
    cfg.store.clientId &&
    cfg.smtp &&
    cfg.smtp.host &&
    cfg.smtp.port;
}

/**
 * Verifies that two objects have the same keys.
 *
 * This function checks only the attributes on the first level.
 * 
 * @param {Object} objA
 * @param {Object} objB
 * @returns {boolean} the two objects have the same keys
 *
*/
function sameProperties(objA, objB) {
  return Object.keys(objA).every((k) => objB.hasOwnProperty(k));
}

/**
 *
 * @param {FxSubscription} apiSub
 * @returns {Subscription}
 */
function apiSubscription2Subscription(apiSub) {
  try {
    return {
      start_date: apiSub.start_date,
      next_date: apiSub.next_transaction_date,
      end_date: apiSub.end_date,
      frequency: apiSub.frequency,
      customer: apiSub2Customer(apiSub),
      transaction: apiSub2Transaction(apiSub),
      items: apiSub2Items(apiSub),
    };
  } catch (e) {
    console.log('Could not build subscription object.' , e);
  }
}

/**
 * Extracts the customer from the subscription returned from the API.
 *
 * @param {FxSubscription} apiSub
 * @returns {Customer} the customer of this subscription
 */
function apiSub2Customer(apiSub) {
  const customer = apiSub["_embedded"]["fx:customer"] || {};
  return {
    first_name: customer["first_name"],
    last_name: customer["last_name"],
    email: customer["email"],
  };
}

/**
 * Extracts the transaction from the subscription returned from the API.
 *
 * @param {FxSubscription} apiSub
 * @returns { Transaction }
 */
function apiSub2Transaction(apiSub) {
  const tx = apiSub["_embedded"]["fx:original_transaction"];
  if (!tx) {
    console.log(tx);
    throw new Error("Original transaction not found.");
  }
  if (!tx.total_order) {
    throw new Error("Original transaction does not contain the total order.");
  }
  if (!tx.currency_symbol) {
    throw new Error("Original transaction does not specify a currency symbol..");
  }
  return {
    total: tx.total_order.toString(),
    currency: tx.currency_symbol,
  };
}

/**
 * Extracts the items from the subscription returned from the API.
 *
 * @param {FxSubscription} apiSub
 * @returns Item[]
 */
function apiSub2Items(apiSub) {
  const apiItems =
    apiSub["_embedded"]["fx:original_transaction"]["_embedded"]["fx:items"];
  return apiItems.map((i) => ({
    name: i.name,
    quantity: Number(i.quantity),
    code: i.code,
    price: Number(i.price),
    url: i.url,
    image: i.image,
  }));
}

export const Subscriptions = {
  getSubscriptions,
  apiSubscription2Subscription,
  getApi
};
