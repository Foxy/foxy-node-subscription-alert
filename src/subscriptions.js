import { config  } from './config.js';
import * as FoxySDK from "@foxy.io/sdk";

function getApi(config) {
  const api = new FoxySDK.Integration.API({
    refreshToken: 'your refresh token',
    clientSecret: 'your client secret',
    clientId: 'your client id',
  });
  return api;
}

export async function getSubscriptions(days, api = getApi()) {
  const today = new Date();
  const d1 = new Date(new Date(today).setDate(today.getDate() + days ));
  const d2 = new Date(new Date(d1).setDate(d1.getDate() + 1));
  const [a, b] = [d1.toISOString(), d2.toISOString()];
  const subscriptionsResponse = await (
    api.follow('fx:store')
      .follow('fx:subscriptions')
      .get(
        {
          filters: [
            `next_transaction_date=${d1.toISOString()}..${d2.toISOString()}`,
          ]
        }
      ))
  const subscriptions = await subscriptionsResponse.json()
  return subscriptions['_embedded']['fx:subscriptions'];
}
