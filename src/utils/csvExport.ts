import type { MiningSite } from '../types';

export function exportSitesToCSV(sites: MiningSite[]) {
  const headers = [
    'Site Code',
    'Site Name',
    'Region',
    'Country',
    'Coordinates',
    'Total Footprint (ha)',
    'Simulated New Excavation (ha)',
    'Change Percentage (%)',
    'Demo Confidence (%)',
    'Concession Status',
    'Alert Status',
    'Legal Classification Notice',
    'Sensor Feed',
    'Observation Date',
    'Audit Timestamp'
  ];

  const rows = sites.map(site => [
    `"${site.code}"`,
    `"${site.name}"`,
    `"${site.region}"`,
    `"${site.country}"`,
    `"${site.formattedCoordinates}"`,
    site.totalAreaHa,
    site.newExcavationHa,
    `${site.changePercentage}%`,
    `${site.confidenceScore}%`,
    `"${site.concessionStatus}"`,
    `"${site.alertStatus}"`,
    '"Suspected unauthorized mining — permit verification required"',
    `"${site.sensor}"`,
    site.lastObservationDate,
    `"${new Date().toISOString()}"`
  ]);

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
