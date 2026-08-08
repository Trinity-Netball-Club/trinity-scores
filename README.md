# Trinity Scores 🏐

Live results, fixtures, and ladder standings for [Trinity Netball Club](https://trinitynetball.com.au), built and hosted as a static site on GitHub Pages.

**Live site:** [scores.trinitynetball.com.au](https://scores.trinitynetball.com.au)

## About

Trinity Scores pulls match data from Netball Connect and presents it in a clean, mobile-friendly dashboard so players, families, and supporters can quickly check how their team is going. On match days, data refreshes automatically every 10 minutes.

Features:
- 📅 **Match Day view** — live scores, wins/losses, and results as they come in, weather forecasts
- 📋 **Full Schedule** — fixtures by round for every team in the club, filtering options with team names
- 🏆 **Ladder** — up-to-date standings across all grades
- 🔴 Live status indicators for in-progress games

## How it works

This is a static site with a lightweight data pipeline:

- **`scripts/`** — scripts that fetch and process fixture, result, and ladder data from Netball Connect
- **`public/`** — the static site (HTML/CSS/JS) that renders the data
- **`.github/workflows/`** — GitHub Actions that run the scripts on a schedule to keep data fresh and deploy the site to GitHub Pages

Because everything runs through GitHub Actions and Pages, there's no server to maintain — the site is just static files refreshed on a timer via cron-job.org

The scripts crawls the existing pages at https://registration.netballconnect.com/livescoreSeasonFixture passing through different parameters.  Thre is no access to the squadi api directly unfortunately, so using GitHubs Playwright plugin it loads the page, grabs the json from squadi and copies it locally.

## Getting started

Clone the repo:

```bash
git clone https://github.com/Trinity-Netball-Club/trinity-scores.git
cd trinity-scores
```

Install any script dependencies (if applicable) and run the data-fetch scripts locally, then open the files in `public/` in a browser, or serve them with any static file server, e.g.:

```bash
npx serve public
```

> If your setup uses a specific package manager or runtime, update this section with the exact install/run commands (e.g. `npm install`, `pip install -r requirements.txt`).

## Deployment

The site auto-deploys via the GitHub Actions workflow(s) in `.github/workflows/` whenever data is refreshed or changes are pushed to `main`, publishing to GitHub Pages at the custom domain `scores.trinitynetball.com.au`.

## Contributing

Issues and pull requests are welcome — whether that's fixing a bug, improving the UI, or adding a new view. Please open an issue first for larger changes so we can discuss the approach.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- Data provided via [Netball Connect](https://www.netballconnect.com/)
- Built for [Trinity Netball Club](https://trinitynetball.com.au)