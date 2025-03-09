"use strict";
require("core-js/stable");
require("regenerator-runtime/runtime");
const fs = require("fs");
const path = require("path");
const electron = require("electron");
const log = require("electron-log");
const rimraf = require("rimraf");
const common = require("@tiyo/common");
const JSZip = require("jszip");
const uuid = require("uuid");
const nodeUnrarJs = require("node-unrar-js");
const fetch$1 = require("node-fetch");
const pkceChallenge = require("pkce-challenge");
const DiscordRPC = require("discord-rpc");
const electronUpdater = require("electron-updater");
function walk(directory2) {
  let fileList = [];
  const files = fs.readdirSync(directory2);
  for (const file of files) {
    const curPath = path.join(directory2, file);
    if (fs.statSync(curPath).isDirectory()) {
      fileList = [...fileList, ...walk(curPath)];
    } else {
      fileList.push(curPath);
    }
  }
  return fileList;
}
function listDirectory(pathname, directoriesOnly = false) {
  if (!fs.existsSync(pathname)) return [];
  const result = [];
  const files = fs.readdirSync(pathname);
  files.forEach((file) => {
    const fullpath = path.join(pathname, file);
    if (!directoriesOnly || fs.statSync(fullpath).isDirectory()) {
      result.push(fullpath);
    }
  });
  return result;
}
function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "-");
}
function getChapterDownloadPath(series, chapter, downloadsDir) {
  if (!chapter.id) return "";
  const seriesDir1 = sanitizeFilename(series.title);
  const seriesDir2 = series.id || "";
  const chapterDirectories = [
    ...listDirectory(path.join(downloadsDir, seriesDir1)),
    ...listDirectory(path.join(downloadsDir, seriesDir2))
  ];
  const matching = chapterDirectories.find((fullpath) => {
    if (!chapter.id) return false;
    return path.basename(fullpath).includes(chapter.id);
  });
  if (matching) return matching;
  return path.join(downloadsDir, seriesDir1, `Chapter ${chapter.chapterNumber} - ${chapter.id}`);
}
function getAllDownloadedChapterIds(downloadsDir) {
  const seriesDirs = listDirectory(downloadsDir);
  const chapterDirs = [];
  seriesDirs.forEach((seriesDir) => {
    chapterDirs.push(...listDirectory(seriesDir));
  });
  const result = [];
  chapterDirs.forEach((name) => {
    const regex = /(?:[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12})/i;
    const match = name.match(regex);
    if (match) result.push(match[0]);
  });
  return result;
}
async function getChaptersDownloaded(series, chapters, downloadsDir) {
  const seriesDir1 = sanitizeFilename(series.title);
  const seriesDir2 = series.id || "";
  const chapterDirectories = [
    ...listDirectory(path.join(downloadsDir, seriesDir1)),
    ...listDirectory(path.join(downloadsDir, seriesDir2))
  ];
  const result = {};
  chapterDirectories.forEach((fullpath) => {
    const matching = chapters.find((c) => {
      if (!c.id) return false;
      return path.basename(fullpath).includes(c.id);
    });
    if (matching && matching.id) result[matching.id] = true;
  });
  return result;
}
async function getChapterDownloaded(series, chapter, downloadsDir) {
  return getChaptersDownloaded(series, [chapter], downloadsDir).then(
    (statuses) => chapter.id ? statuses[chapter.id] : false
  );
}
async function deleteDownloadedChapter(series, chapter, downloadsDir) {
  console.debug(`Deleting from disk chapter ${chapter.id} from series ${series.id}`);
  if (series.id === void 0 || chapter.id === void 0)
    return new Promise((resolve) => resolve());
  const chapterDownloadPath = getChapterDownloadPath(series, chapter, downloadsDir);
  if (fs.existsSync(chapterDownloadPath)) {
    return rimraf.rimraf(chapterDownloadPath).then(() => {
      const seriesDir = path.dirname(chapterDownloadPath);
      if (fs.existsSync(seriesDir) && fs.readdirSync(seriesDir).length === 0) {
        fs.rmdirSync(seriesDir);
      }
    });
  }
  return new Promise((resolve) => resolve());
}
async function getThumbnailPath(series, thumbnailsDir) {
  if (series.remoteCoverUrl === "") return null;
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir);
  }
  const extMatch = series.remoteCoverUrl.match(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i);
  const ext = extMatch ? extMatch[1] : "jpg";
  return path.join(thumbnailsDir, `${series.id}.${ext}`);
}
async function downloadThumbnail(thumbnailPath, data) {
  const url = typeof data === "string" ? data : URL.createObjectURL(new Blob([data]));
  fetch(url).then((response) => response.arrayBuffer()).then((buffer) => {
    fs.writeFile(thumbnailPath, new Uint8Array(buffer), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }).catch((e) => console.error(e));
}
async function deleteThumbnail(series, thumbnailsDir) {
  if (!fs.existsSync(thumbnailsDir)) return;
  const files = fs.readdirSync(thumbnailsDir);
  for (const file of files) {
    if (file.startsWith(`${series.id}.`)) {
      const curPath = path.join(thumbnailsDir, file);
      console.debug(`Deleting thumbnail at ${curPath}`);
      fs.unlink(curPath, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
}
const FS_METADATA = {
  id: "9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab",
  name: "filesystem",
  url: "",
  translatedLanguage: void 0
};
const ZIP_EXTENSIONS = [".zip", ".cbz"];
const RAR_EXTENSIONS = [".rar", ".cbr"];
async function extractZip(archive, archiveOutputPath) {
  const zip = await new JSZip.external.Promise((resolve, reject) => {
    fs.readFile(archive, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then((data) => {
    return JSZip.loadAsync(data);
  });
  return Promise.all(
    Object.keys(zip.files).map((internalFilename) => {
      return new Promise((resolve) => {
        const outputPath = path.join(archiveOutputPath, path.basename(internalFilename));
        zip.files[internalFilename].nodeStream().pipe(fs.createWriteStream(outputPath)).on("finish", () => resolve(outputPath));
      });
    })
  );
}
async function extractRar(archive, archiveOutputPath) {
  const buf = Uint8Array.from(fs.readFileSync(archive)).buffer;
  const extractor = await nodeUnrarJs.createExtractorFromData({ data: buf });
  const { files: rarFiles } = extractor.extract({
    files: ({ flags }) => !flags.encrypted
  });
  const extractedPaths = [];
  for (const { extraction, fileHeader } of rarFiles) {
    if (!fileHeader.flags.directory) {
      const outputPath = path.join(archiveOutputPath, path.basename(fileHeader.name));
      const outputBuf = extraction;
      fs.writeFileSync(outputPath, outputBuf);
      extractedPaths.push(outputPath);
    }
  }
  return extractedPaths;
}
async function extract(archive, baseOutputPath) {
  console.info(`Extracting files from ${archive} to ${baseOutputPath}`);
  if (!fs.existsSync(baseOutputPath)) {
    fs.mkdirSync(baseOutputPath, { recursive: true });
  }
  fs.readdirSync(baseOutputPath, { withFileTypes: true }).filter((dirent) => dirent.isDirectory()).forEach((dirent) => {
    try {
      fs.rmSync(path.join(baseOutputPath, dirent.name), { recursive: true });
    } catch (e) {
      console.error(`Could not remove directory in extracted location: ${dirent.name}`, e);
    }
  });
  const subdirectory = uuid.v4();
  const archiveOutputPath = path.join(baseOutputPath, subdirectory);
  fs.mkdirSync(archiveOutputPath, { recursive: true });
  if (ZIP_EXTENSIONS.some((ext) => archive.endsWith(ext))) {
    return extractZip(archive, archiveOutputPath);
  }
  if (RAR_EXTENSIONS.some((ext) => archive.endsWith(ext))) {
    return extractRar(archive, archiveOutputPath);
  }
  throw Error(`Tried to extract unsupported archive: ${archive}`);
}
const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp"
];
const constants = {
  IMAGE_EXTENSIONS
};
const isSupportedArchivePath = (str) => {
  return ["zip", "rar", "cbz", "cbr"].some((ext) => {
    return str.endsWith(`.${ext}`);
  });
};
const filterImageFiles = (fileList) => {
  const collator = new Intl.Collator([], { numeric: true });
  return fileList.filter((file) => constants.IMAGE_EXTENSIONS.some((ext) => file.endsWith(`.${ext}`))).sort((a, b) => collator.compare(path.basename(a), path.basename(b)));
};
const getPageRequesterDataFromArchive = async (archivePath, extractPath) => {
  const extractedFilenames = await extract(archivePath, extractPath);
  const imageFilenames = filterImageFiles(extractedFilenames);
  return {
    server: "",
    hash: "",
    numPages: imageFilenames.length,
    pageFilenames: imageFilenames
  };
};
const getPageRequesterDataFromDirectory = async (dirPath) => {
  const fileList = walk(dirPath);
  const imageFileList = filterImageFiles(fileList);
  return new Promise((resolve) => {
    resolve({
      server: "",
      hash: "",
      numPages: imageFileList.length,
      pageFilenames: imageFileList
    });
  });
};
const parseChapterMetadata = (text) => {
  const matchChapterNum = text.match(/c\d*\.?\d+/g);
  const matchVolumeNum = text.match(/v(\d)+/g);
  const matchGroup = text.match(/\[.*\]/g);
  const matchAnyNum = text.match(/\d*\.?\d+/g);
  let chapterNum = "";
  if (matchChapterNum === null) {
    if (matchAnyNum !== null && matchVolumeNum === null) {
      chapterNum = parseFloat(matchAnyNum[0]).toString();
    }
  } else {
    const matchNumber = matchChapterNum[0].match(/\d*\.?\d+/g);
    chapterNum = matchNumber ? parseFloat(matchNumber[0]).toString() : "";
  }
  let volumeNum = "";
  if (matchVolumeNum !== null) {
    const matchNumber = matchVolumeNum[0].match(/(\d)+/g);
    volumeNum = matchNumber ? parseFloat(matchNumber[0]).toString() : "";
  }
  const group = matchGroup === null ? "" : matchGroup[0].replace("[", "").replace("]", "");
  return {
    title: text.trim(),
    chapterNum,
    volumeNum,
    group: group.trim()
  };
};
class FSExtensionClient extends common.ExtensionClientAbstract {
  constructor() {
    super(...arguments);
    this.extractPath = void 0;
    this.getSeries = (id) => {
      return new Promise((resolve, reject) => {
        try {
          const dirName = path.basename(id);
          const series = {
            id: void 0,
            extensionId: FS_METADATA.id,
            sourceId: id,
            title: dirName.trim(),
            altTitles: [],
            description: "",
            authors: [],
            artists: [],
            tags: [],
            status: common.SeriesStatus.COMPLETED,
            originalLanguageKey: common.LanguageKey.JAPANESE,
            numberUnread: 0,
            remoteCoverUrl: "",
            trackerKeys: {}
          };
          resolve(series);
        } catch (err) {
          reject(err);
        }
      });
    };
    this.getChapters = (id) => {
      return new Promise((resolve, reject) => {
        try {
          const fileList = walk(id);
          const chapterPaths = /* @__PURE__ */ new Set();
          fileList.forEach((file) => {
            chapterPaths.add(path.dirname(file));
            if (isSupportedArchivePath(file)) {
              chapterPaths.add(file);
              chapterPaths.delete(path.dirname(file));
            }
          });
          const chapters = Array.from(chapterPaths).map((chapterPath) => {
            const metadata = parseChapterMetadata(path.basename(chapterPath));
            return {
              sourceId: chapterPath,
              title: metadata.title,
              chapterNumber: metadata.chapterNum,
              volumeNumber: metadata.volumeNum,
              languageKey: common.LanguageKey.ENGLISH,
              groupName: metadata.group,
              time: (/* @__PURE__ */ new Date()).getTime(),
              read: false
            };
          });
          resolve(chapters);
        } catch (err) {
          reject(err);
        }
      });
    };
    this.getPageRequesterData = (_seriesSourceId, chapterSourceId) => {
      const isArchive = isSupportedArchivePath(chapterSourceId);
      return isArchive ? getPageRequesterDataFromArchive(chapterSourceId, this.extractPath) : getPageRequesterDataFromDirectory(chapterSourceId);
    };
    this.getPageUrls = (pageRequesterData) => {
      return pageRequesterData.pageFilenames;
    };
    this.getImage = (_series, url) => {
      return new Promise((resolve) => {
        resolve(url);
      });
    };
    this.getSearch = () => {
      return new Promise(
        (resolve) => resolve({ seriesList: [], hasMore: false })
      );
    };
    this.getDirectory = () => {
      return new Promise(
        (resolve) => resolve({ seriesList: [], hasMore: false })
      );
    };
    this.getSettingTypes = () => {
      return {};
    };
    this.getSettings = () => {
      return {};
    };
    this.setSettings = () => {
    };
    this.getFilterOptions = () => [];
  }
}
const APP = {
  CHECK_FOR_UPDATES: "check-for-updates",
  PERFORM_UPDATE: "perform-update",
  UPDATE_AND_RESTART: "update-and-restart",
  SEND_NOTIFICATION: "send-notification",
  LOAD_STORED_EXTENSION_SETTINGS: "load-stored-extension-settings",
  SHOW_OPEN_DIALOG: "show-open-dialog",
  SHOW_RESTART_UPDATE_DIALOG: "show-restart-update-dialog",
  SHOW_PERFORM_UPDATE_DIALOG: "show-perform-update-dialog",
  READ_ENTIRE_FILE: "read-entire-file"
};
const WINDOW = {
  MINIMIZE: "window-minimize",
  MAX_RESTORE: "window-max-restore",
  CLOSE: "window-close",
  SET_FULLSCREEN: "set-fullscreen",
  TOGGLE_FULLSCREEN: "toggle-fullscreen"
};
const GET_PATH = {
  THUMBNAILS_DIR: "get-thumbnails-dir",
  PLUGINS_DIR: "get-plugins-dir",
  DEFAULT_DOWNLOADS_DIR: "get-default-downloads-dir",
  LOGS_DIR: "get-logs-dir"
};
const GET_ALL_FILES = "get-all-files";
const EXTENSION_MANAGER = {
  RELOAD: "extension-manager-reload",
  INSTALL: "extension-manager-install",
  UNINSTALL: "extension-manager-uninstall",
  LIST: "extension-manager-list",
  GET: "extension-manager-get",
  GET_ALL: "extension-manager-get-all",
  CHECK_FOR_UPDATES: "extension-manager-check-for-updates",
  GET_TIYO_VERSION: "extension-manager-get-tiyo-version"
};
const EXTENSION = {
  GET_SERIES: "extension-getSeries",
  GET_CHAPTERS: "extension-getChapters",
  GET_PAGE_REQUESTER_DATA: "extension-getPageRequesterData",
  GET_PAGE_URLS: "extension-getPageUrls",
  GET_IMAGE: "extension-getImage",
  SEARCH: "extension-search",
  DIRECTORY: "extension-directory",
  GET_SETTING_TYPES: "extension-getSettingTypes",
  GET_SETTINGS: "extension-getSettings",
  SET_SETTINGS: "extension-setSettings",
  GET_FILTER_OPTIONS: "extension-getFilterOptions"
};
const FILESYSTEM = {
  GET_CHAPTER_DOWNLOAD_PATH: "filesystem-get-chapter-download-path",
  GET_CHAPTERS_DOWNLOADED: "filesystem-get-chapters-downloaded",
  GET_CHAPTER_DOWNLOADED: "filesystem-get-chapter-downloaded",
  DELETE_DOWNLOADED_CHAPTER: "filesystem-delete-downloaded-chapter",
  GET_ALL_DOWNLOADED_CHAPTER_IDS: "filesystem-get-all-downloaded-chapter-ids",
  GET_THUMBNAIL_PATH: "filesystem-get-thumbnail-path",
  DOWNLOAD_THUMBNAIL: "filesystem-download-thumbnail",
  DELETE_THUMBNAIL: "filesystem-delete-thumbnail",
  LIST_DIRECTORY: "filesystem-list-directory"
};
const TRACKER_MANAGER = {
  GET_ALL: "tracker-manager-get-alls"
};
const TRACKER = {
  GET_AUTH_URLS: "tracker-getAuthUrls",
  GET_TOKEN: "tracker-getToken",
  GET_USERNAME: "tracker-getUsername",
  SEARCH: "tracker-search",
  GET_LIBRARY_ENTRY: "tracker-getLibraryEntry",
  ADD_LIBRARY_ENTRY: "tracker-addLibraryEntry",
  UPDATE_LIBRARY_ENTRY: "tracker-updateLibraryEntry",
  SET_ACCESS_TOKEN: "tracker-setAccessToken",
  GET_LIST_ENTRIES: "tracker-getListEntries"
};
const INTEGRATION = {
  DISCORD_SET_ACTIVITY: "integration-discordSetActivity"
};
const ipcChannels = {
  APP,
  WINDOW,
  GET_PATH,
  GET_ALL_FILES,
  EXTENSION_MANAGER,
  EXTENSION,
  FILESYSTEM,
  TRACKER_MANAGER,
  TRACKER,
  INTEGRATION
};
const THUMBNAILS_DIR = path.join(electron.app.getPath("userData"), "thumbnails");
const PLUGINS_DIR = path.join(electron.app.getPath("userData"), "plugins");
const DEFAULT_DOWNLOADS_DIR = path.join(electron.app.getPath("userData"), "downloads");
const LOGS_DIR = path.join(electron.app.getPath("userData"), "logs");
const EXTRACT_DIR = path.join(electron.app.getPath("userData"), "extracted");
const aki = require("aki-plugin-manager");
const TIYO_PACKAGE_NAME = "@tiyo/core";
let TIYO_CLIENT = null;
let FILESYSTEM_EXTENSION = null;
async function loadPlugins(spoofWindow) {
  if (TIYO_CLIENT !== null) {
    TIYO_CLIENT = null;
    Object.keys(require.cache).forEach((name) => {
      if (name.includes(`/${TIYO_PACKAGE_NAME}/`)) {
        delete require.cache[name];
      }
    });
  }
  if (FILESYSTEM_EXTENSION !== null) {
    FILESYSTEM_EXTENSION = null;
  }
  console.info("Checking for Tiyo plugin...");
  aki.list(PLUGINS_DIR).forEach((pluginDetails) => {
    const pluginName = pluginDetails[0];
    if (pluginName === TIYO_PACKAGE_NAME) {
      const mod = aki.load(
        PLUGINS_DIR,
        pluginName,
        /**
         *  TODO can maybe remove this eval now. It was done here to avoid being
         *  overwritten by webpack, which doesn't seem to happen with vite
         */
        eval("require")
      );
      TIYO_CLIENT = new mod.TiyoClient(spoofWindow);
      console.info(
        `Loaded Tiyo plugin v${TIYO_CLIENT.getVersion()}; it has ${Object.keys(TIYO_CLIENT.getExtensions()).length} extensions`
      );
    } else {
      console.warn(`Ignoring unsupported plugin: ${pluginName}`);
    }
  });
  console.info("Initializing filesystem extension...");
  FILESYSTEM_EXTENSION = new FSExtensionClient(() => new Promise((_resolve, reject) => reject()));
  FILESYSTEM_EXTENSION.extractPath = EXTRACT_DIR;
}
function getExtensionClient(extensionId) {
  if (extensionId === FS_METADATA.id) return FILESYSTEM_EXTENSION;
  return TIYO_CLIENT.getExtensions()[extensionId].client;
}
function getSeries(extensionId, seriesId) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting series ${seriesId} from extension ${extensionId}`);
  return extension.getSeries(seriesId).catch((err) => {
    console.error(err);
    return void 0;
  });
}
function getChapters(extensionId, seriesId) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting chapters for series ${seriesId} from extension ${extensionId}`);
  return extension.getChapters(seriesId).catch((err) => {
    console.error(err);
    return [];
  });
}
function getPageRequesterData(extensionId, seriesSourceId, chapterSourceId) {
  const extension = getExtensionClient(extensionId);
  console.info(
    `Getting page requester data for series ${seriesSourceId} chapter ${chapterSourceId} from extension ${extensionId}`
  );
  return extension.getPageRequesterData(seriesSourceId, chapterSourceId).catch((err) => {
    console.error(err);
    return { server: "", hash: "", numPages: 0, pageFilenames: [] };
  });
}
function getPageUrls(extensionId, pageRequesterData) {
  try {
    const extension = getExtensionClient(extensionId);
    const pageUrls = extension.getPageUrls(pageRequesterData);
    return pageUrls;
  } catch (err) {
    console.error(err);
    return [];
  }
}
async function getImage(extensionId, series, url) {
  const extension = getExtensionClient(extensionId);
  return extension.getImage(series, url).catch((err) => {
    console.error(err);
    return "";
  });
}
function search$1(extensionId, text, page, filterValues) {
  const extension = getExtensionClient(extensionId);
  console.info(`Searching for "${text}" page=${page} from extension ${extensionId}`);
  return extension.getSearch(text, page, filterValues).catch((err) => {
    console.error(err);
    return { seriesList: [], hasMore: false };
  });
}
function directory(extensionId, page, filterValues) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting directory page=${page} from extension ${extensionId}`);
  return extension.getDirectory(page, filterValues).catch((err) => {
    console.error(err);
    return { seriesList: [], hasMore: false };
  });
}
function getSettingTypes(extensionId) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting setting types from extension ${extensionId}`);
  try {
    return extension.getSettingTypes();
  } catch (err) {
    console.error(err);
    return {};
  }
}
function getSettings(extensionId) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting settings from extension ${extensionId}`);
  try {
    return extension.getSettings();
  } catch (err) {
    console.error(err);
    return {};
  }
}
function setSettings(extensionId, settings) {
  const extension = getExtensionClient(extensionId);
  console.info(`Setting settings from extension ${extensionId}`);
  try {
    extension.setSettings(settings);
  } catch (err) {
    console.error(err);
  }
}
function getFilterOptions(extensionId) {
  const extension = getExtensionClient(extensionId);
  console.info(`Getting filter options from extension ${extensionId}`);
  try {
    return extension.getFilterOptions();
  } catch (err) {
    console.error(err);
    return [];
  }
}
const createExtensionIpcHandlers = (ipcMain, spoofWindow2) => {
  console.debug("Creating extension IPC handlers in main...");
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.RELOAD, async (event) => {
    await loadPlugins(spoofWindow2);
    return event.sender.send(ipcChannels.APP.LOAD_STORED_EXTENSION_SETTINGS);
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.INSTALL, (_event, name, version2) => {
    return new Promise((resolve) => {
      aki.install(name, version2, PLUGINS_DIR, () => {
        resolve();
      });
    });
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.UNINSTALL, (_event, name) => {
    return new Promise((resolve) => {
      aki.uninstall(name, PLUGINS_DIR, () => {
        resolve();
      });
    });
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.LIST, async () => {
    return aki.list(PLUGINS_DIR);
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.GET, async (_event, extensionId) => {
    if (extensionId === FS_METADATA.id) {
      return FS_METADATA;
    }
    if (TIYO_CLIENT && Object.keys(TIYO_CLIENT.getExtensions()).includes(extensionId)) {
      return TIYO_CLIENT.getExtensions()[extensionId].metadata;
    }
    return void 0;
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.GET_ALL, () => {
    const result = [FS_METADATA];
    if (TIYO_CLIENT) {
      result.push(...Object.values(TIYO_CLIENT.getExtensions()).map((e) => e.metadata));
    }
    return result;
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.GET_TIYO_VERSION, () => {
    return TIYO_CLIENT ? TIYO_CLIENT.getVersion() : void 0;
  });
  ipcMain.handle(ipcChannels.EXTENSION_MANAGER.CHECK_FOR_UPDATES, async () => {
    return {};
  });
  ipcMain.handle(
    ipcChannels.EXTENSION.GET_SERIES,
    (_event, extensionId, seriesId) => {
      return getSeries(extensionId, seriesId);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.GET_CHAPTERS,
    (_event, extensionId, seriesId) => {
      return getChapters(extensionId, seriesId);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.GET_PAGE_REQUESTER_DATA,
    (_event, extensionId, seriesSourceId, chapterSourceId) => {
      return getPageRequesterData(extensionId, seriesSourceId, chapterSourceId);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.GET_PAGE_URLS,
    (_event, extensionId, pageRequesterData) => {
      return getPageUrls(extensionId, pageRequesterData);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.GET_IMAGE,
    (_event, extensionId, series, url) => {
      return getImage(extensionId, series, url);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.SEARCH,
    (_event, extensionId, text, page, filterValues) => {
      return search$1(extensionId, text, page, filterValues);
    }
  );
  ipcMain.handle(
    ipcChannels.EXTENSION.DIRECTORY,
    (_event, extensionId, page, filterValues) => {
      return directory(extensionId, page, filterValues);
    }
  );
  ipcMain.handle(ipcChannels.EXTENSION.GET_SETTING_TYPES, (_event, extensionId) => {
    return getSettingTypes(extensionId);
  });
  ipcMain.handle(ipcChannels.EXTENSION.GET_SETTINGS, (_event, extensionId) => {
    return getSettings(extensionId);
  });
  ipcMain.handle(
    ipcChannels.EXTENSION.SET_SETTINGS,
    (_event, extensionId, settings) => {
      return setSettings(extensionId, settings);
    }
  );
  ipcMain.handle(ipcChannels.EXTENSION.GET_FILTER_OPTIONS, (_event, extensionId) => {
    return getFilterOptions(extensionId);
  });
};
const productName = "Comicers";
const version = "2.16.0";
const packageJson = {
  productName,
  version
};
class TrackerClientAbstract {
  constructor(accessToken = "") {
    this.setAccessToken = (accessToken2) => {
      this.accessToken = accessToken2;
    };
    this.accessToken = accessToken;
  }
}
var TrackScoreFormat = /* @__PURE__ */ ((TrackScoreFormat2) => {
  TrackScoreFormat2["POINT_100"] = "POINT_100";
  TrackScoreFormat2["POINT_10_DECIMAL"] = "POINT_10_DECIMAL";
  TrackScoreFormat2["POINT_10_DECIMAL_ONE_DIGIT"] = "POINT_10_SINGLE_DECIMAL";
  TrackScoreFormat2["POINT_10"] = "POINT_10";
  TrackScoreFormat2["POINT_5"] = "POINT_5";
  TrackScoreFormat2["POINT_3"] = "POINT_3";
  return TrackScoreFormat2;
})(TrackScoreFormat || {});
var TrackStatus = /* @__PURE__ */ ((TrackStatus2) => {
  TrackStatus2["Reading"] = "Reading";
  TrackStatus2["Planning"] = "Planning";
  TrackStatus2["Completed"] = "Completed";
  TrackStatus2["Dropped"] = "Dropped";
  TrackStatus2["Paused"] = "Paused";
  return TrackStatus2;
})(TrackStatus || {});
({
  [
    "ApplicationTheme"
    /* ApplicationTheme */
  ]: common.SettingType.STRING,
  [
    "ChapterLanguages"
    /* ChapterLanguages */
  ]: common.SettingType.STRING_ARRAY,
  [
    "RefreshOnStart"
    /* RefreshOnStart */
  ]: common.SettingType.BOOLEAN,
  [
    "AutoCheckForUpdates"
    /* AutoCheckForUpdates */
  ]: common.SettingType.BOOLEAN,
  [
    "autoBackup"
    /* autoBackup */
  ]: common.SettingType.BOOLEAN,
  [
    "autoBackupCount"
    /* autoBackupCount */
  ]: common.SettingType.NUMBER,
  [
    "ConfirmRemoveSeries"
    /* ConfirmRemoveSeries */
  ]: common.SettingType.BOOLEAN,
  [
    "CustomDownloadsDir"
    /* CustomDownloadsDir */
  ]: common.SettingType.STRING,
  [
    "LibraryColumns"
    /* LibraryColumns */
  ]: common.SettingType.NUMBER,
  [
    "LibraryView"
    /* LibraryView */
  ]: common.SettingType.STRING,
  [
    "LibrarySort"
    /* LibrarySort */
  ]: common.SettingType.STRING,
  [
    "LibraryFilterStatus"
    /* LibraryFilterStatus */
  ]: common.SettingType.STRING,
  [
    "LibraryFilterProgress"
    /* LibraryFilterProgress */
  ]: common.SettingType.STRING,
  [
    "LibraryFilterCategory"
    /* LibraryFilterCategory */
  ]: common.SettingType.STRING,
  [
    "LibraryCropCovers"
    /* LibraryCropCovers */
  ]: common.SettingType.BOOLEAN,
  [
    "ChapterListVolOrder"
    /* ChapterListVolOrder */
  ]: common.SettingType.STRING,
  [
    "ChapterListChOrder"
    /* ChapterListChOrder */
  ]: common.SettingType.STRING,
  [
    "ChapterListPageSize"
    /* ChapterListPageSize */
  ]: common.SettingType.NUMBER,
  [
    "FitContainToWidth"
    /* FitContainToWidth */
  ]: common.SettingType.BOOLEAN,
  [
    "FitContainToHeight"
    /* FitContainToHeight */
  ]: common.SettingType.BOOLEAN,
  [
    "FitStretch"
    /* FitStretch */
  ]: common.SettingType.BOOLEAN,
  [
    "ReadingDirection"
    /* ReadingDirection */
  ]: common.SettingType.STRING,
  [
    "PageStyle"
    /* PageStyle */
  ]: common.SettingType.STRING,
  [
    "PreloadAmount"
    /* PreloadAmount */
  ]: common.SettingType.NUMBER,
  [
    "OverlayPageNumber"
    /* OverlayPageNumber */
  ]: common.SettingType.BOOLEAN,
  [
    "HideScrollbar"
    /* HideScrollbar */
  ]: common.SettingType.BOOLEAN,
  [
    "PageGap"
    /* PageGap */
  ]: common.SettingType.BOOLEAN,
  [
    "MaxPageWidth"
    /* MaxPageWidth */
  ]: common.SettingType.NUMBER,
  [
    "PageWidthMetric"
    /* PageWidthMetric */
  ]: common.SettingType.STRING,
  [
    "OffsetPages"
    /* OffsetPages */
  ]: common.SettingType.STRING,
  [
    "OptimizeContrast"
    /* OptimizeContrast */
  ]: common.SettingType.BOOLEAN,
  [
    "KeyPageLeft"
    /* KeyPageLeft */
  ]: common.SettingType.STRING,
  [
    "KeyFirstPage"
    /* KeyFirstPage */
  ]: common.SettingType.STRING,
  [
    "KeyPageRight"
    /* KeyPageRight */
  ]: common.SettingType.STRING,
  [
    "KeyLastPage"
    /* KeyLastPage */
  ]: common.SettingType.STRING,
  [
    "KeyChapterLeft"
    /* KeyChapterLeft */
  ]: common.SettingType.STRING,
  [
    "KeyChapterRight"
    /* KeyChapterRight */
  ]: common.SettingType.STRING,
  [
    "KeyToggleReadingDirection"
    /* KeyToggleReadingDirection */
  ]: common.SettingType.STRING,
  [
    "KeyTogglePageStyle"
    /* KeyTogglePageStyle */
  ]: common.SettingType.STRING,
  [
    "KeyToggleShowingSettingsModal"
    /* KeyToggleShowingSettingsModal */
  ]: common.SettingType.STRING,
  [
    "KeyToggleShowingSidebar"
    /* KeyToggleShowingSidebar */
  ]: common.SettingType.STRING,
  [
    "KeyToggleFullscreen"
    /* KeyToggleFullscreen */
  ]: common.SettingType.STRING,
  [
    "KeyExit"
    /* KeyExit */
  ]: common.SettingType.STRING,
  [
    "KeyCloseOrBack"
    /* KeyCloseOrBack */
  ]: common.SettingType.STRING,
  [
    "KeyToggleOffsetDoubleSpreads"
    /* KeyToggleOffsetDoubleSpreads */
  ]: common.SettingType.STRING,
  [
    "TrackerAutoUpdate"
    /* TrackerAutoUpdate */
  ]: common.SettingType.BOOLEAN,
  [
    "DiscordPresenceEnabled"
    /* DiscordPresenceEnabled */
  ]: common.SettingType.BOOLEAN
});
const AniListTrackerMetadata = {
  id: "AniList",
  name: "AniList",
  url: "https://anilist.co",
  hasCustomLists: false
};
const MUTrackerMetadata = {
  id: "MangaUpdates",
  name: "MangaUpdates",
  url: "https://mangaupdates.com",
  hasCustomLists: true
};
const MALTrackerMetadata = {
  id: "MyAnimeList",
  name: "MyAnimeList",
  url: "https://myanimelist.net",
  hasCustomLists: false
};
const clientId = "23253";
const STATUS_MAP$1 = {
  CURRENT: TrackStatus.Reading,
  PLANNING: TrackStatus.Planning,
  COMPLETED: TrackStatus.Completed,
  DROPPED: TrackStatus.Dropped,
  PAUSED: TrackStatus.Paused,
  REREADING: TrackStatus.Reading
};
const SCORE_FORMAT_MAP = {
  POINT_10: TrackScoreFormat.POINT_10,
  POINT_100: TrackScoreFormat.POINT_100,
  POINT_10_DECIMAL: TrackScoreFormat.POINT_10_DECIMAL,
  POINT_5: TrackScoreFormat.POINT_5,
  POINT_3: TrackScoreFormat.POINT_3
};
class AniListTrackerClient extends TrackerClientAbstract {
  constructor(accessToken = "") {
    super(accessToken);
    this.getMetadata = () => {
      return AniListTrackerMetadata;
    };
    this.getAuthUrl = () => {
      return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`;
    };
    this.getToken = (code) => {
      return new Promise((resolve) => resolve(code));
    };
    this.getUsername = () => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const query = `
      query User {
        Viewer {
          id
          name
          mediaListOptions {
            scoreFormat
          }
        }
      }`.trim();
      const url = "https://graphql.anilist.co";
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ query })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("errors" in data) {
          console.error(
            `Error getting username from tracker ${AniListTrackerMetadata.id}: ${data.errors.map((error) => error.message).join("; ")}`
          );
          return null;
        }
        this.userId = data.data.Viewer.id;
        this.userScoreFormat = SCORE_FORMAT_MAP[data.data.Viewer.mediaListOptions.scoreFormat];
        return data.data.Viewer.name;
      }).catch((e) => console.error(e));
    };
    this.search = (text) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve([]));
      const query = `
      query Search(${"$"}query: String) {
        Page (perPage: 10) {
          media (search: ${"$"}query, type: MANGA, format_not_in: [NOVEL]) {
            id
            title {
              romaji
            }
            coverImage {
              large
            }
            description
          }
        }
      }`.trim();
      const url = "https://graphql.anilist.co";
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ query, variables: { query: text } })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("errors" in data) {
          console.error(
            `Error searching from tracker ${AniListTrackerMetadata.id}: ${data.errors.map((error) => error.message).join("; ")}`
          );
          return null;
        }
        return data.data.Page.media.map((media) => ({
          id: media.id,
          title: media.title.romaji,
          description: media.description === null ? "" : media.description,
          coverUrl: media.coverImage.large
        }));
      }).catch((e) => {
        console.error(e);
        return [];
      });
    };
    this.getLibraryEntry = async (seriesId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (this.userId === "" || this.userScoreFormat === void 0) await this.getUsername();
      if (this.userId === "") return null;
      const query = `
      query (${"$"}id: Int!, ${"$"}manga_id: Int!) {
        MediaList (userId: ${"$"}id, type: MANGA, mediaId: ${"$"}manga_id) {
          id
          status
          score
          progress
          media {
            id
            title {
              romaji
            }
            coverImage {
              large
            }
            description
          }
        }
      }`.trim();
      const url = "https://graphql.anilist.co";
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          query,
          variables: { id: this.userId, manga_id: seriesId }
        })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("errors" in data) {
          console.warn(
            `Error getting library entry for series ${seriesId} from tracker from tracker ${AniListTrackerMetadata.id}: ${data.errors.map((error) => error.message).join("; ")}`
          );
          return null;
        }
        return {
          id: data.data.MediaList.id,
          seriesId: data.data.MediaList.media.id,
          title: data.data.MediaList.media.title.romaji,
          description: data.data.MediaList.media.description,
          coverUrl: data.data.MediaList.media.coverImage.large,
          score: data.data.MediaList.score,
          scoreFormat: this.userScoreFormat,
          progress: data.data.MediaList.progress,
          status: STATUS_MAP$1[data.data.MediaList.status]
        };
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.addLibraryEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (this.userId === "") await this.getUsername();
      if (this.userId === "") return null;
      const query = `
      mutation AddManga(${"$"}mangaId: Int, ${"$"}progress: Int, ${"$"}status: MediaListStatus) {
        SaveMediaListEntry (mediaId: ${"$"}mangaId, progress: ${"$"}progress, status: ${"$"}status) { 
          id 
          status 
        } 
      }`.trim();
      const url = "https://graphql.anilist.co";
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          query,
          variables: {
            mangaId: trackEntry.seriesId,
            progress: trackEntry.progress,
            status: Object.keys(STATUS_MAP$1).find(
              (key) => STATUS_MAP$1[key] === trackEntry.status
            )
          }
        })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("errors" in data) {
          console.error(
            `Error adding library entry for series ${trackEntry.seriesId} from tracker ${AniListTrackerMetadata.id}: ${data.errors.map((error) => error.message).join("; ")}`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.updateLibraryEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (this.userId === "" || this.userScoreFormat === void 0) await this.getUsername();
      if (this.userId === "") return null;
      const prevEntry = await this.getLibraryEntry(trackEntry.seriesId);
      if (prevEntry === null)
        return this.addLibraryEntry(trackEntry).then(() => this.updateLibraryEntry(trackEntry));
      trackEntry.id = prevEntry.id;
      if (trackEntry.progress === void 0) {
        trackEntry.progress = prevEntry.progress;
      }
      if (trackEntry.status === void 0) {
        trackEntry.status = prevEntry.status;
      }
      if (trackEntry.score === void 0) {
        trackEntry.score = prevEntry.score;
      }
      const query = `
      mutation UpdateManga (
        ${"$"}listId: Int, ${"$"}progress: Int, ${"$"}status: MediaListStatus, ${"$"}score: Float
      ) {
        SaveMediaListEntry (
          id: ${"$"}listId, progress: ${"$"}progress, status: ${"$"}status, score: ${"$"}score
        ) {
          id
          progress
          status
        }
      }`.trim();
      const url = "https://graphql.anilist.co";
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          query,
          variables: {
            listId: trackEntry.id,
            progress: trackEntry.progress,
            status: Object.keys(STATUS_MAP$1).find(
              (key) => STATUS_MAP$1[key] === trackEntry.status
            ),
            score: trackEntry.score === void 0 ? 0 : trackEntry.score
          }
        })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("errors" in data) {
          console.error(
            `Error updating library entry for series ${trackEntry.seriesId} from tracker ${AniListTrackerMetadata.id}: ${data.errors.map((error) => error.message).join("; ")}`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.userId = "";
  }
}
const CLIENT_ID = "da33fd0a72e2c77f1b30552407ca5ed2";
const BASE_URL$1 = "https://api.myanimelist.net/v2";
const OAUTH_BASE_URL = "https://myanimelist.net/v1/oauth2";
const STATUS_MAP = {
  reading: TrackStatus.Reading,
  plan_to_read: TrackStatus.Planning,
  completed: TrackStatus.Completed,
  dropped: TrackStatus.Dropped,
  on_hold: TrackStatus.Paused
};
class MALTrackerClient extends TrackerClientAbstract {
  constructor(accessToken = "") {
    super(accessToken);
    this.getMetadata = () => {
      return MALTrackerMetadata;
    };
    this.getAuthUrl = () => {
      const pkceCode = pkceChallenge(43);
      this.latestPkceCode = pkceCode;
      console.debug("[MAL Auth] Generated PKCE challenge:", {
        code_challenge: pkceCode.code_challenge,
        code_verifier: pkceCode.code_verifier
      });
      const params = {
        response_type: "code",
        client_id: CLIENT_ID,
        code_challenge: pkceCode.code_challenge,
        code_challenge_method: "plain",
        redirect_uri: "https://comicers.org"
      };
      const queryString = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
      return `${OAUTH_BASE_URL}/authorize?${queryString}`;
    };
    this.getToken = async (code) => {
      if (!this.latestPkceCode) {
        console.error("[MAL Auth] No PKCE code available for token request");
        return null;
      }
      console.debug("[MAL Auth] Starting token request with:", {
        code,
        code_verifier: this.latestPkceCode.code_verifier
      });
      const url = `${OAUTH_BASE_URL}/token`;
      const formData = new URLSearchParams({
        client_id: CLIENT_ID,
        code,
        code_verifier: this.latestPkceCode.code_verifier,
        grant_type: "authorization_code"
      });
      try {
        const response = await fetch$1(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        });
        const text = await response.text();
        console.debug("[MAL Auth] Token response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: text
        });
        if (!response.ok) {
          console.error("[MAL Auth] Token request failed:", response.status, text);
          return null;
        }
        try {
          const data = JSON.parse(text);
          if ("error" in data || !data.access_token) {
            console.error("[MAL Auth] Invalid token response:", data);
            return null;
          }
          console.debug("[MAL Auth] Successfully retrieved access token");
          return data.access_token;
        } catch (e) {
          console.error("[MAL Auth] Failed to parse token response:", e);
          return null;
        }
      } catch (e) {
        console.error("[MAL Auth] Token request network error:", e);
        return null;
      }
    };
    this.getUsername = () => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL$1}/users/@me`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        this.userId = `${data.id}`;
        return data.name;
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.search = async (text) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve([]));
      const url = `${BASE_URL$1}/manga?q=${text}&nsfw=true&fields=id,title,synopsis,main_picture,media_type`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        return data.data.filter((item) => item.node.media_type !== "light_novel").map((item) => {
          const { node } = item;
          return {
            id: node.id.toString(),
            title: node.title,
            description: node.synopsis,
            coverUrl: node.main_picture?.large
          };
        });
      }).catch((e) => {
        console.error(e);
        return [];
      });
    };
    this.getLibraryEntry = async (seriesId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (this.userId === "") await this.getUsername();
      if (this.userId === "") return null;
      const url = `${BASE_URL$1}/manga/${seriesId}?fields=synopsis,num_chapters,my_list_status{start_date,finish_date}`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if (data.my_list_status === void 0) {
          return null;
        }
        return {
          seriesId: `${data.id}`,
          title: data.title,
          description: data.synopsis,
          coverUrl: data.main_picture?.large,
          score: data.my_list_status.score,
          scoreFormat: TrackScoreFormat.POINT_10,
          progress: data.my_list_status.num_chapters_read,
          status: STATUS_MAP[data.my_list_status.status]
        };
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.addLibraryEntry = async (trackEntry) => {
      return this.updateLibraryEntry(trackEntry);
    };
    this.updateLibraryEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (this.userId === "") await this.getUsername();
      if (this.userId === "") return null;
      const formContents = {
        num_chapters_read: trackEntry.progress,
        status: Object.keys(STATUS_MAP).find((key) => STATUS_MAP[key] === trackEntry.status),
        score: trackEntry.score
      };
      const bodyFields = [];
      Object.entries(formContents).forEach(([key, value]) => {
        if (value !== void 0) {
          bodyFields.push(`${key}=${value}`);
        }
      });
      const url = `${BASE_URL$1}/manga/${trackEntry.seriesId}/my_list_status`;
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        },
        body: bodyFields.join("&")
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if ("error" in data) {
          console.error(
            `Error updating library entry for series ${trackEntry.seriesId} from tracker ${MALTrackerMetadata.id}: ${data.error}`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.userId = "";
    this.latestPkceCode = void 0;
  }
}
const BASE_URL = "https://api.mangaupdates.com/v1";
const STATUS_MAP_NAME = {
  read: TrackStatus.Reading,
  wish: TrackStatus.Planning,
  complete: TrackStatus.Completed,
  unfinished: TrackStatus.Dropped,
  hold: TrackStatus.Paused
};
const MU_DEFAULT_LIST_MAP = [
  {
    id: "0",
    name: "Reading List",
    status: TrackStatus.Reading
  },
  {
    id: "1",
    name: "Wish List",
    status: TrackStatus.Planning
  },
  {
    id: "2",
    name: "Complete List",
    status: TrackStatus.Completed
  },
  {
    id: "3",
    name: "Unfinished List",
    status: TrackStatus.Dropped
  },
  {
    id: "4",
    name: "On Hold List",
    status: TrackStatus.Paused
  }
];
const STATUS_REVERSE_MAP = {
  [TrackStatus.Reading]: 0,
  [TrackStatus.Planning]: 1,
  [TrackStatus.Completed]: 2,
  [TrackStatus.Dropped]: 3,
  [TrackStatus.Paused]: 4
};
class MUTrackerClient extends TrackerClientAbstract {
  constructor() {
    super(...arguments);
    this.getMetadata = () => {
      return MUTrackerMetadata;
    };
    this.getAuthUrl = () => {
      return `${BASE_URL}/account/login`;
    };
    this.getToken = (code) => {
      const url = `${BASE_URL}/account/login`;
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: code
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        if (data.status === "exception") {
          console.error(
            `Error getting token from tracker ${MUTrackerMetadata.id}: 
              ${data.reason}`
          );
          return null;
        }
        return data.context.session_token;
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.getUsername = () => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/account/profile`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error getting username from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        return data ? data.username : null;
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.search = async (text) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve([]));
      const url = `${BASE_URL}/series/search`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ search: text })
      };
      return fetch$1(url, options).then((response) => response.json()).then((data) => {
        return data.results.map((item) => {
          const { record } = item;
          return {
            id: record.series_id.toString(),
            title: record.title,
            description: record.description,
            coverUrl: record.image.url.original
          };
        });
      }).catch((e) => {
        console.error(e);
        return [];
      });
    };
    this.getLibraryEntry = async (seriesId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/lists/series/${seriesId}`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 404) {
          console.error(
            `Error getting library entry for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Series not found`
          );
          return null;
        }
        if (response.status === 401) {
          console.error(
            `Error getting library entry for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then(async (data) => {
        if (data == null) {
          return null;
        }
        const listEntry = data.list_id >= 0 && data.list_id <= 4 ? MU_DEFAULT_LIST_MAP[data.list_id] : await this.GetListStatusEntryFunc(data.list_id);
        const rating = await this.GetLibraryRatingEntryFunc(data.series.id);
        const metadata = await this.GetSeriesMetadataEntryFunc(data.series.id);
        if (listEntry === null || rating === null || metadata === null) {
          return null;
        }
        return {
          seriesId: `${data.series.id}`,
          title: data.series.title,
          url: metadata.url,
          description: metadata.description,
          coverUrl: metadata.coverUrl,
          score: rating,
          scoreFormat: TrackScoreFormat.POINT_10_DECIMAL_ONE_DIGIT,
          progress: data.status.chapter,
          status: listEntry.status,
          listId: `${listEntry.id}`,
          listName: listEntry.name
        };
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.addLibraryEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/lists/series`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify([
          {
            series: {
              id: Number(trackEntry.seriesId)
            },
            list_id: trackEntry.status !== void 0 ? STATUS_REVERSE_MAP[trackEntry.status] : 0,
            status: {
              chapter: trackEntry.progress
            }
          }
        ])
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error adding library entry for series ${trackEntry.seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        if (data?.status === "exception") {
          console.error(
            `Error add library entry for [${data.context.errors.map(
              (error) => `Series ID: ${error.series_id}, Error: ${error.error}`
            ).join("; ")}] from tracker ${MUTrackerMetadata.id}`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.updateLibraryEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const prevEntry = await this.getLibraryEntry(trackEntry.seriesId);
      if (prevEntry === null) {
        return this.addLibraryEntry(trackEntry);
      }
      if (trackEntry.listId === void 0) {
        trackEntry.listId = prevEntry.listId;
      }
      let newEntry = null;
      if (prevEntry.progress !== trackEntry.progress || prevEntry.listId !== trackEntry.listId) {
        newEntry = this.updateLibraryProgressEntry(trackEntry);
      }
      if (trackEntry.score !== prevEntry.score) {
        newEntry = this.updateLibraryRatingEntry(trackEntry);
      }
      return newEntry;
    };
    this.getListEntries = () => {
      if (this.accessToken === "") return new Promise((resolve) => resolve([]));
      const url = `${BASE_URL}/lists/`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error getting status from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return [];
        }
        return response.json();
      }).then((data) => {
        if (data.length === 0) {
          return [];
        }
        return data.map((item) => ({
          id: `${item.list_id}`,
          name: item.title,
          status: STATUS_MAP_NAME[item.type]
        }));
      }).catch((e) => {
        console.error(e);
        return [];
      });
    };
    this.GetListStatusEntryFunc = async (listId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (listId < 0 || listId > 4 && listId < 101) {
        console.error(
          `Error getting status for list ${listId} from tracker ${MUTrackerMetadata.id}: listid out of range`
        );
        return null;
      }
      const url = `${BASE_URL}/lists/${listId}`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 404) {
          console.error(
            `Error getting status for list ${listId} from tracker ${MUTrackerMetadata.id}: List not found`
          );
          return null;
        }
        if (response.status === 401) {
          console.error(
            `Error getting status for list ${listId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        if (data === null) {
          return null;
        }
        return {
          id: `${data.list_id}`,
          name: data.title,
          status: STATUS_MAP_NAME[data.type]
        };
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.GetLibraryRatingEntryFunc = async (seriesId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/series/${seriesId}/rating`;
      const options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 404) {
          console.warn(
            `Warn getting score for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Series without a score`
          );
          return { rating: 0 };
        }
        if (response.status === 401) {
          console.error(
            `Error getting score for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        return data ? data.rating : null;
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.GetSeriesMetadataEntryFunc = async (seriesId) => {
      const url = `${BASE_URL}/series/${seriesId}`;
      const options = {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 404) {
          console.error(
            `Error getting metadata for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Series not found`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        return data ? {
          url: data.url,
          description: data.description,
          coverUrl: data.image.url.original
        } : null;
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.updateLibraryProgressEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/lists/series/update`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify([
          {
            series: {
              id: Number(trackEntry.seriesId)
            },
            list_id: Number(trackEntry.listId),
            status: {
              chapter: trackEntry.progress
            }
          }
        ])
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error updating library entry for series ${trackEntry.seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        return response.json();
      }).then((data) => {
        if (data?.status === "exception") {
          console.error(
            `Error updating library entry for [${data.context.errors.map(
              (error) => `Series ID: ${error.series_id}, Error: ${error.error}`
            ).join("; ")}] from tracker ${MUTrackerMetadata.id}`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.updateLibraryRatingEntry = async (trackEntry) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      if (trackEntry.score === void 0) {
        return trackEntry;
      }
      if (trackEntry.score === 0) {
        return this.deleteLibraryRatingEntry(Number(trackEntry.seriesId));
      }
      const url = `${BASE_URL}/series/${trackEntry.seriesId}/rating`;
      const options = {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          rating: trackEntry.score
        })
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error updating library rating entry for series ${trackEntry.seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        if (response.status === 404) {
          console.error(
            `Error updating library rating entry for series ${trackEntry.seriesId} from tracker ${MUTrackerMetadata.id}: Series not found`
          );
          return null;
        }
        if (response.status === 400) {
          console.error(
            `Error updating library rating entry for series ${trackEntry.seriesId} from tracker ${MUTrackerMetadata.id}: rating must be between 1.0 and 10.0`
          );
          return null;
        }
        return this.getLibraryEntry(trackEntry.seriesId);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
    this.deleteLibraryRatingEntry = async (seriesId) => {
      if (this.accessToken === "") return new Promise((resolve) => resolve(null));
      const url = `${BASE_URL}/series/${seriesId}/rating`;
      const options = {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      };
      return fetch$1(url, options).then((response) => {
        if (response.status === 401) {
          console.error(
            `Error updating library rating entry for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Unauthorized access`
          );
          return null;
        }
        if (response.status === 404) {
          console.error(
            `Error updating library rating entry for series ${seriesId} from tracker ${MUTrackerMetadata.id}: Series not found`
          );
          return null;
        }
        return this.getLibraryEntry(`${seriesId}`);
      }).catch((e) => {
        console.error(e);
        return null;
      });
    };
  }
}
const TRACKER_CLIENTS = {
  [AniListTrackerMetadata.id]: new AniListTrackerClient(),
  [MALTrackerMetadata.id]: new MALTrackerClient(),
  [MUTrackerMetadata.id]: new MUTrackerClient()
};
function getAuthUrls() {
  console.info(`Getting auth urls from trackers`);
  const authUrls = {};
  Object.entries(TRACKER_CLIENTS).forEach(([trackerId, trackerClient]) => {
    authUrls[trackerId] = trackerClient.getAuthUrl();
  });
  return authUrls;
}
function getToken(trackerId, accessCode) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Getting access token for tracker ${trackerId}`);
  return tracker.getToken(accessCode);
}
function getUsername(trackerId) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Getting username from tracker ${trackerId}`);
  return tracker.getUsername();
}
function search(trackerId, query) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Searching for '${query}' from tracker ${trackerId}`);
  return tracker.search(query);
}
function getLibraryEntry(trackerId, seriesId) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Getting library entry for ${seriesId} from tracker ${trackerId}`);
  return tracker.getLibraryEntry(seriesId);
}
function addLibraryEntry(trackerId, trackEntry) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Adding library entry for ${trackEntry.seriesId} from tracker ${trackerId}`);
  const validatedTrackEntry = {
    ...trackEntry,
    progress: trackEntry.progress === void 0 ? 0 : trackEntry.progress,
    status: trackEntry.status === void 0 ? TrackStatus.Reading : trackEntry.status
  };
  return tracker.addLibraryEntry(validatedTrackEntry);
}
function updateLibraryEntry(trackerId, trackEntry) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Updating library entry for ${trackEntry.seriesId} from tracker ${trackerId}`);
  return tracker.updateLibraryEntry(trackEntry);
}
function setAccessToken(trackerId, accessToken) {
  const tracker = TRACKER_CLIENTS[trackerId];
  console.info(`Setting access token for tracker ${trackerId}`);
  return tracker.setAccessToken(accessToken);
}
function getListEntries(trackerId) {
  const tracker = TRACKER_CLIENTS[trackerId];
  if (tracker.getListEntries === void 0) {
    console.warn(`Getting list entries from tracker ${trackerId}: is not defined`);
    return Promise.resolve([]);
  }
  console.info(`Getting list entries from tracker ${trackerId}`);
  return tracker.getListEntries();
}
const createTrackerIpcHandlers = (ipcMain) => {
  console.debug("Creating tracker IPC handlers in main...");
  ipcMain.handle(ipcChannels.TRACKER_MANAGER.GET_ALL, async () => {
    return Object.values(TRACKER_CLIENTS).map(
      (client) => client.getMetadata()
    );
  });
  ipcMain.handle(ipcChannels.TRACKER.GET_AUTH_URLS, () => {
    return getAuthUrls();
  });
  ipcMain.handle(ipcChannels.TRACKER.GET_TOKEN, (_event, trackerId, accessCode) => {
    return getToken(trackerId, accessCode);
  });
  ipcMain.handle(ipcChannels.TRACKER.GET_USERNAME, (_event, trackerId) => {
    return getUsername(trackerId);
  });
  ipcMain.handle(ipcChannels.TRACKER.SEARCH, (_event, trackerId, query) => {
    return search(trackerId, query);
  });
  ipcMain.handle(
    ipcChannels.TRACKER.GET_LIBRARY_ENTRY,
    (_event, trackerId, seriesId) => {
      return getLibraryEntry(trackerId, seriesId);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.ADD_LIBRARY_ENTRY,
    (_event, trackerId, trackEntry) => {
      return addLibraryEntry(trackerId, trackEntry);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.UPDATE_LIBRARY_ENTRY,
    (_event, trackerId, trackEntry) => {
      return updateLibraryEntry(trackerId, trackEntry);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.SET_ACCESS_TOKEN,
    (_event, trackerId, accessToken) => {
      return setAccessToken(trackerId, accessToken);
    }
  );
  ipcMain.handle(ipcChannels.TRACKER.GET_LIST_ENTRIES, (_event, trackerId) => {
    return getListEntries(trackerId);
  });
};
function getActivity(startTime, series, chapter) {
  if (series === void 0 || chapter === void 0) return void 0;
  return {
    details: `${series.title}`,
    state: `Chapter ${chapter.chapterNumber}`,
    startTimestamp: startTime,
    largeImageKey: series.remoteCoverUrl ? series.remoteCoverUrl : "logo",
    smallImageKey: series.remoteCoverUrl ? "logo" : void 0,
    largeImageText: series.title,
    smallImageText: packageJson.productName,
    instance: false
  };
}
const createDiscordIpcHandlers = (ipcMain) => {
  console.debug("Creating Discord IPC handlers in main...");
  const startTime = /* @__PURE__ */ new Date();
  let client = null;
  ipcMain.handle(
    ipcChannels.INTEGRATION.DISCORD_SET_ACTIVITY,
    async (_event, series, chapter) => {
      const activity = getActivity(startTime, series, chapter);
      if (client === null) {
        console.debug("Request to set Discord activity, but client isn't set; connecting...");
        const clientId2 = "1327264907284189245";
        client = new DiscordRPC.Client({ transport: "ipc" });
        client.on("ready", () => {
          if (client !== null) {
            client.setActivity(activity);
          }
        });
        client.login({ clientId: clientId2 });
      } else {
        console.debug(
          `Setting Discord activity for ${chapter === void 0 ? "no chapter" : `chapter ${chapter.id}`}`
        );
        client.setActivity(activity);
      }
    }
  );
};
const createUpdaterIpcHandlers = (ipcMain) => {
  console.debug("Creating updater IPC handlers in main...");
  ipcMain.handle(ipcChannels.APP.CHECK_FOR_UPDATES, (event) => {
    console.debug("Handling check for updates request...");
    if (process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true") {
      console.info("Skipping update check because we are in dev environment");
      return;
    }
    electronUpdater.autoUpdater.logger = console;
    electronUpdater.autoUpdater.autoDownload = false;
    return electronUpdater.autoUpdater.checkForUpdates().then((result) => {
      if (result.updateInfo.version === packageJson.version) {
        console.info(`Already up-to-date at version ${packageJson.version}`);
        event.sender.send(
          ipcChannels.APP.SEND_NOTIFICATION,
          "Comicers is up-to-date!",
          "You are using the latest version."
        );
        return;
      }
      console.info(
        `Found update to version ${result.updateInfo.version} (from ${packageJson.version})`
      );
      event.sender.send(ipcChannels.APP.SHOW_PERFORM_UPDATE_DIALOG, result.updateInfo);
      return 4;
    }).catch((e) => console.error(e));
  });
  ipcMain.handle(ipcChannels.APP.PERFORM_UPDATE, (event) => {
    electronUpdater.autoUpdater.removeAllListeners();
    electronUpdater.autoUpdater.on("update-downloaded", () => {
      event.sender.send(
        ipcChannels.APP.SEND_NOTIFICATION,
        "Downloaded update",
        `Restart to finish installing update`
      );
      event.sender.send(ipcChannels.APP.SHOW_RESTART_UPDATE_DIALOG);
    });
    electronUpdater.autoUpdater.on("error", (err) => {
      console.error(`Updater encountered error: ${err}`);
      event.sender.send(
        ipcChannels.APP.SEND_NOTIFICATION,
        "Failed to update",
        `${err.name}: ${err.message}`
      );
    });
    electronUpdater.autoUpdater.checkForUpdates().then((result) => {
      if (result.updateInfo.version !== packageJson.version) {
        event.sender.send(
          ipcChannels.APP.SEND_NOTIFICATION,
          "Downloading update",
          `Downloading update for v${result.updateInfo.version}`
        );
        electronUpdater.autoUpdater.downloadUpdate();
      }
    }).catch((e) => console.error(e));
  });
  ipcMain.handle(ipcChannels.APP.UPDATE_AND_RESTART, () => {
    electronUpdater.autoUpdater.quitAndInstall(true, true);
  });
};
const createFilesystemIpcHandlers = (ipcMain) => {
  console.debug("Creating filesystem IPC handlers in main...");
  ipcMain.handle(
    ipcChannels.FILESYSTEM.GET_CHAPTER_DOWNLOAD_PATH,
    (_event, series, chapter, downloadsDir) => {
      return getChapterDownloadPath(series, chapter, downloadsDir);
    }
  );
  ipcMain.handle(
    ipcChannels.FILESYSTEM.GET_CHAPTERS_DOWNLOADED,
    (_event, series, chapters, downloadsDir) => {
      return getChaptersDownloaded(series, chapters, downloadsDir);
    }
  );
  ipcMain.handle(
    ipcChannels.FILESYSTEM.GET_CHAPTER_DOWNLOADED,
    (_event, series, chapter, downloadsDir) => {
      return getChapterDownloaded(series, chapter, downloadsDir);
    }
  );
  ipcMain.handle(
    ipcChannels.FILESYSTEM.DELETE_DOWNLOADED_CHAPTER,
    (_event, series, chapter, downloadsDir) => {
      return deleteDownloadedChapter(series, chapter, downloadsDir);
    }
  );
  ipcMain.handle(
    ipcChannels.FILESYSTEM.GET_ALL_DOWNLOADED_CHAPTER_IDS,
    (_event, downloadsDir) => {
      return getAllDownloadedChapterIds(downloadsDir);
    }
  );
  ipcMain.handle(ipcChannels.FILESYSTEM.GET_THUMBNAIL_PATH, (_event, series) => {
    return getThumbnailPath(series, THUMBNAILS_DIR);
  });
  ipcMain.handle(
    ipcChannels.FILESYSTEM.DOWNLOAD_THUMBNAIL,
    (_event, thumbnailPath, data) => {
      return downloadThumbnail(thumbnailPath, data);
    }
  );
  ipcMain.handle(ipcChannels.FILESYSTEM.DELETE_THUMBNAIL, (_event, series) => {
    return deleteThumbnail(series, THUMBNAILS_DIR);
  });
  ipcMain.handle(
    ipcChannels.FILESYSTEM.LIST_DIRECTORY,
    (_event, pathname, directoriesOnly = false) => {
      return listDirectory(pathname, directoriesOnly);
    }
  );
};
log.transports.file.resolvePath = () => path.join(LOGS_DIR, "main.log");
console.info(`Starting Comicers main process (client version ${packageJson.version})`);
let mainWindow = null;
let spoofWindow = null;
if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}
if (process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true") {
  require("electron-debug")();
}
electron.protocol.registerSchemesAsPrivileged([
  {
    scheme: "atom",
    privileges: {
      supportFetchAPI: true
    }
  }
]);
const createWindows = async () => {
  const RESOURCES_PATH = electron.app.isPackaged ? path.join(process.resourcesPath, "resources") : path.join(__dirname, "../resources");
  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  mainWindow = new electron.BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minWidth: 250,
    minHeight: 150,
    frame: false,
    icon: getAssetPath("icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  spoofWindow = new electron.BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    spoofWindow?.close();
  });
  spoofWindow.on("closed", () => {
    spoofWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  mainWindow.on("enter-full-screen", () => {
    mainWindow?.webContents.send(ipcChannels.WINDOW.SET_FULLSCREEN, true);
  });
  mainWindow.on("leave-full-screen", () => {
    mainWindow?.webContents.send(ipcChannels.WINDOW.SET_FULLSCREEN, false);
  });
};
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.whenReady().then(async () => {
  await createWindows();
  createExtensionIpcHandlers(electron.ipcMain, spoofWindow);
  loadPlugins(spoofWindow);
  electron.protocol.handle("atom", (req) => {
    const newPath = decodeURIComponent(req.url.slice("atom://".length));
    return electron.net.fetch(`file://${newPath}`, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
  });
}).catch(console.error);
electron.app.on("activate", () => {
  if (mainWindow === null) createWindows();
});
electron.ipcMain.handle(ipcChannels.WINDOW.MINIMIZE, () => {
  mainWindow?.minimize();
});
electron.ipcMain.handle(ipcChannels.WINDOW.MAX_RESTORE, () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.restore();
  } else {
    mainWindow?.maximize();
  }
});
electron.ipcMain.handle(ipcChannels.WINDOW.CLOSE, () => {
  mainWindow?.close();
});
electron.ipcMain.handle(ipcChannels.WINDOW.TOGGLE_FULLSCREEN, () => {
  const nowFullscreen = !mainWindow?.fullScreen;
  mainWindow?.setFullScreen(nowFullscreen);
  mainWindow?.webContents.send(ipcChannels.WINDOW.SET_FULLSCREEN, nowFullscreen);
});
electron.ipcMain.handle(ipcChannels.GET_PATH.THUMBNAILS_DIR, () => {
  return THUMBNAILS_DIR;
});
electron.ipcMain.handle(ipcChannels.GET_PATH.PLUGINS_DIR, () => {
  return PLUGINS_DIR;
});
electron.ipcMain.handle(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR, () => {
  return DEFAULT_DOWNLOADS_DIR;
});
electron.ipcMain.handle(ipcChannels.GET_PATH.LOGS_DIR, () => {
  return LOGS_DIR;
});
electron.ipcMain.handle(ipcChannels.GET_ALL_FILES, (_event, rootPath) => {
  return walk(rootPath);
});
electron.ipcMain.handle("dialog:showSaveDialog", async (_event, options) => {
  console.info("Showing save dialog", options);
  if (mainWindow === null) {
    console.error("Aborting save dialog, mainWindow is null");
    return { canceled: true };
  }
  return electron.dialog.showSaveDialog(mainWindow, options);
});
electron.ipcMain.handle("dialog:showOpenDialog", async (_event, options) => {
  console.info("Showing open dialog", options);
  if (mainWindow === null) {
    console.error("Aborting open dialog, mainWindow is null");
    return { canceled: true, filePaths: [] };
  }
  return electron.dialog.showOpenDialog(mainWindow, options);
});
electron.ipcMain.handle("fs:writeFile", async (_event, filePath, data) => {
  console.info(`Writing file: ${filePath}`);
  return fs.promises.writeFile(filePath, data, "utf8");
});
electron.ipcMain.handle("fs:readFile", async (_event, filePath) => {
  console.info(`Reading file: ${filePath}`);
  return fs.promises.readFile(filePath, "utf8");
});
electron.ipcMain.handle(
  ipcChannels.APP.SHOW_OPEN_DIALOG,
  (_event, directory2 = false, filters = [], title) => {
    console.info(`Showing open dialog directory=${directory2} filters=${filters.join(";")}`);
    if (mainWindow === null) {
      console.error("Aborting open dialog, mainWindow is null");
      return [];
    }
    return electron.dialog.showOpenDialog(mainWindow, {
      properties: [directory2 ? "openDirectory" : "openFile"],
      filters,
      title
    }).then((value) => {
      if (value.canceled) return [];
      return value.filePaths;
    }).catch((e) => console.error(e));
  }
);
electron.ipcMain.handle(ipcChannels.APP.READ_ENTIRE_FILE, (_event, filepath) => {
  console.info(`Reading entire file: ${filepath}`);
  return fs.readFileSync(filepath).toString();
});
if (process.platform === "win32") {
  electron.app.commandLine.appendSwitch("high-dpi-support", "1");
  electron.app.commandLine.appendSwitch("force-device-scale-factor", "1");
}
createFilesystemIpcHandlers(electron.ipcMain);
createTrackerIpcHandlers(electron.ipcMain);
createDiscordIpcHandlers(electron.ipcMain);
createUpdaterIpcHandlers(electron.ipcMain);
