'use strict';
import 'hslayers-ng/components/toolbar/toolbar.module';
import 'hslayers-ng/components/print/print.module';
import 'hslayers-ng/components/query/query.module';
import 'hslayers-ng/components/search/search.module';
import 'hslayers-ng/components/add-layers/add-layers.module';
import 'hslayers-ng/components/measure/';
import 'hslayers-ng/components/permalink/permalink.module';
import 'hslayers-ng/components/info/info.module';
import 'hslayers-ng/components/datasource-selector/datasource-selector.module';
import 'hslayers-ng/components/sidebar/sidebar.module';
import 'hslayers-ng/components/draw/draw.module';
import 'hslayers-ng/components/hscesium/hscesium.module';
import * as angular from 'angular';
import View from 'ol/View';
import { Tile, Group, Image as ImageLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Style, Stroke, Fill } from 'ol/style';
import { HsEventBusService } from 'hslayers-ng/components/core/event-bus.service';
import EllipsoidTerrainProvider from 'cesium/Source/Core/EllipsoidTerrainProvider'
import { AcVisualizer } from './ac-visualizer';

var module = angular.module('hs', [
  'hs.sidebar',
  'hs.draw',
  'hs.info',
  'hs.toolbar',
  'hs.layermanager',
  'hs.query',
  'hs.search', 'hs.print', 'hs.permalink',
  'hs.geolocation',
  'hs.datasource_selector',
  'hs.save-map',
  'hs.measure',
  'hs.addLayers',
  'hs.cesium'
]);

module.directive('hs', function (HsCore) {
  'ngInject';
  return {
    template: HsCore.hslayersNgTemplate,
    link: function (scope, element) {

    }
  };
});

function getHostname() {
  var url = window.location.href
  var urlArr = url.split("/");
  var domain = urlArr[2];
  return urlArr[0] + "//" + domain;
};

module.value('HsConfig', {
  proxyPrefix: '../proxy/',
  cesiumBase: './',
  cesiumTimeline: true,
  cesiumdDebugShowFramesPerSecond: true,
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
  advanced_form: true,
  datasources: [],
  hostname: {
    "default": {
      "title": "Default",
      "type": "default",
      "editable": false,
      "url": getHostname()
    }
  },
  panelWidths: {
  },
  panelsEnabled: {
    language: false,
    composition_browser: false,
    legend: false,
    ows: false,
    info: false,
    saveMap: false,
    draw: false,
    sensors: false,
    feature_crossfilter: false,
    routing: false,
    tracking: false
  }
});

module.controller('Main', function ($scope, HsCore, $compile, HsLayoutService, HsEventBusService: HsEventBusService, HsMapService) {
  'ngInject';
  $scope.panelVisible = (which) => HsLayoutService.panelVisible(which);
  HsLayoutService.sidebarRight = true;
  //layoutService.sidebarToggleable = false;
  HsCore.singleDatasources = true;
  HsLayoutService.sidebarButtons = true;
  HsEventBusService.cesiumLoads.subscribe((data) => {
    const visualizer = new AcVisualizer(data.viewer, HsMapService, HsEventBusService);
  })
}
);

export default module;