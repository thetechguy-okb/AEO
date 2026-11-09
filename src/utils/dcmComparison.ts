import { DcmPublication, DcmComparisonResult, DcmStateChange, NIGERIA_37_JURISDICTIONS } from '../types/dcm';

/**
 * Sorts DCM publications chronologically ascending by period end date
 */
export function sortDcmChronologically(publications: DcmPublication[]): DcmPublication[] {
  return [...publications].sort((a, b) => {
    const timeA = new Date(a.periodEnd).getTime();
    const timeB = new Date(b.periodEnd).getTime();
    return timeA - timeB;
  });
}

/**
 * Automatically compares a DCM publication against its immediately preceding published counterpart
 */
export function compareDcmPublications(
  currentPublication: DcmPublication,
  allPublications: DcmPublication[]
): DcmComparisonResult {
  // Only compare against published publications
  const publishedOnly = allPublications.filter(p => p.status === 'published');
  const sorted = sortDcmChronologically(publishedOnly);

  const currentIndex = sorted.findIndex(p => p.id === currentPublication.id);

  if (currentPublication.isBaseline || currentIndex <= 0) {
    // Baseline publication or not found
    return {
      hasPrevious: false,
      changedStates: [],
      totalChanged: 0,
      isBaseline: true,
      methodologyChanged: false
    };
  }

  const previousPublication = sorted[currentIndex - 1];
  const changedStates: DcmStateChange[] = [];

  for (const jurisdiction of NIGERIA_37_JURISDICTIONS) {
    const code = jurisdiction.code;
    const prevRecord = previousPublication.classifications[code];
    const currRecord = currentPublication.classifications[code];

    if (!prevRecord || !currRecord) continue;
    if (!prevRecord.classification || !currRecord.classification) continue;

    if (prevRecord.classification !== currRecord.classification) {
      let changeType: 'changed' | 'first-classification' | 'returned-to-insufficient' = 'changed';
      if (prevRecord.classification === 'Insufficient evidence') {
        changeType = 'first-classification';
      } else if (currRecord.classification === 'Insufficient evidence') {
        changeType = 'returned-to-insufficient';
      }

      changedStates.push({
        stateCode: code,
        stateName: jurisdiction.name,
        previousClassification: prevRecord.classification,
        newClassification: currRecord.classification,
        rationale: currRecord.classificationRationale || '',
        rightOfResponseStatus: currRecord.rightOfResponseStatus,
        changeType
      });
    }
  }

  return {
    hasPrevious: true,
    previousPublication,
    changedStates,
    totalChanged: changedStates.length,
    isBaseline: false,
    methodologyChanged: previousPublication.methodologyVersion !== currentPublication.methodologyVersion
  };
}

/**
 * Compiles historical classification timeline for a specific state across all published publications
 */
export function getStateHistoryAcrossPublications(
  stateCode: string,
  publications: DcmPublication[]
): Array<{
  publicationId: string;
  reportingPeriodLabel: string;
  year: number;
  month: number;
  periodIndex: number;
  periodEnd: string;
  classification: string;
  isBaseline?: boolean;
  hasExplicitClassification: boolean;
  rationale?: string;
  evidence?: string;
  response?: string;
  isCurrentActive: boolean;
}> {
  const published = sortDcmChronologically(publications.filter(p => p.status === 'published'));

  return published.map(pub => {
    const record = pub.classifications[stateCode];
    const hasExplicit = Boolean(record && record.classification);
    return {
      publicationId: pub.id,
      reportingPeriodLabel: pub.reportingPeriodLabel,
      year: pub.year,
      month: pub.month,
      periodIndex: pub.periodIndex,
      periodEnd: pub.periodEnd,
      isBaseline: pub.isBaseline,
      classification: hasExplicit ? (record!.classification) : 'Data unavailable',
      hasExplicitClassification: hasExplicit,
      rationale: record?.classificationRationale,
      evidence: record?.evidenceSummary,
      response: record?.rightOfResponseStatus,
      isCurrentActive: false
    };
  });
}
