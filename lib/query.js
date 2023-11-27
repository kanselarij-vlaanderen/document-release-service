import { querySudo as query, updateSudo as update  } from '@lblod/mu-auth-sudo';
import mu, { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString } from 'mu';
import { ESTIMATED_DURATION, RELEASE_STATUS_CONFIRMED, RELEASE_STATUS_RELEASED } from '../config';

const KANSELARIJ_GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

export async function queryMeetingsReadyForDocumentRelease() {
  const estimatedPublicationEndTime = new Date(Date.now() + ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX adms: <http://www.w3.org/ns/adms#>

    SELECT ?meetingUri ?publicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit ;
          ^ext:internalDocumentPublicationActivityUsed ?publicationActivityUri .
        ?publicationActivityUri a ext:InternalDocumentPublicationActivity ;
          generiek:geplandeStart ?plannedPublicationTime ;
          adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        FILTER NOT EXISTS { ?publicationActivityUri prov:startedAtTime ?startDate . }
        FILTER (?plannedPublicationTime <= ${sparqlEscapeDateTime(estimatedPublicationEndTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => {
    return {
      uri: b['meetingUri'].value,
      publicationActivityUri: b['publicationActivityUri'].value,
      plannedPublicationTime: b['plannedPublicationTime'].value,
    };
  });
}

export async function queryMeetingsReadyForThemisRelease() {
  const estimatedPublicationEndTime = new Date(Date.now() + ESTIMATED_DURATION);
  const result = await query(`
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX adms: <http://www.w3.org/ns/adms#>

    SELECT ?meetingUri ?publicationActivityUri ?plannedPublicationTime
    WHERE {
      GRAPH <${KANSELARIJ_GRAPH}> {
        ?meetingUri a besluit:Vergaderactiviteit ;
          ^prov:used ?publicationActivityUri .
        ?publicationActivityUri a ext:ThemisPublicationActivity ;
          generiek:geplandeStart ?plannedPublicationTime ;
          adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        FILTER NOT EXISTS { ?publicationActivityUri prov:startedAtTime ?startDate . }
        FILTER(?plannedPublicationTime <= ${sparqlEscapeDateTime(estimatedPublicationEndTime)})
      }
    }
  `);

  return result.results.bindings.map((b) => {
    return {
      uri: b['meetingUri'].value,
      publicationActivityUri: b['publicationActivityUri'].value,
      plannedPublicationTime: b['plannedPublicationTime'].value,
    };
  });
}

/**
 * Internal document publication is done by Yggdrasil based on incoming deltas.
 * By inserting a startDate and release status on the activity, Yggdrasil will be triggered.
 *
 * Scheduled Themis publications are queried on a frequent basis by themis-export-service.
*/
export async function startPublicationActivities(activities) {
  const now = new Date();
  for (let activity of activities) {
    await update(`
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX adms: <http://www.w3.org/ns/adms#>

      DELETE DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(activity)} adms:status ${sparqlEscapeUri(RELEASE_STATUS_CONFIRMED)} .
        }
      }

      ;

      INSERT DATA {
        GRAPH <${KANSELARIJ_GRAPH}> {
          ${sparqlEscapeUri(activity)} prov:startedAtTime ${sparqlEscapeDateTime(now)} ;
            adms:status ${sparqlEscapeUri(RELEASE_STATUS_RELEASED)} .
        }
      }
    `);
  };
}
