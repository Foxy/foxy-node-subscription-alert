# Subscriber Alert Folders

Allows automatically sending messages for subscribers at specific configurable dates relative to the subscriptions `nextdate`.


## Usage

Sending alert emails can be as easy as creating a folder and some files.
All you need to do is to create a folder with the messages you want to send and within this folder create your email template.

Here is the simples example:

    - alerts/
        within-05/
            body.txt
            body.html

With this file structure in place, emails will be sent to users 5 days before their next subscription date. Also, the
messages will be sent in HTML (using the contents of the `.html` file) with a text fallback (with the contents of
the `.txt` file) for those users that for whatever reason cannot load the HTML message.

### Sensible defaults

There are some sensible defaults already put in place. You can use them as they are or use them as inspiration to create your own email templates.

## Composing emails

You can compose your emails in plain text, HTML or MJML. 

All emails are related to a single subscription.

### Available variables

Here are the variables you will have available when writing your email templates:

| Variable   | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| customer   | Information about the customer related to the subscription.   |
| customer.first_name | the customer first name |
| customer.last_name | the customer last name |
| customer.email | the customer email |
| items | a list of items in the subscription (the original transaction) |
| items[0].name | the name of the first item in the subscription. |
| items[0].price | the price of the first item in the subscription. |
| start_date | the start date of the subscription.|
| end_date | the end date of the subscription.|
| frequency | frequency of the subscription payments.|
| status | active or inactive |

### Formatting your message

Composing HTML mail can be much harder than one would initially think. Knowing modern HTML and CSS can be misleading.
Building a consistent, responsive look an feel involves using many of the old practives from the pre-tableless days.

[**mjml**](https://github.com/mjmlio/mjml) helps you build your templates using a markup language designed to handle these issues.
It also offers an [online editor](https://mjml.io/try-it-live) and a [desktop client](https://mjmlio.github.io/mjml-app/).

# Dependencies

This project uses the following dependencies:

- Twig: to parse and replace variables.
- MJML: to convert mjml to html.
- FoxySDK: to interact with Foxy API.
- JSDOM: to strip HTML tags and build text only versions.