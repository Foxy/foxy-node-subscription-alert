import * as FoxySDK from "@foxy.io/sdk";
import { fetchSubscriptions, Subscriptions } from "../src/subscriptions.js";
import { Folders } from "../src/folders.js";
import { Parser } from "../src/parser.js";

import chai from "chai";

const expect = chai.expect;

const testApi = new FoxySDK.Integration.API({
  refreshToken: "PNxuKsfGIK3EmbriDMYHecqHN4MTawCTa1dPmjlV",
  clientSecret: "F9tRBZBD4w5LspfRfd1phZ9arZQ75CRAFeh89JF3",
  clientId: "client_S2uCyW4jie5Q2AVLLbVU",
});

// describe("Allows users to configure their Foxy accounts.");

// describe("Allows users to configure their SMTP details.");

// describe("Allows users to configure the alert dates.");

describe("Reads and parses files for sending emails", function () {
  it("identifies the folders with mail files", function () {
    const folders = Folders.getFolders([
      "foo",
      "bar-5",
      "within-5",
      "past-5",
      "within",
      "past",
      "within.5",
      "past_5",
    ]);
    expect(folders.length).to.equal(2);
    expect(folders[0].type).to.equal("within");
    expect(folders[0].days).to.equal("5");
  });

  it("Processes templates, adding variables", function () {
    expect(
      Parser.processVariables(
        "Hello {{ customer.first_name }}, end date is {{ end_date }}",
        { customer: { first_name: "foo" }, end_date: "tomorrow" }
      )
    ).to.equal("Hello foo, end date is tomorrow");
  });

  it("");
});

describe("Sends emails in the appropriate dates", function () {
  it("Retrieves the list of subscriptions for the appropriate dates", async () => {
    const api = testApi;
    const transactions = await fetchSubscriptions(11, api);
    expect(transactions.length).to.equal(1);
  });
});

function inSomeDays(x) {
  const today = new Date();
  return new Date(today.setDate(today.getDate() + x));
}

class MockApi {
  setSubscriptions(subs) {
    this.subscriptions = subs;
  }

  /**
   * Creates a overwritable mock subscription
   *
   * @param subs
   * @returns {*&{end_date: null, error_message: string, cancellation_source: string, first_failed_transaction_date: null, is_active: boolean, date_created: Date, past_due_amount: number, third_party_id: string, frequency: string, date_modified: Date, _embedded: {}, start_date: Date, next_transaction_date: Date}}
   */
  createSubscription(subs) {
    const today = new Date();
    const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
    const inTenDays = new Date(today.setDate(today.getDate() + 10));
    return {
      ...{
        start_date: lastYear,
        next_transaction_date: inTenDays,
        end_date: null,
        frequency: "1m",
        error_message: "",
        past_due_amount: 0,
        first_failed_transaction_date: null,
        is_active: true,
        third_party_id: "",
        cancellation_source: "",
        date_created: lastYear,
        date_modified: lastYear,
        _embedded: {},
      },
      ...subs,
    };
  }

  follow() {
    return this;
  }

  get(what) {
    switch (what) {
      case "fx:subscriptions":
        return Promise.resolve(
          new Response(JSON.stringify(this.subscriptions))
        );
      default:
        return {};
    }
  }
}
