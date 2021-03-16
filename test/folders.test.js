import chai from "chai";
import { Folders } from "../src/folders.js";
import mock from "mock-fs";

const expect = chai.expect;

describe("Allows users to configure the mails folder.", function () {
  it("uses the mailFolder defined in the configuration.", function () {
    expect(Folders.getEmailFolder({ emailFolder: "foo" })).to.equal("foo");
    expect(Folders.getEmailFolder({ foo: "foo" })).not.to.exist;
  });
});

describe("Allows users to configure the alert dates.", function () {

  afterEach(mock.restore);

  it("returns empty list of valid folders for empty input", function () {
    expect(Folders.getValidFolders().length).to.equal([].length);
  });

  it("recognizes all valid folder names", function () {
    const folderNames = allValidFolderNames();
    const mockFs = buildMockFs(folderNames.map(n => `emails/${n}`));
    addFileToAllFolders(mockFs, {name: 'body.txt', contents: 'Foo bar'});
    mock(mockFs);
    const validFolders = Folders.getValidFolders(folderNames);
    expect(validFolders.length).to.equal(folderNames.length);
  });

  it("folders are only valid with body files with either txt, html or mjml extensions.", function () {
    const acceptableBodyExtensions = ['txt', 'html', 'mjml'];
    const folderNames = allValidFolderNames();
    const mockFs = buildMockFs(folderNames.map(n => `emails/${n}`));
    addFileToAllFolders(mockFs, {name: 'body.doc', contents: 'Foo bar'});
    const k = Object.keys(mockFs);
    acceptableBodyExtensions.forEach( (v, i) => {
      mockFs[k[i]][`body.${v}`] = 'foo';
    });
    mock(mockFs);
    const validFolders = Folders.getValidFolders(folderNames);
    expect(validFolders.length).to.equal(3);
    expect(validFolders.every(f => acceptableBodyExtensions.includes(Object.keys(f.files)[0]))).to.be.true;
  });

  it("identifies the folders with mail files", function () {
    const folderNames = allValidFolderNames();
    const mockFs = buildMockFs(folderNames.map(n => `emails/${n}`));
    const target = 'emails/active-past-0';
    mockFs[target]['body.txt'] = 'foo';
    mock(mockFs);
    const validFolders = Folders.getValidFolders(folderNames);
    expect(validFolders.length).to.equal(1);
    expect(validFolders[0].type).to.equal("past");
    expect(validFolders[0].days).to.equal(0);
  });

});


/**
 * Creates a list with all possible names up to 3 days.
 *
 * @returns {Array<string>} the list of possible names.
 */
function allValidFolderNames () {
  const statuses = ['active', 'inactive', ''];
  const timeDirection = ['past', 'within'];
  const numberOfDays = [0, 1, 2, 3];
  const result = [];
  for (let s of statuses) {
    for (let t of timeDirection) {
      for (let d of numberOfDays) {
        const nameFolderList = [s, t, d];
        result.push(nameFolderList.filter(s => s !== '').join('-'));
      }
    }
  }
  return result;
}

/**
 * Creates an object as required by mock-fs to create a mock file system.
 *
 * Converts a list of folder names into an object with such names as keys and
 * empty objects as values.
 *
 * @param {Array<string>} folderNames the list of folder names that should
 * exist in the root of the mock file system.
 *
 * @returns {Object} with folder names as keys and empty objects as values.
 */
function buildMockFs(folderNames) {
  const MockFS = {};
  for (let f of folderNames) {
    MockFS[f] = {};
  }
  return MockFS;
}

/**
 * Adds the provided file to all folders in the mock-fs structure.
 *
 * @param{Object} mockFs the mockFs to add the files to.
 * @param{{name: string, contents: string}} file an object describing a file.
 */
function addFileToAllFolders(mockFs, file) {
  for (let k of Object.keys(mockFs)) {
    mockFs[k][file.name] = file.contents;
  }
}
