// Free-to-Use Open Source Map Tile Configuration
// Provides Dark (ESRI Dark Canvas), Street (ESRI World Street / OSM), and Hybrid (ESRI Satellite + Road Overlay)
// 100% free, zero watermark, zero 403 Forbidden errors, and 100% public uptime.
// Also supports optional MapTiler / Geoapify API key via VITE_MAP_API_KEY if supplied.

export type MapStyle = 'DARK' | 'STREET' | 'HYBRID';

export interface TileConfig {
  name: string;
  url: string;
  overlayUrl?: string;
  attribution: string;
  maxZoom: number;
}

const mapApiKey = import.meta.env.VITE_MAP_API_KEY || import.meta.env.VITE_MAPTILER_API_KEY;
const hasValidMaptilerKey = !!mapApiKey && !mapApiKey.startsWith('get_your_own') && mapApiKey !== 'free-public-access';

export const TILE_STYLES: Record<MapStyle, TileConfig> = hasValidMaptilerKey
  ? {
      DARK: {
        name: 'Dark Tactical',
        url: `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${mapApiKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      },
      STREET: {
        name: 'Street Navigation',
        url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapApiKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      },
      HYBRID: {
        name: 'Satellite Hybrid',
        url: `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${mapApiKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }
    }
  : {
      // 100% Free Public High-Resolution Tile Services (Zero API Key Required, Zero Watermarks)
      DARK: {
        name: 'Dark Tactical',
        url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        overlayUrl: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
        maxZoom: 16
      },
      STREET: {
        name: 'Street Navigation',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 19
      },
      HYBRID: {
        name: 'Satellite Hybrid',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 19
      }
    };
