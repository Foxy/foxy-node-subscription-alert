import { config } from "../config.js";
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
 * @typedef {{id: number, date: Date, total: number, currency: string}} Transaction
 */

/**
 * @typedef {{name: string, quantity: number, code: string, price: number, url: string}} Item
 */

/**
 * Retrieve the subscriptions that should be alerted for the given day.
 *
 * @param days
 * @returns {Promise<*>}
 */
async function getSubscriptions(days, api = getApi()) {
  return (await fetchSubscriptions(days, api)).map(
    apiSubscription2Subscription
  );
}

export async function fetchSubscriptions(days, api = getApi()) {
  const today = new Date();
  const d1 = new Date(new Date(today).setDate(today.getDate() + days));
  const d2 = new Date(new Date(d1).setDate(d1.getDate() + 1));
  const [a, b] = [d1.toISOString(), d2.toISOString()];
  const subscriptionsResponse = await api
    .follow("fx:store")
    .follow("fx:subscriptions")
    .get({
      zoom: {
        customer: ["first_name", "last_name", "email"],
        original_transaction: ["items"],
      },
      filters: [
        `next_transaction_date=${d1.toISOString()}..${d2.toISOString()}`,
      ],
    });
  const subscriptions = await subscriptionsResponse.json();
  return subscriptions["_embedded"]["fx:subscriptions"];
}

/**
 * Creates an instance of the FoxySDK API using the given configuration.
 *
 * If no config is provided, it uses the config from the config file.
 *
 * @param config configuration with the store details.
 * @returns {API} the API instance.
 */
function getApi(cfg = Config) {
  return new FoxySDK.Integration.API({
    refreshToken: cfg.store.refreshToken,
    clientSecret: cfg.store.clientSecret,
    clientId: cfg.store.clientId,
  });
}

/**
 *
 * @param {FxSubscription} apiSub
 * @returns {{customer: Customer}}
 */
function apiSubscription2Subscription(apiSub) {
  return {
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
  return {
    first_name: apiSub["_embedded"]["fx:customer"]["first_name"],
    last_name: apiSub["_embedded"]["fx:customer"]["last_name"],
    email: apiSub["_embedded"]["fx:customer"]["email"],
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
    id: Number(tx.id),
    date: new Date(tx.transaction_date),
    total: Number(tx.total_order),
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
  }));
}

export const Subscriptions = {
  getSubscriptions,
};
