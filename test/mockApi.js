
export class MockApi {
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

export class MockResponse {
  constructor(content) {
    this.content = content;
  }

  json() {
    return Promise.resolve(this.content);
  }
}
