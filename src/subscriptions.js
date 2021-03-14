import { config } from "../config.js";
import * as EmailValidator from "email-validator";
import * as FoxySDK from "@foxy.io/sdk";

const Config = config;

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
  return (await fetchSubscriptions(days, status, api)).map(
    apiSubscription2Subscription
  );
}

/**
 * Retrieve subscriptions with next transaction date within a given number of
 * days and with a given status.
 *
 * @param {number} days the number of days from now to get subscriptions with next transaction dates.
 * @param {api} the API instance to use.
 */
export async function fetchSubscriptions(days, status, api = getApi()) {
  const today = new Date();
  const d1 = new Date(new Date(today).setDate(today.getDate() + days));
  const d2 = new Date(new Date(d1).setDate(d1.getDate() + 1));
  const [a, b] = [d1.toISOString(), d2.toISOString()];
  const options = {
    zoom: {
      customer: ["first_name", "last_name", "email"],
      original_transaction: ["items"],
    },
    filters: [`next_transaction_date=${d1.toISOString()}..${d2.toISOString()}`],
  };
  if (status !== "any") {
    options.zoom.is_active = status === "active";
  }
  const subscriptionsResponse = await api
    .follow("fx:store")
    .follow("fx:subscriptions")
    .get(options);
  const subscriptions = await subscriptionsResponse.json();
  return subscriptions["_embedded"]["fx:subscriptions"];
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
    refreshToken: cfg.store.refreshToken,
    clientSecret: cfg.store.clientSecret,
    clientId: cfg.store.clientId,
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
  return {
    start_date: apiSub.start_date,
    end_date: apiSub.end_date,
    frequency: apiSub.frequency,
    customer: apiSub2Customer(apiSub),
    transaction: apiSub2Transaction(apiSub),
    items: apiSub2Items(apiSub),
  };
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
};
