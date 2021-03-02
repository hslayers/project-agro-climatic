import { Injectable } from '@angular/core';
import View from 'ol/View';
import { HsConfig, HsLayoutService} from 'hslayers-ng';
import { EllipsoidTerrainProvider, OpenStreetMapImageryProvider } from 'cesium';
import { Tile } from 'ol/layer';
import { OSM} from 'ol/source';
import {HslayersCesiumComponent} from 'hslayers-cesium';
import { AcVisualizer } from 'ac-visualizer';

@Injectable({providedIn: 'root'})
export class MainService {
  constructor(
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService,
    private acVisualizer: AcVisualizer
  ) { 
  }

  init(): void {
    this.HsConfig.update({
      assetsPath: 'assets/hslayers-ng',
      proxyPrefix: '../proxy/',
      cesiumBase: 'assets/cesium/',
      cesiumTimeline: true,
      cesiumdDebugShowFramesPerSecond: true,
      imageryProvider: new OpenStreetMapImageryProvider({
          url : '//a.tile.openstreetmap.org/'
      }),
      cesiumAnimation: true,
      terrain_provider: new EllipsoidTerrainProvider(),
      cesiumAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MWZkMGMyZi05NWY2LTQ1YjQtOTg1Yy1iZWUzYmEwN2M0ZWEiLCJpZCI6MTE2MSwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MzIzMjg3M30.SJ1Q7M850xh3TmhLtQz55mz8d1hhgdttvrPXJg1mv44',          
      default_layers: [
        new Tile({
          source: new OSM(),
          title: "Open street map",
          base: true,
          editor: { editable: false },
          removable: false
        })
      ],
      project_name: 'erra/map',
      default_view: new View({
        center: [1452777.8396518824, 6355469.183800302],
        zoom: 10,
        units: "m"
      }),
      datasources: [],
      hostname: {
        "default": {
          "title": "Default",
          "type": "default",
          "editable": false,
          "url": this.getHostname()
        }
      },
      panelWidths: {
      },
      panelsEnabled: {
        language: true,
        composition_browser: false,
        legend: false,
        info: false,
        saveMap: false,
        draw: false,
        sensors: false,
        feature_crossfilter: false
      },
      layerTooltipDelay: 0,
      translationOverrides: {
        "en": {
          LAYERMANAGER: {
            'conditions': 'Related to environmental variables',
            'yield': 'Related to the length of (optimal) growing period of a crop',
            "mapContent": "Agro-climatic factors",
          },
          LAYERS: {
          }
        }
      }
    });
    this.HsLayoutService.addMapVisualizer(HslayersCesiumComponent);
  }


  getHostname() {
    var url = window.location.href
    var urlArr = url.split("/");
    var domain = urlArr[2];
    return urlArr[0] + "//" + domain;
  }
}