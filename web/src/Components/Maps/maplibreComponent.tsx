import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  MapComponentProps,
  MarkerData,
} from '../../Definitions/Definitions/mapComponent.definitions';
import './maplibreComponent.scss';

// Free, key-less raster basemap built from OpenStreetMap tiles. This avoids
// any hosted-style vendor (e.g. Mapbox) and the account/token it would need.
const OSM_RASTER_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
};

export const MapLibreComponent = (props: MapComponentProps) => {
  const mapContainerRef = useRef(null);

  const {
    center,
    markers,
    mapSource,
    onClick,
    updateCenter,
    showPopupOnClick,
    onMouseMove,
    layer,
    height,
    onRender,
    onPolygonComplete,
    outlineLayer,
    updateZoomLevel,
    zoom,
  } = props;

  useEffect(() => {
    if (!mapContainerRef || !mapContainerRef.current || center.length !== 2) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current || '',
      style: OSM_RASTER_STYLE,
      center:
        !Number.isNaN(center[0]) && !Number.isNaN(center[1])
          ? [center[0], center[1]]
          : [9.082, 8.6753],
      zoom: zoom,
      maxZoom: 17,
    });

    if (onPolygonComplete) {
      const draw: any = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'draw_polygon',
      });

      map.addControl(draw as any);
      map.on('draw.create' as any, (e: any) => {
        const data = draw.getAll();
        onPolygonComplete(data);
        if (updateZoomLevel) {
          const tempZoom = map.getZoom();
          updateZoomLevel(tempZoom);
        }
        if (updateCenter) {
          const tempCenter = map.getCenter();
          updateCenter([tempCenter.lng, tempCenter.lat]);
        }
      });
    }

    map.on('load', () => {
      const currentMarkes: any = {};

      if (mapSource && Array.isArray(mapSource)) {
        mapSource.forEach((source: any) => {
          map.addSource(source.key, source.data);
        });
      } else if (mapSource) {
        map.addSource(mapSource.key, mapSource.data);
      }

      if (onClick) {
        map.on('click', function (e) {
          const popupContent = onClick(map, e);
          if (showPopupOnClick && popupContent) {
            new maplibregl.Popup()
              .setLngLat(map.unproject(e.point))
              .setHTML(popupContent)
              .addTo(map);
          }
        });
      }

      if (onMouseMove) {
        map.on('mousemove', function (e) {
          onMouseMove(map, e);
        });
      }

      if (layer && Array.isArray(layer)) {
        layer.forEach((item: any) => {
          map.addLayer(item);
        });
      } else if (layer) {
        map.addLayer(layer);
      }

      if (outlineLayer && Array.isArray(layer)) {
        outlineLayer.forEach((item: any) => {
          map.addLayer(item);
        });
      } else if (outlineLayer) {
        map.addLayer(outlineLayer);
      }

      if (onRender) {
        map.on('render', () => {
          const markersList: MarkerData[] = onRender(map);
          if (markersList) {
            markersList.forEach((marker: MarkerData) => {
              if (!currentMarkes[marker.id as number]) {
                const createdMarker = new maplibregl.Marker({
                  color: marker.color,
                  element: marker.element ? marker.element : undefined,
                })
                  .setLngLat([marker.location[0], marker.location[1]])
                  .addTo(map);
                currentMarkes[marker.id as number] = createdMarker;
              }
            });

            for (const id in currentMarkes) {
              if (!markersList?.some((marker: MarkerData) => marker.id?.toString() === id)) {
                currentMarkes[id].remove();
                delete currentMarkes[id];
              }
            }
          }
        });
      }
    });

    if (markers) {
      markers.forEach((marker: MarkerData) => {
        new maplibregl.Marker({
          color: marker.color,
          element: marker.element ? marker.element : undefined,
        })
          .setLngLat([marker.location[0], marker.location[1]])
          .addTo(map);
      });
    }
  });

  return (
    <div
      className="map-box-container"
      style={{ width: '100%', height: `${height}px` }}
      ref={mapContainerRef}
    />
  );
};
