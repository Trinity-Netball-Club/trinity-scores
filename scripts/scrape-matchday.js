const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FIXTURE_PAGE =
  'https://registration.netballconnect.com/livescoreSeasonFixture?organisationKey=ab63c5b3-fd1a-41a6-a1a2-326989b20247&competitionUniqueKey=3023e0a7-dbcf-4f0f-a7ce-350e61da84d6&yearId=8&divisionId=All';

const OUTFILE = path.join(__dirname, '..', 'public', 'fixtures.json');
const MELB_TZ = 'Australia/Melbourne';
const RESPONSE_TIMEOUT_MS = 60000;

// Only these fields actually change once a match is on the board.
// Everything else (teams, venue, court, round, start time) is set by
// the full scrape-fixtures.js scrape and doesn't need to be touched here.
const LIVE_FIELDS = [
  'matchStatus',
  'resultStatus',
  'matchEnded',
  'matchSubstatusRefId',
  'team1Score',
  'team2Score',
  'team1PenaltyScore',
  'team2PenaltyScore',
  'pauseStartTime',
  'totalPausedMs'
];

function melbDate(iso) {
  if (!iso) return null;
  // en-CA gives YYYY-MM-DD, handy for straight string comparison.
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: MELB_TZ });
}

// Match-day scrape — run frequently (e.g. every 10 min during match
// hours via fetch-matchday.yml). Only patches score/status fields for
// TODAY's matches into the existing fixtures.json, and leaves the file
// untouched if nothing changed. Past rounds and future/scheduled
// rounds are never modified here — that's scrape-fixtures.js's job,
// run separately and less often.
(async () => {
  if (!fs.existsSync(OUTFILE)) {
    throw new Error(
      'fixtures.json not found — run scrape-fixtures.js first to seed it.'
    );
  }

  const existingFile = JSON.parse(fs.readFileSync(OUTFILE, 'utf8'));

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  let fixtureData;

  try {
    // Start waiting for the matching response BEFORE navigating, and
    // read its body fully before the browser closes — this is what
    // scrape-fixtures.js's fix does too, avoiding the response.json()
    // vs browser.close() race.
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/livescores/round/matches'),
      { timeout: RESPONSE_TIMEOUT_MS }
    );

    await page.goto(FIXTURE_PAGE, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    const response = await responsePromise;

    console.log('Fixtures endpoint found');
    console.log(response.url());

    fixtureData = await response.json();
  } finally {
    await browser.close();
  }

  if (!fixtureData) {
    throw new Error('No fixture JSON captured');
  }

  const today = melbDate(new Date().toISOString());

  const existingMatchById = new Map();
  for (const round of existingFile.data.rounds || []) {
    for (const m of round.matches || []) {
      existingMatchById.set(m.id, m);
    }
  }

  let changed = false;

  for (const round of fixtureData.rounds || []) {
    for (const m of round.matches || []) {
      const day = melbDate(m.startTime || m.originalStartTime);
      if (day !== today) continue; // leave past/future rounds untouched

      const existingMatch = existingMatchById.get(m.id);
      if (!existingMatch) continue; // brand new match — needs a full scrape

      for (const field of LIVE_FIELDS) {
        if (existingMatch[field] !== m[field]) {
          existingMatch[field] = m[field];
          changed = true;
        }
      }
    }
  }

  if (!changed) {
    console.log('No match-day changes — leaving fixtures.json untouched.');
    return;
  }

  existingFile.fetchedAt = new Date().toISOString();

  fs.writeFileSync(OUTFILE, JSON.stringify(existingFile, null, 2));

  console.log(`Match-day scores updated in ${OUTFILE}`);
})();
//end
