import { app, errorHandler } from 'mu';
import { RELEASE_CRON_PATTERN } from './config';
import { CronJob } from 'cron';
import {  
  queryMeetingsReadyForDocumentRelease, 
  queryMeetingsReadyForThemisRelease,
  publishDocumentsInternallyForMeetings,
  publishDocumentsToThemisForMeetings,
} from './lib/query';

new CronJob(RELEASE_CRON_PATTERN, async function() {
  console.log(`Automatic release of documents triggered by cron job at ${new Date().toISOString()}`);
  await triggerInternalDocumentPublication();
  await triggerThemisDocumentPublication()
}, null, true);

// TODO KAS-3431 check currently does not confirm if the meeting is final. We might release stuff too soon.
// What happens if meeting in finalized outside of the release window?
// What happens if I never confirm the release datetime? nothing it seems
// What happens if decisions have never been released? document should not be released regardless of time.
// saving the internal models again in frontend without refresh removes the prov:startedAtTime!!

async function triggerInternalDocumentPublication() {
  const meetings = await queryMeetingsReadyForDocumentRelease();

  if (meetings.length) {
    console.log(`Found ${meetings.length} meetings for which an internal document publication must be triggered.`);
    meetings.forEach((meeting) => {
      console.log(`- <${meeting.uri}> internal document publication scheduled at ${meeting.plannedPublicationTime}`);
    });
    await publishDocumentsInternallyForMeetings(meetings);
    console.log(`Releasing documents finished at ${new Date().toISOString()}.`);
  } else {
    console.log('No meeting found for which an internal document publication must be scheduled');
  }
};

async function triggerThemisDocumentPublication() {
  const meetings = await queryMeetingsReadyForThemisRelease();

  if (meetings.length) {
    console.log(`Found ${meetings.length} meetings for which a themis document publication must be triggered.`);
    meetings.forEach((meeting) => {
      console.log(`- <${meeting.uri}> themis document publication scheduled at ${meeting.plannedPublicationTime}`);
    });
    await publishDocumentsToThemisForMeetings(meetings);
    console.log(`Publishing documents to themis finished at ${new Date().toISOString()}.`);
  } else {
    console.log('No meeting found for which a themis document publication must be scheduled');
  }
};

app.use(errorHandler);
