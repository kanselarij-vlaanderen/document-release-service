import { querySudo as query, updateSudo as update  } from '@lblod/mu-auth-sudo';
import mu, { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString } from 'mu';
import { ESTIMATED_DURATION } from '../config';

const KANSELARIJ_GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

export async function queryMeetingsReadyForDocumentRelease() {
  const now = new Date();
  const releaseStartTime = new Date(now - ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>

    SELECT ?meetingUri
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri ext:algemeneNieuwsbrief ?newsletterInfo .
        ?newsletterInfo a besluitvorming:NieuwsbriefInfo ;
            ext:issuedDocDate ?scheduledDocReleaseDate .
        FILTER NOT EXISTS { ?meetingUri ext:releasedDocuments ?releaseDate . }
        FILTER NOT EXISTS {
          ?themisPublicationActivity a ext:ThemisPublicationActivity ;
              prov:used ?meetingUri ;
              ext:scope 'documents' .
        }
        FILTER(?scheduledDocReleaseDate <= ${sparqlEscapeDateTime(releaseStartTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => b['meetingUri'].value);
}

export async function releaseDocumentsForMeeting(meetings) {
  const now = new Date();

  for (let index = 0; index < meetings.length; index++) {
    const meeting = meetings[index];
    const publicationActivityId = mu.uuid();
    const publicationActivityUri = `http://themis.vlaanderen.be/id/themis-publicatie-activiteit/${publicationActivityId}`;

    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting)} ext:releasedDocuments ${sparqlEscapeDateTime(now)} .
          ${sparqlEscapeUri(publicationActivityUri)} a ext:ThemisPublicationActivity ;
            mu:uuid ${sparqlEscapeString(publicationActivityId)} ;
            prov:used ${sparqlEscapeUri(meeting)} ;
            prov:startedAtTime ${sparqlEscapeDateTime(now)} ;
            ext:scope 'newsitems', 'documents' .
        }
      }
    `);
  };
}