import { querySudo as query, updateSudo as update  } from '@lblod/mu-auth-sudo';
import mu, { sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';
import { ESTIMATED_DURATION } from '../config';

const KANSELARIJ_GRAPH = '<http://mu.semte.ch/graphs/organizations/kanselarij>';

export async function queryMeetingsReadyForDocumentRelease() {
  const now = new Date();
  const releaseStartTime = new Date(now - ESTIMATED_DURATION);

  // TODO 1 is it ok to return the meeting iso the newsItem - the inserts will be done on meeting level
  // TODO 2 can we assume there is only one meeting?
  // TODO 3 what if documents have been released before, but need to be released again?
  // With the current filter this will not work since ?meetingUri ext:releasedDocuments ?releaseDate exists
  // as does the themisPublicationActivity
  const result = await query(`
    PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT ?meetingUri
    WHERE {
      GRAPH ${KANSELARIJ_GRAPH} {
        ?newsletterInfo a besluitvorming:NieuwsbriefInfo ;
          ext:issuedDocDate ?publicationDocDate .
        ?meetingUri ext:algemeneNieuwsbrief ?newsletterInfo .
        ?themisPublicationActivity prov:used ?meetingUri
        FILTER NOT EXISTS {
          ?themisPublicationActivity prov:used ?meetingUri .
          ?themisPublicationActivity ext:scope 'documents' }
        FILTER NOT EXISTS { ?meetingUri ext:releasedDocuments ?releaseDate }
        FILTER(?publicationDocDate >= ${sparqlEscapeDateTime(releaseStartTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => b['meetingUri'].value);
}

export async function releaseDocumentsForMeeting(meetingUris) {
  const now = new Date();
  const releaseStartTime = new Date(now - (ESTIMATED_DURATION * 60 * 1000));

  for (let index = 0; index < meetingUris.length; index++) {
    const meetingUri = meetingUris[index];
    const id = mu.uuid();

    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

      INSERT DATA {
        GRAPH ${KANSELARIJ_GRAPH} {
          ${sparqlEscapeUri(meetingUri)} ext:releasedDocuments ${sparqlEscapeDateTime(releaseStartTime)} .
          <http://themis.vlaanderen.be/id/themis-publicatie-activiteit/${id}> a ext:ThemisPublicationActivity ;
            mu:uuid "${id}" ;
            prov:used ${sparqlEscapeUri(meetingUri)} ;
            prov:startedAtTime ${sparqlEscapeDateTime(releaseStartTime)} ;
            ext:scope 'newsitems' ;
            ext:scope 'documents' .
      }
    }`);
  };
}