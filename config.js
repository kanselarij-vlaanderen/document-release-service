const RELEASE_CRON_PATTERN = process.env.RELEASE_CRON_PATTERN || '0 * * * * *';
const ESTIMATED_DURATION = parseInt(process.env.ESTIMATED_DURATION || '600') * 1000;
const RELEASE_STATUS_CONFIRMED = 'http://themis.vlaanderen.be/id/concept/vrijgave-status/5da73f0d-6605-493c-9c1c-0d3a71bf286a';
const RELEASE_STATUS_RELEASED = 'http://themis.vlaanderen.be/id/concept/vrijgave-status/27bd25d1-72b4-49b2-a0ba-236ca28373e5';

export {
  RELEASE_CRON_PATTERN,
  ESTIMATED_DURATION,
  RELEASE_STATUS_CONFIRMED,
  RELEASE_STATUS_RELEASED
}
