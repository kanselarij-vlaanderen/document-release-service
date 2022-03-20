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

* RELEASEN_CRON_PATTERN: (default 0 * * * * * = every minute): frequency to check for documents ready for release
.
* ESTIMATED_DURATION: estimation of the time it takes to release the documents. If the release needs to be finished on time X, the release time is set on X - ESTIMATED_DURATION
