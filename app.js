import { app, errorHandler } from 'mu';
import { RELEASEN_CRON_PATTERN } from './config';
import { CronJob } from 'cron';
import { queryMeetingsReadyForDocumentRelease, releaseDocumentsForMeeting } from './lib/query';

new CronJob(RELEASEN_CRON_PATTERN, function() {
  console.log(`Release of documents triggered by cron job at ${new Date().toISOString()}`);
  triggerDocumentRelease();
}, null, true);

async function triggerDocumentRelease() {
  const meetingUris = await queryMeetingsReadyForDocumentRelease();

  console.log(`Found ${meetingUris.length} meetings to release documents.`)
  await releaseDocumentsForMeeting(meetingUris);

  console.log(`Releasing documents done at ${new Date().toISOString()}`);
};

app.use(errorHandler)