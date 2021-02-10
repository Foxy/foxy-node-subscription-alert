# Foxy Subscription Alerts

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


## Creating your email alerts

Each email alert is a folder within the `emails` folder.
Simply create these folders to create new email alerts. 

### Sensible defaults

There are some sensible defaults already put in place.
You can use them as they are or use them as inspiration to create your own email templates.

#### Naming your subscription alert folder
The way you name your folder will determine how it will be sent.

- **within** Name your folders `within-NUMBER` to send an alert mail about subscriptions with next_transaction_date withing NUMBER days.
- **past** Name your folders `past-NUMBER` to send an alert mail about subscriptions with next_transaction_date that occurred in NUMBER days in the past.

You can also restrict sending alerts only to `active` or `inactive` subscriptions. Prepend your folder with `active-` or `inactive-` to achieve this.

Here are some examples:

- `within-5`: sends alerts about subscriptions that will be renewed in 5 days.
- `past-12` : sends alerts about subscriptions expired 12 days ago.
- `inactive-past-2`: sends alerts about inactive subscriptions that expired 2 days ago.

#### Creating your files

You need to create at least one file in each folder, called `body.txt`, `body.html` or `body.mjml`.
The contents of this file will be the contents of your email.

You can also create a file called `subject.txt` to customize the subject of the message.

## Testing your emails

By default, Foxy Subscription Alert comes with the `testing.enabled` set to `true`. You can set it to false in the `config.js` file.

While it is set to true, instead of sending emails to your users, it will send emails to a test account.


### Where do I see the test emails?

You can either set up an email account to receive the test emails (or use your own), or you can use an Ethereal mail that is automatically created to allow you to easily view your test emails.

#### Using Ethereal mail
In the `config.js` file there is an option called `autoGenerateTestEmail`. If it is set to true the application will set a testing account for you automatically in Ethereal Mail and display the login url, name and password for you to view your test emails.

It will display a helpful message with the link to access your test account, a user and a password. After logging in to your test account, click on "Messages" in the top menu in order to read the test emails.

**Notice:** when using Ethereal mail your SMTP configuration is not used. This means that the fact that these tests work **do not mean that your SMTP configuration is correct**.
Please, double check your SMTP configuration if you are not getting your emails.

#### Using your own test email address

In the `config.js` file there is an option called `autoGenerateTestEmail`. Set it to `false` and set `customTestEmail` to the email where you would like to receive the tests.

### Testing with testing disabled

If you need to send a test email, but does not wish to (or can't) change the config file, you can always test new emails by simply using the `test` command line argument:

```bash
#send real emails
node index.js
#send test emails
node index.js test
```


## Composing emails

You can compose your emails in plain text, HTML or MJML. If you don't provide a plain text version, one will be automatically created for you.

Pro-tip: consider using MJML to send responsive emails that will look nice everywhere.

Note: all emails are related to a single subscription.

### Using variables

You can use the Twig templating language to compose your emails.

If you are not familiar with Twig, this might help:

- Variable substitution: use double curly braces to use a variable: `Hi {{ customer.first_name }}, please confirm your email is {{ customer.email }}`.
- Loop: use a "for loop" to display a list of things: `here are the products in your subscription: {% for item in items %} {{ item.name }} {% endfor %}`.

#### Available variables

Here are the variables you will have available when writing your email templates:

| Variable            | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| customer            | Information about the customer related to the subscription.   |
| customer.first_name | the customer first name                                       |
| customer.last_name  | the customer last name                                        |
| customer.email      | the customer email                                            |
| items               | a list of items in the subscription (the original transaction)|
| items[0].name       | the name of the first item in the subscription.               |
| items[0].price      | the price of the first item in the subscription.              |
| start_date          | the start date of the subscription.                           |
| end_date            | the end date of the subscription.                             |
| frequency           | frequency of the subscription payments.                       |
| total               | The total payment for the original transaction.               |
| currency            | The currency of the original transaction.                     |

### Formatting your message

Composing HTML mail can be much harder than one would initially think. Knowing modern HTML and CSS can be misleading.
Building a consistent, responsive look and feel involves using many of the old practices from the pre tableless days.

[**mjml**](https://github.com/mjmlio/mjml) helps you build your templates using a markup language designed to handle these issues.
It also offers an [online editor](https://mjml.io/try-it-live) and a [desktop client](https://mjmlio.github.io/mjml-app/).

# Dependencies

This project uses the following dependencies:

- Twig: to parse and replace variables.
- MJML: to convert mjml to html.
- FoxySDK: to interact with Foxy API.
- HTML-to-text: to strip HTML tags and build text only versions.
