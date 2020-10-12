import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import JulianDate from 'cesium/Source/Core/JulianDate';
import TimeInterval from 'cesium/Source/Core/TimeInterval';
import TimeIntervalCollection from 'cesium/Source/Core/TimeIntervalCollection';
import Entity from 'cesium/Source/DataSources/Entity';
import Color from 'cesium/Source/Core/Color';
import { Vector as VectorSource } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { HsMapService } from 'hslayers-ng/components/map/map.service';
import { HsEventBusService } from 'hslayers-ng/components/core/event-bus.service';
import PropertyBag from 'cesium/Source/DataSources/PropertyBag';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import Map from 'ol/Map';
import BaseLayer from 'ol/layer/Base';
import { Injectable } from '@angular/core';
import { PositionProperty, ConstantPositionProperty, CustomDataSource, Cartographic, ScreenSpaceEventType } from 'cesium';
import { AcFeaturePicker } from './ac-feature-picker';
import { AcCuttingPlanes } from './ac-cutting-planes';
import CesiumMath from 'cesium/Source/Core/Math';
import sprintf from 'cesium/Source/ThirdParty/sprintf.js';
@Injectable({
    providedIn: 'root',
})
export class AcVisualizer {
    barOffsets: any = {};
    stackPartsStatus = {};
    newOlLayersAdded: Array<BaseLayer> = [];
    viewer: Viewer;
    entitiesByYear: any = {};
    LGPC3 = require('./annual_LGP_C3_1982-2019.json');
    LGPC4 = require('./annual_LGP_C4_1982-2019.json');
    LOGPC3 = require('./annual_LOGP_C3_1982-2019.json');
    LOGPC4 = require('./annual_LOGP_C4_1982-2019.json');
    solarJson = require('./annualsum_radiation_82-19.json');
    hsuJson = require('./annual_HSU_C3_82-19.json');
    waterBalanceJson = require('./water-balance.json');
    frostJson = require('./frostdates-82-19.json');
    fertilizationDateJson = this.processFertilizationDate(require('./fertilization-date.json'));

    lastYear = 0;
    barDataSource = new CustomDataSource("Bar chart");
    bounds: any;
    layers: {
        LGPC3
        LGPC4
        LOGPC3
        LOGPC4
        solar,
        fertilization,
        heatStress,
        waterBalance,
        frostPeriod
    } = {
            LGPC3: new VectorLayer({ source: new VectorSource(), title: 'LGP for C3 crops [in days]', hue: 0, boxWidth: 3000, opacity: 1, crop: 'C3', stackIndex: 0, kind: 'LGP', json: this.LGPC3, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false }),
            LGPC4: new VectorLayer({ source: new VectorSource(), title: 'LGP for C4 crops [in days]', hue: 0.36, boxWidth: 3000, opacity: 1, crop: 'C4', stackIndex: 1, kind: 'LGP', json: this.LGPC4, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false }),
            LOGPC3: new VectorLayer({ source: new VectorSource(), title: 'LOGP for C3 crops [in days]', hue: 0, boxWidth: 5000, opacity: 0.5, crop: 'C3', stackIndex: 0, kind: 'LOGP', json: this.LOGPC3, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false }),
            LOGPC4: new VectorLayer({ source: new VectorSource(), title: 'LOGP for C4 crops [in days]', hue: 0.36, boxWidth: 5000, opacity: 0.5, crop: 'C4', stackIndex: 1, kind: 'LOGP', json: this.LOGPC4, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false }),
            solar: new VectorLayer({ source: new VectorSource(), title: 'Solar radiation [in MJ/m2/year]', css: '#fff200', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'Solar', json: this.solarJson, prefix: 'Radi', heightScale: 2.0, exclusive: true, path: 'conditions', initialOffset: 0, visible: true, condition: true }),
            fertilization: new VectorLayer({ source: new VectorSource(), title: 'Soil temperatures for fertilization [in days/date]', css: '#7852a9', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'Fertilization', json: this.fertilizationDateJson, prefix: 'LastD', heightScale: 300.0, exclusive: true, path: 'conditions', initialOffset: 0, visible: false, condition: true }),
            heatStress: new VectorLayer({ source: new VectorSource(), title: 'Heat stress units [number]', css: '#2e8b57', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'HeatStress', json: this.hsuJson, prefix: 'HSU', heightScale: 4000.0, exclusive: true, path: 'conditions', initialOffset: 0, visible: false, condition: true }),
            waterBalance: new VectorLayer({ source: new VectorSource(), title: 'Water balance [in millimeters per year]', hue: 0.8, boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'WaterBalance', json: this.waterBalanceJson, prefix: 'Pr', heightScale: 300.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: false, condition: true }),
            frostPeriod: new VectorLayer({ source: new VectorSource(), title: 'Frost-free period [in days]', css: '#813f0b', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'FrostFreePeriod', json: this.frostJson, prefix: 'Period', heightScale: 200.0, exclusive: true, path: 'conditions', initialOffset: 0, visible: false, condition: true }),
        }

    constructor(private HsMapService: HsMapService,
        private HsEventBusService: HsEventBusService,
        private AcFeaturePicker: AcFeaturePicker,
        private AcCuttingPlanes: AcCuttingPlanes) {
        this.HsEventBusService.cesiumLoads.subscribe((data) => {
            this.init(data.viewer);
            this.AcFeaturePicker.init(data.viewer, this.barDataSource);
            this.AcCuttingPlanes.init(data.viewer, this.LGPC3);
            this.AcCuttingPlanes.boundsCalculated.subscribe(bounds => {
                this.bounds = bounds;
                for (let entity of this.barDataSource.entities.values) {
                    this.calculateEntityVisibility(entity);
                }
            })
        })
    }

    processFertilizationDate(json: any) {
        for (const feature of json.features) {
            for (let i = 1982; i < 2019; i++) {
                const parsedDate = new Date(feature.properties[`LastD${i}`]);
                var start = new Date(parsedDate.getFullYear(), 0, 0);
                var diff = parsedDate.getTime() - start.getTime();
                var oneDay = 1000 * 60 * 60 * 24;
                var day = Math.floor(diff / oneDay) - 200;
                feature.properties[`LastD${i}`] = day
            }
        }
        return json
    }

    async init(viewer: Viewer) {
        this.viewer = viewer;
        const map: Map = await this.HsMapService.loaded();
        for (let layer of this.newOlLayersAdded) {
            map.removeLayer(layer);
        }
        this.viewer.dataSources.add(this.barDataSource);
        this.entitiesByYear = {};
        this.newOlLayersAdded = [];
        this.stackPartsStatus = {};
        this.barOffsets = {};
        for (let layer of Object.keys(this.layers).map(key => this.layers[key])) {
            map.addLayer(layer);
            this.newOlLayersAdded.push(layer);
            this.stackPartsStatus[`${layer.get('kind')} ${layer.get('stackIndex')}`] = true;
            this.monitorLayerChanges(layer);
        }

        viewer.screenSpaceEventHandler.setInputAction((
            movement
        ) => {
            this.AcCuttingPlanes.mouseMoved(movement);
            this.AcFeaturePicker.mouseMoved(movement);
        }, ScreenSpaceEventType.MOUSE_MOVE);


        viewer.clock.multiplier = 10000000;
        viewer.clock.currentTime = JulianDate.fromDate(new Date(1982, 1, 1));
        viewer.timeline.zoomTo(JulianDate.fromDate(new Date(1982, 1, 1)), JulianDate.fromDate(new Date(2019, 1, 1)))

        viewer.scene.camera.flyTo({
            destination: Cartesian3.fromDegrees(12.0000003, 46.90000, 185000.0),
            orientation: {
                heading: CesiumMath.toRadians(20.0),
                pitch: CesiumMath.toRadians(-25.0),
                roll: 0.0,
            },
        });

        var animationViewModel = viewer.animation.viewModel;
        animationViewModel.dateFormatter = function (date, viewModel) { 
            var gregorianDate = JulianDate.toGregorianDate(date);
            return sprintf("%04d", gregorianDate.year);};

        animationViewModel.timeFormatter = function (date, viewModel) {
            return ''; 
        };

        (<any> viewer.timeline).makeLabel = function (time) {
            var gregorian = JulianDate.toGregorianDate(time);
            return gregorian.year;
        };
        setInterval(() => this.timer(), 200);
    }



    private loadEntitiesForYear(year: number) {
        const availability = new TimeIntervalCollection([
            new TimeInterval({
                start: JulianDate.fromDate(new Date(year, 1, 1)),
                stop: JulianDate.fromDate(new Date(year + 1, 1, 1))
            })
        ]);

        for (let layer of Object.keys(this.layers).map(key => this.layers[key])) {
            for (const feature of layer.get('json').features) {
                let hue = layer.get('hue');
                let css = layer.get('css');
                const kind = layer.get('kind');
                if (kind == 'WaterBalance') {
                    const height = parseFloat(feature.properties['Pr' + year]);
                    hue = height > 0 ? 0.5 : 0.15
                }
                this.createBar({ feature, hue, css, stackIndex: layer.get('stackIndex'), year, showProperty: availability, width: layer.get('boxWidth'), alpha: layer.getOpacity(), crop: layer.get('crop'), layer, kind, prefix: layer.get('prefix'), heightScale: layer.get('heightScale'), initialOffset: layer.get('initialOffset') });
            }
        }
    }

    timer() {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        if (JulianDate.toDate(this.viewer.clock.currentTime).getFullYear() != this.lastYear) {
            this.lastYear = JulianDate.toDate(this.viewer.clock.currentTime).getFullYear();
            this.viewer.entities.suspendEvents();
            this.barDataSource.entities.removeAll();
            if (!this.entitiesByYear[this.lastYear])
                this.loadEntitiesForYear(this.lastYear);
            else {
                for (let entity of <Array<Entity>>this.entitiesByYear[this.lastYear]) {
                    this.barDataSource.entities.add(entity);
                }
            }
            for (let entity of this.entitiesByYear[this.lastYear]) {
                this.calcEntityStackPosition(entity, entity.properties.kind.getValue(), 0);
            }
            this.viewer.entities.resumeEvents();
        }
    }

    private monitorLayerChanges(layer: any) {
        layer.on('change:visible', (e) => {
            const show = e.target.getVisible();
            const kind = e.target.get('kind');
            const stackIndex = e.target.get('stackIndex');
            this.stackPartsStatus[`${layer.get('kind')} ${layer.get('stackIndex')}`] = show;
            for (let entity of this.barDataSource.entities.values) {
                if (entity.properties.layer.getValue() == e.target) {
                    this.calculateEntityVisibility(entity);
                }
                if (!entity.isAvailable(this.viewer.clock.currentTime))
                    continue;
                this.calcEntityStackPosition(entity, kind, stackIndex);
            }
        });
    }

    calculateEntityVisibility(entity: Entity) {
        entity.show = entity.properties.layer.valueOf().getVisible() && (this.bounds == null || this.entityInBounds(entity));
    }
    entityInBounds(entity: Entity): boolean {
        const position = Cartographic.fromCartesian(entity.position.getValue(this.viewer.clock.currentTime));
        return position.longitude >= this.bounds.minX && position.longitude <= this.bounds.maxX && position.latitude >= this.bounds.minY && position.latitude <= this.bounds.maxY;
    }

    private calcEntityStackPosition(entity: Entity, kind: any, stackIndex: any) {
        const entityStackIndex = entity.properties.stackIndex.getValue();
        if (entity.properties.kind.getValue() == kind && entityStackIndex > stackIndex) {
            const longitude = entity.properties.longitude.getValue();
            const latitude = entity.properties.latitude.getValue();
            const year = entity.properties.year.getValue();
            let newSurfaceHeight = entity.properties.initialOffset.getValue();
            for (let i = 0; i < entityStackIndex; i++) {
                if (this.stackPartsStatus[`${kind} ${i}`]) {
                    const increment = this.barOffsets[`${kind} ${year} ${i} ${longitude} ${latitude}`] - (i > 0 ? this.barOffsets[`${kind} ${year} ${i - 1} ${longitude} ${latitude}`] : 0);
                    newSurfaceHeight += increment;
                }
            }

            const halfHeight = entity.properties.halfHeight.getValue();
            const height = entity.properties.height.getValue();
            const condition = entity.properties.condition.getValue();
            entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(
                longitude + (condition ? this.horizOffsetByCondition : -this.horizOffsetByCondition),
                latitude,
                newSurfaceHeight + halfHeight * Math.sign(height))
            );
        }
    }

    horizOffsetByCondition = 0.0125;

    createBar({ feature, hue, css, stackIndex, year, showProperty, width, alpha, crop, layer, kind, prefix, heightScale, initialOffset }) {
        const latitude = feature.geometry.coordinates[1];
        const longitude = feature.geometry.coordinates[0];
        const height = parseFloat(feature.properties[prefix + year]);
        const condition = layer.get('condition');
        if (!height) return;

        let offset = initialOffset;
        if (stackIndex > 0) {
            offset = this.barOffsets[`${kind} ${year} ${stackIndex - 1} ${longitude} ${latitude}`];
        }
        const halfHeight = Math.abs(height) * heightScale / 2.0

        const surfacePosition = Cartesian3.fromDegrees(
            longitude + (condition ? this.horizOffsetByCondition : -this.horizOffsetByCondition),
            latitude,
            offset + halfHeight * Math.sign(height)
        );
        this.barOffsets[`${kind} ${year} ${stackIndex} ${longitude} ${latitude}`] = offset + height * heightScale;
        const material = hue !== undefined ? Color.fromHsl(hue, 0.65, 0.48).withAlpha(alpha) : Color.fromCssColorString(css).withAlpha(alpha);
        const outlineColor = new Color();
        material.clone().darken(0.5, outlineColor);
        //The polyline instance itself needs to be on an entity.
        var entity = new Entity({
            position: surfacePosition,
            show: layer.getVisible(),
            availability: showProperty,
            properties: new PropertyBag({ layer, stackIndex, kind, longitude, latitude, halfHeight, year, height, crop, initialOffset, condition }),
            box: {
                dimensions: new Cartesian3(width / 2.0, width, Math.abs(height) * heightScale),
                material,
                outline: true,
                outlineColor,
            },
        });
        if (this.entitiesByYear[year] == undefined) this.entitiesByYear[year] = [];
        this.entitiesByYear[year].push(entity);

        //Add the entity to the collection.
        this.barDataSource.entities.add(entity);
    }
}