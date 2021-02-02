import fs from "fs";
import path from "path";
import { config  } from '../config.js';


function findFolders() {
  return getFolders(fs.readdirSync(config.emailFolder));
}

/**
 * Return a list of valid email folders
 *
 * @param {string[]} folderList the available folders.
 * @returns {{within: string, days: number, path: string}[]}
 */
function getFolders(folderList) {
  return folderList
    .filter(folderValid)
    .map(folderTypeAndDays);
}

/**
 * Verifies that a given folder can be used to send emails.
 *
 * @param folder
 * @returns {boolean}
 */
function folderValid(folder) {
  if (!folder.match(/^(within|past)-\d+$/)) // the folder name indicates how to send the emails
    return false;
  const folderPath = path.join(config.emailFolder, folder);
  if (!fs.lstatSync(folderPath).isDirectory()) // it is a directory (not a file)
    return false;
  const files = fs.readdirSync(folderPath);
  return files.some(f => f.match(/body\.(txt|html|mjml)/)); // it contains the required files
}



function folderTypeAndDays(folder) {
  const match = folder.match(/^(?<type>[A-Za-z]+)-(?<days>\d+)$/);
  if (match) {
    match.groups.folder = folder;
    return match.groups;
  }
}

export const Messages = {
  getFolders,
  findFolders
}