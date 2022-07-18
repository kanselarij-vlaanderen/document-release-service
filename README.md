# document-release-service
This microservice will automatically trigger the release of documents internally in Kaleidos and to Themis (and Valvas).

## Tutorials
### Add the service to a stack
Add the service to your `docker-compose.yml`:

```yaml
services:
  document-release:
    image: kanselarij/document-release-service:0.1.0
```


## Reference
### Configuration

The following environment variables have to be configured:
* `RELEASE_CRON_PATTERN`: (default: `0 * * * * *` = every minute): frequency to check for meetings for which documents must be released.
.
* `ESTIMATED_DURATION` (seconds, default: 600 = 10 minutes): estimation of the time it takes to release the documents. If the release needs to be finished on time X, the release process is started earlier by checking X against the current date/time + ESTIMATED_DURATION.
The release process will be finished anywhere between X - ESTIMATED_DURATION and X or past X if the ESTIMATED_DURATION is lower than the actual duration.

### Data model
The service queries for publication-activities with a confirmed planned status and a planned start that falls in the release window (current time - estimated duration).

For each of those activities, the release status gets updated and a start date is inserted.
- for an internal document publication activity an Yggdrasil propagation will be triggered via the delta-notifier
- a Themis publication-activity will be picked up by the themis-export-service via polling
