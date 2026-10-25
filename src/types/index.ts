export type AlertSeverity = 'critical' | 'warning' | 'info' | 'compliant';

export interface MiningSite {
  id: string;
  code: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedCoordinates: string;
  totalAreaHa: number;
  newExcavationHa: number;
  changePercentage: number;
  confidenceScore: number;
  concessionStatus: 'Licensed' | 'Unlicensed' | 'Permit Expired' | 'Boundary Breach';
  alertStatus: 'High Priority' | 'Investigation Required' | 'Normal Compliance' | 'Under Review';
  mineralTarget: string;
  lastObservationDate: string;
  baselineDate: string;
  ndviBaseline: number;
  ndviCurrent: number;
  sensor: string;
  resolution: string;
  notes: string;
  currentImageUrl: string;
  baselineImageUrl: string;
  polygons?: OverlayPolygon[];
  isPermittedBenchmark?: boolean;
  permitLicenseNumber?: string;
  permittedCapHa?: number;
  environmentalRating?: 'Compliant (A)' | 'Nominal (B)' | 'Review Required (C)' | 'Critical Breach (F)';
}


export interface SatelliteAlert {
  id: string;
  siteId: string;
  siteName: string;
  region: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  detectedHectares: number;
  confidence: number;
  timestamp: string;
  coordinates: string;
  category: 'Boundary Breach' | 'Riparian Buffer Encroachment' | 'Unregistered Pit Expansion' | 'Tailings Plume';
  dismissed: boolean;
}

export interface MonthlyChangePoint {
  month: string;
  date: string;
  permittedCapHa: number;
  totalExcavationHa: number;
  unauthorizedHa: number;
  vegetationIndexNDVI: number;
  turbidityIndex: number;
}

export interface OverlayPolygon {
  id: string;
  title: string;
  type: 'suspected' | 'concession' | 'pit' | 'water' | 'road';
  areaHa: number;
  color: string;
  strokeColor: string;
  label: string;
  points: string; // SVG polygon points
  description: string;
}
