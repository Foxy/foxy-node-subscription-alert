import * as FoxySDK from "@foxy.io/sdk";
import * as dotenv from "dotenv";
import { fetchSubscriptions, Subscriptions } from "../src/subscriptions.js";
import { Parser } from "../src/parser.js";
import { config } from "../config.js";
import { app } from "../index.js";
import { MockApi, MockResponse } from "./mockApi.js";
const cfg = config;

dotenv.config();

import chai from "chai";

const expect = chai.expect;

const testApi = new FoxySDK.Integration.API({
  refreshToken: process.env.FOXY_DEV_REFRESH_TOKEN,
  clientSecret: process.env.FOXY_DEV_CLIENT_SECRET,
  clientId: process.env.FOXY_DEV_CLIENT_ID,
});

describe("Allows users to configure their Foxy accounts.",  function () {

  it("reads foxy credentials from config file.", function () {
    const api = Subscriptions.getApi();
    expect(api.refreshToken).to.equal(cfg.store.refreshToken);
    expect(api.clientSecret).to.equal(cfg.store.clientSecret);
    expect(api.clientId).to.equal(cfg.store.clientId);
  });

  });

describe("Allows users to configure their SMTP details.",  function () {

  it("reads smtp configuration from config file.", function () {
    const transporter = app.getTransporter();
    const mailOptions = transporter.options;
    expect(mailOptions.host).to.equal(cfg.smtp.host);
    expect(mailOptions.port).to.equal(cfg.smtp.port);
    expect(mailOptions.auth.user).to.equal(cfg.smtp.auth.user);
    expect(mailOptions.auth.pass).to.equal(cfg.smtp.auth.pass);
  });


});

describe("Sends emails in the appropriate dates", function () {
  it("Retrieves the list of subscriptions for the appropriate dates", async () => {
    const inDays = [0, 1, 10, 200, -1, -10, -200];
    const api = new MockApi();
    for (const d of inDays) {
      const subscription = api.createSubscription({
          next_transaction_date: inSomeDays(d).toISOString(),
      });
      api.setSubscriptions([ subscription ]);
      try{
        const transactions = await fetchSubscriptions(d, 'active', api);
      expect(transactions.length).to.equal(1);
      } catch (e) {
        console.log("Error", e);
      }
    }
  });
});

function inSomeDays(x) {
  const today = new Date();
  return new Date(today.setDate(today.getDate() + x));
}


