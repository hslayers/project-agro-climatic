'use strict';

define(['ol', 'toolbar', 'layermanager', 'sidebar', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'hscesium', 'ows', 'bootstrap', 'datasource_selector'],

    function(ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.datasource_selector',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar',
            'hs.ows'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function(OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    $timeout(function() {
                        Core.fullScreenMap(element)
                    }, 0);
                }
            };
        }]);

        module.directive('hs.aboutproject', function() {
            function link(scope, element, attrs) {
                setTimeout(function() {
                    $('#about-dialog').modal('show');
                }, 1500);
            }
            return {
                templateUrl: './about.html?bust=' + gitsha,
                link: link
            };
        });

        function getHostname() {
            var url = window.location.href
            var urlArr = url.split("/");
            var domain = urlArr[2];
            return urlArr[0] + "//" + domain;
        };

        module.value('config', {
            terrainExaggeration: 6,
            cesiumAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MWZkMGMyZi05NWY2LTQ1YjQtOTg1Yy1iZWUzYmEwN2M0ZWEiLCJpZCI6MTE2MSwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MzIzMjg3M30.SJ1Q7M850xh3TmhLtQz55mz8d1hhgdttvrPXJg1mv44',
            imageryProvider: Cesium.createOpenStreetMapImageryProvider({
                url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
                fileExtension: 'jpg',
                credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
            }),
            cesiumTimeline: false,
            cesiumShadows: true,
            cesiumTime: Cesium.JulianDate.fromDate(new Date('2016-09-01 11:00:00.000')),
            createWorldTerrainOptions: {
                requestVertexNormals: true
            },
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OpenStreetMap",
                    base: true,
                    visible: false,
                    minimumTerrainLevel: 15
                }),

                new ol.layer.Tile({
                    title: "DEM - Hillshade",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'DEM_hillshade',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7
                }),

                new ol.layer.Tile({
                    title: "Temperatures on surface calculated directly from 4.5 x 4.5 km grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'temperature_at_midnight__surface_level',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=temperature_at_midnight__surface_level&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Dawn temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Temperatures at a sea level calculated directly from 4.5 x 4.5 km grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'temperature_at_midnight__original__sea_level',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=temperature_at_midnight__original__sea_level&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Dawn temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Temperatures detailed according to 30 x 30 m grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'downscaled_temperature_at_midnight',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=downscaled_temperature_at_midnight&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Dawn temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Detailed temperatures taking hydrological effect into account",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'downscaled_temperature_at_midnight__with_hydrography',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=downscaled_temperature_at_midnight__with_hydrography&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: true,
                    opacity: 0.7,
                    path: 'Dawn temperatures',
                    exclusive: true
                }),

                new ol.layer.Tile({
                    title: "Temperatures on surface calculated directly from 4.5 x 4.5 km grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'temperature_at_noon__surface_level',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=temperature_at_noon__surface_level&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Noon temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Temperatures at a sea level calculated directly from 4.5 x 4.5 km grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'temperature_at_noon__original__sea_level',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=temperature_at_noon__original__sea_level&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Noon temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Temperatures detailed according to 30 x 30 m grid",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'downscaled_temperature_at_noon',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=downscaled_temperature_at_noon&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Noon temperatures',
                    exclusive: true
                }),
                new ol.layer.Tile({
                    title: "Detailed temperatures taking hydrological effect into account",
                    source: new ol.source.TileWMS({
                        url: 'http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map',
                        params: {
                            LAYERS: 'downscaled_temperature_at_noon__with_hydrography',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis-new.lesprojekt.cz/cgi-bin/mapserv?map=/var/www/html/temperature_downscaling.map&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=downscaled_temperature_at_noon__with_hydrography&format=image/png&STYLE=default'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7,
                    path: 'Noon temperatures'
                })
            ],
            project_name: 'erra/map',
            datasources: [{
                title: "Micka services",
                url: "http://cat.ccss.cz/csw/",
                language: 'eng',
                type: "micka",
                code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
            }, {
                title: "OTN hub layers",
                url: "http://opentnet.eu/php/metadata/csw/",
                language: 'eng',
                type: "micka",
                code_list_url: 'http://opentnet.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
            }],
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": getHostname()
                }
            },
            'catalogue_url': "/php/metadata/csw",
            'compositions_catalogue_url': "/php/metadata/csw",
            status_manager_url: '/wwwlibs/statusmanager2/index.php',
            default_view: new ol.View({
                center: ol.proj.transform([(15.7 + 16.9601) / 2, (48.4299 + 48.8992) / 2], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 15,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config',
            function($scope, $compile, $element, Core, OlMap, config) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.singleDatasources = true;
                Core.panelEnabled('compositions', true);
                Core.panelEnabled('status_creator', false);

                $scope.$on('infopanel.updated', function(event) {});

                function createAboutDialog() {
                    var el = angular.element('<div hs.aboutproject></div>');
                    $("#hs-dialog-area").append(el);
                    $compile(el)($scope);
                }
                createAboutDialog();
            }
        ]);

        return module;
    });
