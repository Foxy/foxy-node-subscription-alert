import { MockApi, MockResponse } from "./mockApi.js";
import { fetchSubscriptions, Subscriptions } from "../src/subscriptions.js";
import { Parser } from "../src/parser.js";
import chai from "chai";
const expect = chai.expect;


describe("Reads and parses files for sending emails", function () {

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
