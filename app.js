import { app, errorHandler } from 'mu';
import { RELEASE_CRON_PATTERN } from './config';
import { CronJob } from 'cron';
import { queryMeetingsReadyForDocumentRelease, releaseDocumentsForMeeting } from './lib/query';

new CronJob(RELEASE_CRON_PATTERN, function() {
  console.log(`Automatic release of documents triggered by cron job at ${new Date().toISOString()}`);
  triggerDocumentRelease();
}, null, true);

async function triggerDocumentRelease() {
  const meetingUris = await queryMeetingsReadyForDocumentRelease();

  if (meetingUris.length) {
    console.log(`Found ${meetingUris.length} meetings for which a document release must be triggered.`);
    await releaseDocumentsForMeeting(meetingUris);
    console.log(`Releasing documents done at ${new Date().toISOString()}`);
  } else {
    console.log('No meeting found for which a document release must be scheduled');
  }
};

app.use(errorHandler);
