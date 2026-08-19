const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FIXTURE_PAGE =
  'https://registration.netballconnect.com/livescoreSeasonFixture?organisationKey=ab63c5b3-fd1a-41a6-a1a2-326989b20247&competitionUniqueKey=3023e0a7-dbcf-4f0f-a7ce-350e61da84d6&yearId=8&divisionId=All';

const OUTFILE = path.join(
  __dirname,
  '..',
  'public',
  'fixtures.json'
);

const RESPONSE_TIMEOUT_MS = 60000;

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    // Start waiting for the matching response BEFORE navigating, so we
    // don't miss it and so we hold a promise that only resolves once
    // the response is fully matched (headers received).
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

    // Read the body *before* doing anything else (like closing the browser).
    // This is the critical fix: response.json() must fully resolve while
    // the page/context is still alive.
    const fixtureData = await response.json();

    await browser.close();

    fs.writeFileSync(
      OUTFILE,
      JSON.stringify(
        {
          fetchedAt: new Date().toISOString(),
          data: fixtureData
        },
        null,
        2
      )
    );

    console.log(`Saved fixtures to ${OUTFILE}`);
  } catch (err) {
    await browser.close();
    throw err;
  }
})();
