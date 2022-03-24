# document-release-service

This microservice will automatically trigger the release of documents for NewsletterInfo based on the time set on the NewsletterInfo.

## Tutorials
### Add the service to a stack
Add the service to your `docker-compose.yml`:

```yaml
services:
  document-release-service:
    image: kanselarij/document-release-service:0.1.0
    restart: always
    logging: *default-logging
```


## Reference

### Configuration

The following environment variables have to be configured:

* `RELEASE_CRON_PATTERN`: (default: `0 * * * * *` = every minute): frequency to check for meetings for which documents must be released.
.
* `ESTIMATED_DURATION` (seconds, default: 600 = 10 minutes): estimation of the time it takes to release the documents. If the release needs to be finished on time X, the release process is started on X - ESTIMATED_DURATION.
