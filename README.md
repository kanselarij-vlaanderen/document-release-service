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

* RELEASE_INTERVAL: interval (in minutes) at which the consumer needs to sync data automatically. If negative, the release can only be triggered manually via the API endpoint.
* ESTIMATED_DURATION: estimation of the time it takes to release the documents. If the release needs to be finished on time X, the release time is set on X - ESTIMATED_DURATION
