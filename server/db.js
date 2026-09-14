const fs = require('fs');
const path = require('path');
const { buildDefaultData } = require('./seedData');

// Dead-simple file persistence: the whole { users, properties } blob is
// written to data.json on every change and read back on startup. No real
// database, just enough that restarting the server doesn't wipe accounts
// and listings.
//
// Delete data.json to reset to the seed data. Point KNISS_DATA_FILE at a
// throwaway path when testing so the real file is never touched.
const DATA_FILE = process.env.KNISS_DATA_FILE
  ? path.resolve(process.env.KNISS_DATA_FILE)
  : path.join(__dirname, 'data.json');
const NAME = path.basename(DATA_FILE);
const IS_TEST = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';

function load() {
  if (IS_TEST) return buildDefaultData();

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.properties)) {
      // interests was added after users/properties, so a data.json written
      // before that still parses fine here — it just starts with no leads
      // instead of losing its accounts and listings over one missing array.
      const interests = Array.isArray(parsed.interests) ? parsed.interests : [];
      console.log(
        `Loaded ${parsed.users.length} accounts, ${parsed.properties.length} listings and ${interests.length} interest records from ${NAME}`
      );
      return { users: parsed.users, properties: parsed.properties, interests };
    }
    console.warn(`${NAME} is malformed — starting from seed data.`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not read ${NAME} (${error.message}) — starting from seed data.`);
      // Keep the unreadable file so nothing is silently lost when the next
      // write replaces it with fresh seed data.
      try {
        fs.copyFileSync(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`);
        console.warn(`  A copy of the unreadable file was kept next to it.`);
      } catch (copyError) {
        /* best effort */
      }
    }
  }
  return buildDefaultData();
}

const db = load();

function persist() {
  if (IS_TEST) return;
  const payload = JSON.stringify(
    { users: db.users, properties: db.properties, interests: db.interests },
    null,
    2
  );
  const tmp = `${DATA_FILE}.tmp`;
  try {
    // Write to a temp file then rename, so a crash mid-write can't corrupt
    // the real file.
    fs.writeFileSync(tmp, payload);
    fs.renameSync(tmp, DATA_FILE);
  } catch (error) {
    console.warn(`Could not save ${NAME}: ${error.message}`);
    try {
      fs.unlinkSync(tmp);
    } catch (cleanupError) {
      /* best effort */
    }
  }
}

// On a fresh start with no data file yet, write the seed out straight away
// so what's on disk always matches what's in memory.
if (!IS_TEST && !fs.existsSync(DATA_FILE)) {
  persist();
}

module.exports = { db, persist, DATA_FILE };
