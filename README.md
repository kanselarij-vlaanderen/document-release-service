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
* `ESTIMATED_DURATION` (seconds, default: 600 = 10 minutes): estimation of the time it takes to release the documents. If the release needs to be finished on time X, the release process is started on X - ESTIMATED_DURATION.

### Data model
The service queries for meetings which:
- have a scheduled document release date (`ext:issuedDocDate`) on their general newsletter within the release timeframe
- don't have a released document date (`ext:releasedDocuments`) yet
- don't have a Themis publication-activity with scope `documents` yet

For each of those meetings the following data gets inserted:
- a released document date, which will trigger an Yggdrasil propagation (via delta-notifier)
- a Themis publication-activity, which will be picked up by the themis-export-service (via polling)
