# Config

- Sign up for new account at PostHog
- Get API key
- Create `/dcl/.env` and  POSTHOG_API_KEY="...api key..."
- Add the POSTHOG_API_KEY as an env var at <https://decentraland.org/storage/env>
- Customise server/metrics/playerStats
- Customise server/metrics/metricEvents
- Add calls to the methods in server/metrics/client.ts throughout the codebase, eg:

  Metrics.trackGameJoined(userId, this.store.getGameStartTime())
