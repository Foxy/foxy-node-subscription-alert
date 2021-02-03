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

  it("Prepares messages to be sent", function () {
    const mockApi = new MockApi();
    const subscription = Subscriptions.apiSubscription2Subscription(
      mockApi.createSubscription({})
    );
    const parsed = Parser.folder2message(
      {
        type: "within",
        days: 5,
        folder: "emails/within-5",
        files: {
          txt: { path: "body.txt", content: sampleTxt, type: "txt" },
          html: { path: "body.html", content: sampleHtml, type: "html" },
        },
      },
      subscription
    );
  });
});

describe("Sends emails in the appropriate dates", function () {
  it("Retrieves the list of subscriptions for the appropriate dates", async () => {
    const inDays = [0, 1, 10, 200, -1, -10, -200];
    const api = new MockApi();
    for (const d of inDays) {
      api.setSubscriptions([
        api.createSubscription({
          next_transaction_date: inSomeDays(d).toISOString(),
        }),
      ]);
      const transactions = await fetchSubscriptions(d, api);
      expect(transactions.length).to.equal(1);
    }
  });
});

function inSomeDays(x) {
  const today = new Date();
  return new Date(today.setDate(today.getDate() + x));
}

class MockApi {
  /**
   * What is being requested from the API
   * @type {string}
   */
  what = "";

  setSubscriptions(subs) {
    this.subscriptions = subs;
  }

  setStandardSubscriptions() {
    const standardDays = [-1, -3, 0, 3, 7];
    this.setSubscriptions(
      standardDays.map((d) =>
        this.createSubscription({
          next_transaction_date: inSomeDays(d).toISOString(),
        })
      )
    );
  }

  packSubscriptions(subs) {
    return {
      _embedded: {
        "fx:subscriptions": subs,
      },
    };
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
        _embedded: {
          "fx:customer": {
            id: "000",
            first_name: "Foo",
            last_name: "Bar",
            email: "foo.bar@example.com",
          },
          "fx:original_transaction": {
            id: 1,
            currency_symbol: "$",
            total_order: 100,
            transaction_date: "2020-11-14T06:40:04-0800",
            _embedded: {
              "fx:items": [
                {
                  name: "Item 1",
                  quantity: 10,
                  price: 10.0,
                  code: 42,
                  image: "image-url",
                  url: "product-url",
                },
              ],
            },
          },
        },
      },
      ...subs,
    };
  }

  follow(what) {
    this.what = what;
    return this;
  }

  get() {
    switch (this.what) {
      case "fx:subscriptions":
        return Promise.resolve(
          new MockResponse(this.packSubscriptions(this.subscriptions))
        );
      default:
        return {};
    }
  }
}

class MockResponse {
  constructor(content) {
    this.content = content;
  }

  json() {
    return Promise.resolve(this.content);
  }
}

const sampleHtml = `
<p>Dear {{customer.first_name}} {{customer.last_name}}</p>

<p>We would like to inform you that your subscription will be renewed in 11 days.</p>

<p>Here are the subscription details: </p>
<ul> 
{% for item in items %}
  <li><a href="{{ item.url }}">{{ item.name }} - {{ item.price }}</a></li>
{% endfor %}
</ul>

<p>Total: {{ currency }} {{ total }}</p>
`;

const sampleTxt = `
Dear {{customer.last_name}}

We would like to inform you that your subscription will be renewed in 11 days.

Here are the subscription details: 
 
{% for item in items %}
  {{ item.name }} - {{ item.price }}
{% endfor %}

Total: {{ currency }} {{ total }}

--
`;
