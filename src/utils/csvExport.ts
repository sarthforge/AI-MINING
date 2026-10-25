import type { MiningSite } from '../types';

export function exportSitesToCSV(sites: MiningSite[]) {
  const headers = [
    'Site Code',
    'Site Name',
    'Region',
    'Country',
    'Classification Category',
    'Permit License Number',
    'Coordinates',
    'Total Footprint (ha)',
    'Permitted Cap (ha)',
    'Simulated Excavation Delta (ha)',
    'Change Percentage (%)',
    'Demo Confidence (%)',
    'Concession Status',
    'Alert Status',
    'Legal Classification Notice',
    'Sensor Feed',
    'Observation Date',
    'Audit Timestamp'
  ];

  const rows = sites.map(site => {
    const isBenchmark = site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance';
    const classification = isBenchmark ? 'Permitted Benchmark Reference' : 'Suspected Breach AOI';
    const legalNotice = isBenchmark
      ? 'Verified Permitted Cadastre — Compliant Baseline'
      : (site.alertStatus === 'Investigation Required' || site.alertStatus === 'Under Review')
        ? 'Operational Lease Verification In Progress'
        : 'Suspected unauthorized mining — permit verification required';

    return [
      `"${site.code}"`,
      `"${site.name}"`,
      `"${site.region}"`,
      `"${site.country}"`,
      `"${classification}"`,
      `"${site.permitLicenseNumber || 'N/A'}"`,
      `"${site.formattedCoordinates}"`,
      site.totalAreaHa,
      site.permittedCapHa || 'N/A',
      site.newExcavationHa,
      `${site.changePercentage}%`,
      `${site.confidenceScore}%`,
      `"${site.concessionStatus}"`,
      `"${site.alertStatus}"`,
      `"${legalNotice}"`,
      `"${site.sensor}"`,
      site.lastObservationDate,
      `"${new Date().toISOString()}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TerraWatch_AI_Mining_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
