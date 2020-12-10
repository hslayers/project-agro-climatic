import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import JulianDate from 'cesium/Source/Core/JulianDate';
import TimeInterval from 'cesium/Source/Core/TimeInterval';
import TimeIntervalCollection from 'cesium/Source/Core/TimeIntervalCollection';
import Entity from 'cesium/Source/DataSources/Entity';
import Color from 'cesium/Source/Core/Color';
import { Vector as VectorSource } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { HsMapService } from 'hslayers-ng';
import { HsEventBusService } from 'hslayers-ng';
import PropertyBag from 'cesium/Source/DataSources/PropertyBag';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import Map from 'ol/Map';
import BaseLayer from 'ol/layer/Base';
import { Injectable } from '@angular/core';
import {ConstantPositionProperty, CustomDataSource, Cartographic, ScreenSpaceEventType } from 'cesium';
import { AcFeaturePicker } from './ac-feature-picker';
import { AcCuttingPlanes } from './ac-cutting-planes';
import CesiumMath from 'cesium/Source/Core/Math';
import sprintf from 'cesium/Source/ThirdParty/sprintf.js';
import LGPC3 from './annual_LGP_C3_1982-2019.json';
import LGPC4 from './annual_LGP_C4_1982-2019.json';
import LOGPC3 from './annual_LOGP_C3_1982-2019.json';
import LOGPC4 from './annual_LOGP_C4_1982-2019.json';
import solarJson from './annualsum_radiation_82-19.json';
import hsuJson from './annual_HSU_C3_82-19.json';
import waterBalanceJson  from './water-balance.json';
import frostJson  from './frostdates-82-19.json';
import fertilizationDateJson  from './fertilization-date.json';

@Injectable({
    providedIn: 'root',
})
export class AcVisualizer {
    barOffsets: any = {};
    stackPartsStatus = {};
    newOlLayersAdded: Array<BaseLayer> = [];
    viewer: Viewer;
    entitiesByYear: any = {};
    fertilizationDateJson = this.processFertilizationDate(fertilizationDateJson);

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
            LGPC3: new VectorLayer({
                source: new VectorSource(), title: 'LGP for C3 crops [in days]', exclusive: false, abstract: `LGP stands for Length of Growing Period and is calculated as a sum of days when the average temperature is in between the absolute minimum and the absolute maximum of the selected crop.
            C3 crops are understood as plants that survive solely on C3 fixation, i.e. have no special features to combat photorespiration, such as cereals.`, hue: 0, boxWidth: 3000, opacity: 1, crop: 'C3', stackIndex: 0, kind: 'LGP', json: LGPC3, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false, visible: false
            }),
            LGPC4: new VectorLayer({
                source: new VectorSource(), title: 'LGP for C4 crops [in days]', exclusive: false, abstract: `LGP stands for Length of Growing Period and is calculated as a sum of days when the average temperature is in between the absolute minimum and the absolute maximum of the selected crop.
            C4 crops use the C4 carbon fixation pathway to increase their photosynthetic efficiency by reducing or suppressing photorespiration, such as maize.`, hue: 0.36, boxWidth: 3000, opacity: 1, crop: 'C4', stackIndex: 1, kind: 'LGP', json: LGPC4, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false, visible: false
            }),
            LOGPC3: new VectorLayer({
                source: new VectorSource(), title: 'LOGP for C3 crops [in days]', exclusive: false, abstract: `LOGP stands for Length of Optimal Growing Period and it is calculated as a sum of days when the average daily temperature is at the best temperatures for crop growth, between the optimal minimum and optimal maximum of the selected crop.
            C3 crops are understood as plants that survive solely on C3 fixation, i.e. have no special features to combat photorespiration, such as cereals.`, hue: 0, boxWidth: 5000, opacity: 0.8, crop: 'C3', stackIndex: 0, kind: 'LOGP', json: LOGPC3, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false, visible: true
            }),
            LOGPC4: new VectorLayer({
                source: new VectorSource(), title: 'LOGP for C4 crops [in days]', exclusive: false, abstract: `LOGP stands for Length of Optimal Growing Period and it is calculated as a sum of days when the average daily temperature is at the best temperatures for crop growth, between the optimal minimum and optimal maximum of the selected crop.
            C4 crops use the C4 carbon fixation pathway to increase their photosynthetic efficiency by reducing or suppressing photorespiration, such as maize.`, hue: 0.36, boxWidth: 5000, opacity: 0.8, crop: 'C4', stackIndex: 1, kind: 'LOGP', json: LOGPC4, prefix: 'LGP', heightScale: 200.0, path: 'yield', initialOffset: 0, condition: false, visible: false
            }),
            solar: new VectorLayer({ source: new VectorSource(), title: 'Solar radiation [in MJ/m2/year]', abstract: 'Total yearly solar energy received at the Earth’s surface.', css: '#fff200', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'Solar', json: solarJson, prefix: 'Radi', heightScale: 2.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: true, condition: true }),
            fertilization: new VectorLayer({ source: new VectorSource(), title: 'Soil temperatures for fertilization [in days before year\'s end]', abstract: 'Last fall dates determining when ammonium nitrogen fertilization can be applied without excessive nitrification during the autumn and winter when the soil temperature turns below 10 °C.', css: '#7852a9', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'Fertilization', json: this.fertilizationDateJson, prefix: 'LastD', heightScale: 300.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: false, condition: true }),
            heatStress: new VectorLayer({ source: new VectorSource(), title: 'Heat stress units [number]', abstract: 'A summary of maximum daily temperatures higher than the absolute maximum temperature for crop growth - occurs only in some years in this area of interest.', css: '#2e8b57', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'HeatStress', json: hsuJson, prefix: 'HSU', heightScale: 4000.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: false, condition: true }),
            waterBalance: new VectorLayer({ source: new VectorSource(), title: 'Water balance [in millimeters per year]', abstract: 'Value of evapotranspiration and runoff subtracted from precipitation.', hue: 0.8, boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'WaterBalance', json: waterBalanceJson, prefix: 'Pr', heightScale: 300.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: false, condition: true }),
            frostPeriod: new VectorLayer({ source: new VectorSource(), title: 'Frost-free period [in days]', abstract: 'Time period between last spring frost date and first fall frost date of the year.', css: '#813f0b', boxWidth: 5000, opacity: 1, crop: '', stackIndex: 0, kind: 'FrostFreePeriod', json: frostJson, prefix: 'Period', heightScale: 200.0, exclusive: true, path: 'conditions', initialOffset: 35000, visible: false, condition: true }),
        }

    constructor(private HsMapService: HsMapService,
        private HsEventBusService: HsEventBusService,
        private AcFeaturePicker: AcFeaturePicker,
        private AcCuttingPlanes: AcCuttingPlanes) {
        this.HsEventBusService.cesiumLoads.subscribe((data) => {
            this.init(data.viewer);
            this.AcFeaturePicker.init(data.viewer, this.barDataSource);
            this.AcCuttingPlanes.init(data.viewer, LGPC3);
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
            const tmp = sprintf("%04d", gregorianDate.year);
            return tmp;
        };

        animationViewModel.timeFormatter = function (date, viewModel) {
            return '';
        };

        (<any>viewer.timeline).makeLabel = function (time) {
            var gregorian = JulianDate.toGregorianDate(time);
            return gregorian.year;
        };
        viewer.timeline.zoomTo(JulianDate.fromDate(new Date(1982, 1, 1)), JulianDate.fromDate(new Date(2019, 1, 1)))
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