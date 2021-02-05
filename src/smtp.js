import nodemailer from "nodemailer";
import { config } from "../config.js";
import * as fs from "fs";


async function getTestAccount() {
  const savedTestFile = '.testAccount.json';
  let testAccount;
  try {
    testAccount = JSON.parse(await new Promise( (resolve, reject) => {
      fs.readFile(savedTestFile, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data)
      })
    }));
  } catch (e) {
    if (e.code == 'ENOENT') {
      testAccount = await nodemailer.createTestAccount();
      fs.writeFile(savedTestFile, JSON.stringify(testAccount), () => console.log('test account saved'));
    } else {
      throw e;
    }
  }
  return testAccount;
}

export async function getSmtpAccount(cfg = config) {
  const smtpAccount = cfg.smtp;
  if (cfg.testMode === true) {
    const testAccount = await getTestAccount();
    smtpAccount.host = testAccount.smtp.host;
    smtpAccount.port = testAccount.smtp.port;
    smtpAccount.auth.user = testAccount.user;
    smtpAccount.auth.pass = testAccount.pass;
    console.log("#############################################");
    console.log(" Test mode: you can see the tests visiting: ");
    console.log(` ${testAccount.web}`);
    console.log(` user: ${testAccount.user}`);
    console.log(` password: ${testAccount.pass}`);
    console.log("#############################################");
  }
  return smtpAccount;
}
