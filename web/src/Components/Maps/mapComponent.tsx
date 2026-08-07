import {
  MapComponentProps,
  MapTypes,
} from '../../Definitions/Definitions/mapComponent.definitions';
import { MapLibreComponent } from './maplibreComponent';
import React from 'react';

export const MapComponent = (props: MapComponentProps) => {
  const { mapType } = props;

  return <div>{mapType === MapTypes.MapLibre ? MapLibreComponent(props) : ''}</div>;
};
