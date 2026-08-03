import { useEffect, useState } from 'react';
import { MapSourceData } from '../Definitions/Definitions/mapComponent.definitions';

/**
 * Hook that fetches forest/REDD+ project boundary polygons from Laos'
 * National Forest Monitoring System (NFMS) public ArcGIS REST service and
 * exposes them as an additional GeoJSON source/layer/outlineLayer that can
 * be composed with the existing `mapSource`/`layer`/`outlineLayer` props of
 * `MapComponent` (mapboxComponent.tsx already supports arrays for all three
 * props, so this is purely additive and does not change the existing
 * project-location drawing flow).
 *
 * Service: https://nfms.dof.maf.gov.la/arcgis/rest/services/nfms/REDD_Activity/MapServer
 * Verified layers (via `?f=json`):
 *   0 - FCPF-CF_ER-Program   (fields: FID, P_Code, Province14, Area_ha)
 *   1 - VCS_Project-ID_1684  (KML-derived fields: FID, Name, descriptio, ...)
 *   2 - VCS_Project-ID_1398  (KML-derived fields: FID, Name, descriptio, ...)
 * Response format used: `?f=geojson` (service advertises "JSON, geoJSON").
 */

const DEFAULT_NFMS_BASE_URL =
  'https://nfms.dof.maf.gov.la/arcgis/rest/services/nfms/REDD_Activity/MapServer';

// Layer indexes to merge into a single boundary source. Kept as a constant
// here (rather than hard-coding a single index) since the service currently
// exposes three separate REDD+/VCS boundary layers that all matter for Lao
// PDR context.
const DEFAULT_LAYER_IDS = [0, 1, 2];

export const NFMS_BOUNDARY_SOURCE_KEY = 'nfmsBoundary';
export const NFMS_BOUNDARY_FILL_LAYER_ID = 'nfmsBoundaryFill';
export const NFMS_BOUNDARY_OUTLINE_LAYER_ID = 'nfmsBoundaryOutline';

export interface UseNFMSBoundaryOptions {
  /** Set to false to skip fetching (e.g. when the layer is toggled off). */
  enabled?: boolean;
  /** Override the ArcGIS MapServer base URL (defaults to VITE_APP_NFMS_API_URL or the known NFMS endpoint). */
  baseUrl?: string;
  /** Override which sub-layers to merge (defaults to [0, 1, 2]). */
  layerIds?: number[];
}

export interface UseNFMSBoundaryResult {
  /** Ready to spread into MapComponent's `mapSource` prop (array-compatible). */
  nfmsMapSource?: MapSourceData;
  /** Ready to spread into MapComponent's `layer` prop (array-compatible). */
  nfmsFillLayer?: any;
  /** Ready to spread into MapComponent's `outlineLayer` prop (array-compatible). */
  nfmsOutlineLayer?: any;
  loading: boolean;
  error?: string;
  featureCount: number;
}

const getConfiguredBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_APP_NFMS_API_URL;
  return envUrl && envUrl.trim().length > 0 ? envUrl.trim() : DEFAULT_NFMS_BASE_URL;
};

/**
 * Fetches one ArcGIS FeatureServer/MapServer layer as GeoJSON and tags each
 * feature with the source layer id/name so downstream consumers (popups,
 * styling) can tell the boundaries apart even though they're merged into a
 * single map source.
 */
const fetchLayerAsGeoJSON = async (baseUrl: string, layerId: number) => {
  const url = `${baseUrl}/${layerId}/query?where=1%3D1&outFields=*&f=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NFMS layer ${layerId} request failed with status ${response.status}`);
  }
  const geojson = await response.json();
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  return features.map((feature: any) => ({
    ...feature,
    properties: {
      ...feature.properties,
      nfmsLayerId: layerId,
    },
  }));
};

export const useNFMSBoundary = (
  options: UseNFMSBoundaryOptions = {}
): UseNFMSBoundaryResult => {
  const { enabled = true, baseUrl, layerIds = DEFAULT_LAYER_IDS } = options;

  const [nfmsMapSource, setNfmsMapSource] = useState<MapSourceData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [featureCount, setFeatureCount] = useState<number>(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const resolvedBaseUrl = baseUrl || getConfiguredBaseUrl();

    const load = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const results = await Promise.all(
          layerIds.map((layerId) => fetchLayerAsGeoJSON(resolvedBaseUrl, layerId))
        );
        if (cancelled) {
          return;
        }
        const allFeatures = results.flat();

        setNfmsMapSource({
          key: NFMS_BOUNDARY_SOURCE_KEY,
          data: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: allFeatures,
            },
          },
        });
        setFeatureCount(allFeatures.length);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch NFMS boundary data', err);
          setError(err?.message || 'Failed to fetch NFMS boundary data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, baseUrl, JSON.stringify(layerIds)]);

  const nfmsFillLayer = enabled
    ? {
        id: NFMS_BOUNDARY_FILL_LAYER_ID,
        type: 'fill',
        source: NFMS_BOUNDARY_SOURCE_KEY,
        layout: {},
        paint: {
          'fill-color': '#2e7d32',
          'fill-opacity': 0.25,
        },
      }
    : undefined;

  const nfmsOutlineLayer = enabled
    ? {
        id: NFMS_BOUNDARY_OUTLINE_LAYER_ID,
        type: 'line',
        source: NFMS_BOUNDARY_SOURCE_KEY,
        layout: {},
        paint: {
          'line-color': '#1b5e20',
          'line-width': 1.5,
          'line-dasharray': [2, 1],
        },
      }
    : undefined;

  return {
    nfmsMapSource: enabled ? nfmsMapSource : undefined,
    nfmsFillLayer,
    nfmsOutlineLayer,
    loading,
    error,
    featureCount,
  };
};

export default useNFMSBoundary;
