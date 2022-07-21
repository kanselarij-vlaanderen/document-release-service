import { app, errorHandler } from 'mu';
import { RELEASE_CRON_PATTERN } from './config';
import { CronJob } from 'cron';
import {
  queryMeetingsReadyForDocumentRelease,
  queryMeetingsReadyForThemisRelease,
  startPublicationActivities
} from './lib/query';

new CronJob(RELEASE_CRON_PATTERN, async function() {
  console.log(`Automatic release of documents triggered by cron job at ${new Date().toISOString()}`);
  await triggerInternalDocumentPublication();
  await triggerThemisDocumentPublication();
}, null, true);

async function triggerInternalDocumentPublication() {
  const meetings = await queryMeetingsReadyForDocumentRelease();

  if (meetings.length) {
    console.log(`Found ${meetings.length} meetings for which an internal document publication must be triggered.`);
    meetings.forEach((meeting) => {
      console.log(`- <${meeting.uri}> internal document publication scheduled at ${meeting.plannedPublicationTime}`);
    });
    const activities = meetings.map((meeting) => meeting.publicationActivityUri);
    await startPublicationActivities(activities);
    console.log(`Releasing documents finished at ${new Date().toISOString()}.`);
  } else {
    console.log('No meeting found for which an internal document publication must be scheduled');
  }
};

async function triggerThemisDocumentPublication() {
  const meetings = await queryMeetingsReadyForThemisRelease();

  if (meetings.length) {
    console.log(`Found ${meetings.length} meetings for which a Themis document publication must be triggered.`);
    meetings.forEach((meeting) => {
      console.log(`- <${meeting.uri}> Themis document publication scheduled at ${meeting.plannedPublicationTime}`);
    });
    const activities = meetings.map((meeting) => meeting.publicationActivityUri);
    await startPublicationActivities(activities);
    console.log(`Publishing documents to Themis finished at ${new Date().toISOString()}.`);
  } else {
    console.log('No meeting found for which a Themis document publication must be scheduled');
  }
};

app.use(errorHandler);
