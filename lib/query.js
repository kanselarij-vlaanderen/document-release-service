import { querySudo as query, updateSudo as update  } from '@lblod/mu-auth-sudo';
import mu, { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString } from 'mu';
import { ESTIMATED_DURATION, RELEASE_STATUS_CONFIRMED, RELEASE_STATUS_RELEASED } from '../config';

const KANSELARIJ_GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

export async function queryMeetingsReadyForDocumentRelease() {
  const maxPublicationTime = new Date(Date.now() + ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX adms: <http://www.w3.org/ns/adms#>

    SELECT ?meetingUri ?internalDocumentPublicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit ;
          ext:finaleZittingVersie "true"^^<http://mu.semte.ch/vocabularies/typed-literals/boolean> ;
          ^ext:internalDocumentPublicationActivityUsed ?internalDocumentPublicationActivityUri .
        ?internalDocumentPublicationActivityUri a ext:InternalDocumentPublicationActivity ;
          generiek:geplandeStart ?plannedPublicationTime ;
          adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        FILTER NOT EXISTS { ?internalDocumentPublicationActivityUri prov:startedAtTime ?internalDocumentPublicationStartDate . }
        FILTER (?plannedPublicationTime <= ${sparqlEscapeDateTime(maxPublicationTime)})
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
    PREFIX adms: <http://www.w3.org/ns/adms#>

    SELECT ?meetingUri ?themisPublicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit ;
          ext:finaleZittingVersie "true"^^<http://mu.semte.ch/vocabularies/typed-literals/boolean> ;
          ^prov:used ?themisPublicationActivity .
        ?themisPublicationActivityUri a ext:ThemisPublicationActivity ;
          generiek:geplandeStart ?plannedPublicationTime ;
          adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .

        FILTER NOT EXISTS { ?themisPublicationActivityUri prov:startedAtTime ?themisPublicationStartDate . }

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
  // Yggdrasil documents publication is triggered by delta's.
  // add the prov:startedAtTime predicate
  const now = new Date();
  for (let meeting of meetings) {
    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      PREFIX adms: <http://www.w3.org/ns/adms#>

      DELETE DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.internalDocumentPublicationActivityUri)}
            adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        }
      }
      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.internalDocumentPublicationActivityUri)}
            prov:startedAtTime ${sparqlEscapeDateTime(now)} .
            adms:status ${sparqlEscapeUri(RELEASE_STATUS_RELEASED)} .
        }
      }
    `);
  };
}

export async function publishDocumentsToThemisForMeetings(meetings) {
  // Themis Export Service is doing a database request every time interval
  //    for prov:startedAtTime predicates between a publication time window start and end
  const now = new Date();
  for (let meeting of meetings) {
    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      PREFIX adms: <http://www.w3.org/ns/adms#>

      DELETE DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.themisPublicationActivityUri)}
            adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        }
      }

      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(meeting.themisPublicationActivityUri)}
            prov:startedAtTime ${sparqlEscapeDateTime(now)} .
            adms:status ${sparqlEscapeUri(RELEASE_STATUS_RELEASED)} .
        }
      }
    `);
  };
}