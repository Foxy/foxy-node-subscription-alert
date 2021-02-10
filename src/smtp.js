const nodemailer = require("nodemailer");
const { config } = require("../config.js");
const fs = require("fs");

async function getTestAccount() {
  const savedTestFile = ".testAccount.json";
  let testAccount;
  try {
    testAccount = JSON.parse(
      await new Promise((resolve, reject) => {
        fs.readFile(savedTestFile, "utf8", (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      })
    );
  } catch (e) {
    if (e.code == "ENOENT") {
      testAccount = await nodemailer.createTestAccount();
      fs.writeFile(savedTestFile, JSON.stringify(testAccount), () =>
        console.log("test account saved")
      );
    } else {
      throw e;
    }
  }
  return testAccount;
}

let __testAccount = null;
async function getSmtpAccount(cfg = config) {
  const smtpAccount = cfg.smtp;
  let testAccount;
  if (cfg.testMode === true) {
    if (__testAccount === null) {
      testAccount = await getTestAccount();
      console.log("#############################################");
      console.log(" Test mode: you can see the tests visiting: ");
      console.log(` ${testAccount.web}/login`);
      console.log(` user: ${testAccount.user}`);
      console.log(` password: ${testAccount.pass}`);
      console.log("#############################################");
      __testAccount = testAccount;
    } else {
      testAccount = __testAccount;
    }
    smtpAccount.host = testAccount.smtp.host;
    smtpAccount.port = testAccount.smtp.port;
    smtpAccount.auth.user = testAccount.user;
    smtpAccount.auth.pass = testAccount.pass;
  }
  return smtpAccount;
}

module.exports = {
  getSmtpAccount,
};
