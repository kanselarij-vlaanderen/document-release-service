import { querySudo as query, updateSudo as update  } from '@lblod/mu-auth-sudo';
import mu, { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString } from 'mu';
import { ESTIMATED_DURATION } from '../config';

const KANSELARIJ_GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

export async function queryMeetingsReadyForDocumentRelease() {
  const maxPublicationTime = new Date(Date.now() + ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>

    SELECT ?meetingUri ?internalDocumentPublicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit .
        ?meetingUri ^ext:internalDocumentPublicationActivityUsed ?internalDocumentPublicationActivityUri .
        ?internalDocumentPublicationActivityUri a ext:InternalDocumentPublicationActivity .
        ?internalDocumentPublicationActivityUri generiek:geplandeStart ?plannedPublicationTime .
        FILTER NOT EXISTS { ?internalDocumentPublicationActivityUri prov:startedAtTime ?internalDocumentPublicationStartTime . }
        FILTER NOT EXISTS {
          ?themisPublicationActivityUri a ext:ThemisPublicationActivity ;
              prov:used ?meetingUri ;
              ext:scope 'documents' .
          ?themisPublicationActivityUri prov:startedAtTime ?themisPublicationStartTime .
        }
        FILTER(?plannedPublicationTime <= ${sparqlEscapeDateTime(maxPublicationTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => {
    return {
      uri: b['meetingUri'].value,
      internalDocumentPublicationActivityUri: b['internalDocumentPublicationActivityUri'].value,
      plannedPublicationTime: b['plannedPublicationTime'].value,
    };
  });
}

export async function queryMeetingsReadyForThemisRelease() {
  const maxPublicationTime = new Date(Date.now() + ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>

    SELECT ?meetingUri ?themisPublicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit .
        ?meetingUri ^prov:used ?themisPublicationActivity .
        ?themisPublicationActivityUri a ext:ThemisPublicationActivity .
        ?themisPublicationActivityUri generiek:geplandeStart ?plannedPublicationTime .

        FILTER NOT EXISTS { ?themisPublicationActivityUri prov:startedAtTime ?themisPublicationStartTime . }

        FILTER(?plannedPublicationTime <= ${sparqlEscapeDateTime(maxPublicationTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => {
    return {
      uri: b['meetingUri'].value,
      themisPublicationActivityUri: b['themisPublicationActivityUri'].value,
      plannedPublicationTime: b['plannedPublicationTime'].value,
    };
  });
}

export async function publishDocumentsInternallyForMeetings(meetings) {
  const now = new Date();

  for (let meeting of meetings) {
    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.internalDocumentPublicationActivityUri)}
            prov:startedAtTime ${sparqlEscapeDateTime(now)}
        }
      }
    `);
  };
}

export async function publishDocumentsToThemisForMeetings(meetings) {
  const now = new Date();

  for (let meeting of meetings) {
    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.themisPublicationActivityUri)}
            prov:startedAtTime ${sparqlEscapeDateTime(now)}
        }
      }
    `);
  };
}