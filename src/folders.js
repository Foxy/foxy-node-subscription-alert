import fs from "fs";
import path from "path";
import { config } from "../config.js";

/**
 * FileObject A file object with its contents and type
 *
 * @typedef {{path: string, content: string, type: string}} FileObject
 * @property {string} path The file path
 * @property {string} content The string contents of the file
 * @property {"mjml"|"html"|"txt"} type The file type
 */

/**
 * FileVersions an object that represents the different versions available for a file.
 *
 * @typedef {{txt?: FileObject, html?: FileObject, mjml: FileObject}} FileVersions
 *
 */

/**
 * MailFolder
 *
 * An object representing a particular email alert, complete with the type, number of days, templates available and their contents.
 *
 * @typedef {{ type: string, days: number, folder: string, files: FileVersions, subject: string, status: "active"|"inactive"|"any" }} MailFolder
 * @property {string} type: the type of the mail folder, either within (send in X days) or past (send after X days).
 * @property {number} days: the number of days before or after to send the email
 * @property {string} folder: the folder path
 * @property {FileVersions} files: the file versions for the alert in this folder
 * @property {string} subject: the subject of the message to be sent
 */

/**
 * Returns the available MailFolders in the config.emailFolder directory.
 *
 * @returns {MailFolder[]}
 */
function findFolders() {
  return getFolders(fs.readdirSync(config.emailFolder));
}

/**
 * Return a list of valid email folders
 *
 * @param {string[]} folderList the available folders.
 * @returns {MailFolder[]}
 */
function getFolders(folderList) {
  return folderList.filter(folderValid).map(buildFolder);
}

/**
 * Verifies that a given folder can be used to send emails.
 *
 * @param folder
 * @returns {boolean}
 */
function folderValid(folder) {
  if (!folder.match(/^((active|inactive)-)?(within|past)-\d+$/))
    // the folder name indicates how to send the emails
    return false;
  const folderPath = path.join(config.emailFolder, folder);
  if (!fs.lstatSync(folderPath).isDirectory())
    // it is a directory (not a file)
    return false;
  const files = fs.readdirSync(folderPath);
  return files.some((f) => f.match(/body\.(txt|html|mjml)/)); // it contains the required files
}

/**
 * Creates a list of file objects from a given folder.
 *
 * @param folder
 * @returns {FileObject[]}
 */
function getFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((f) => f.match(/^body\.(txt|html|mjml)/))
    .map((f) => {
      return {
        path: f,
        content: fs.readFileSync(path.join(folder, f)).toString(),
        type: path.extname(f).replace(/^\./, ""),
      };
    });
}

function getSubject(folder) {
  let subject = "Subscription alert.";
  try {
    subject = fs.readFileSync(path.join(folder, "subject.txt")).toString();
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  return subject;
}

/**
 * Reads a folder
 *
 * @param folder
 * @returns {MailFolder}
 */
function buildFolder(folder) {
  const fullFolderPath = path.join(config.emailFolder, folder);
  const match = folder.match(
    /^(?<status>(active|inactive)-)?(?<type>[A-Za-z]+)-(?<days>\d+)$/
  );
  const fileList = getFiles(fullFolderPath);
  const subject = getSubject(path.join(fullFolderPath));
  const files = {};
  for (const f of fileList) {
    files[f.type] = f;
  }
  if (match) {
    return {
      type: match.groups.type,
      days: Number(match.groups.days),
      status: match.groups.status || "any",
      folder,
      files,
      subject,
    };
  }
}

export const Folders = {
  getFolders,
  findFolders,
};
