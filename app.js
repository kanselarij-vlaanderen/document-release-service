import { app, errorHandler } from 'mu';
import { RELEASE_CRON_PATTERN } from './config';
import { CronJob } from 'cron';
import { queryMeetingsReadyForDocumentRelease, releaseDocumentsForMeeting } from './lib/query';

new CronJob(RELEASE_CRON_PATTERN, function() {
  console.log(`Automatic release of documents triggered by cron job at ${new Date().toISOString()}`);
  triggerDocumentRelease();
}, null, true);

async function triggerDocumentRelease() {
  const meetings = await queryMeetingsReadyForDocumentRelease();

  if (meetings.length) {
    console.log(`Found ${meetings.length} meetings for which a document release must be triggered.`);
    meetings.forEach((meeting) => {
      console.log(`- <${meeting.uri}> doc release scheduled at ${meeting.releaseDate}`);
    });
    await releaseDocumentsForMeeting(meetings);
    console.log(`Releasing documents finished at ${new Date().toISOString()}.`);
  } else {
    console.log('No meeting found for which a document release must be scheduled');
  }
};

app.use(errorHandler);
