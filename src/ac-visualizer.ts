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
import { PositionProperty, ConstantPositionProperty } from 'cesium';

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
    LGPC3Source = new VectorSource();
    LGPC3Layer = new VectorLayer({ source: this.LGPC3Source, title: 'LGPC3', stackIndex: 0, kind: 'LGP' });
    LGPC4Source = new VectorSource();
    LGPC4Layer = new VectorLayer({ source: this.LGPC4Source, title: 'LGPC4', stackIndex: 1, kind: 'LGP' });
    LOGPC3Source = new VectorSource();
    LOGPC3Layer = new VectorLayer({ source: this.LGPC3Source, title: 'LOGPC3', stackIndex: 0, kind: 'LOGP' });
    LOGPC4Source = new VectorSource();
    LOGPC4Layer = new VectorLayer({ source: this.LGPC4Source, title: 'LOGPC4', stackIndex: 1, kind: 'LOGP' });
    

    constructor(private HsMapService: HsMapService, private HsEventBusService: HsEventBusService) {
        this.HsEventBusService.cesiumLoads.subscribe((data) => {
            this.init(data.viewer);
        })
    }

    async init(viewer: Viewer) {
        this.viewer = viewer;
        const map: Map = await this.HsMapService.loaded();
        for (let layer of this.newOlLayersAdded) {
            map.removeLayer(layer);
        }
        this.entitiesByYear = {};
        this.newOlLayersAdded = [];
        this.stackPartsStatus = {};
        this.barOffsets = {};
        for (let layer of [this.LGPC3Layer, this.LGPC4Layer, this.LOGPC3Layer, this.LOGPC4Layer]) {
            map.addLayer(layer);
            this.newOlLayersAdded.push(layer);
            this.stackPartsStatus[`${layer.get('kind')} ${layer.get('stackIndex')}`] = true;
            this.monitorLayerChanges(layer);
        }

        viewer.clock.multiplier = 10000000;
        viewer.clock.currentTime = JulianDate.fromDate(new Date(1982, 1, 1));
        viewer.timeline.zoomTo(JulianDate.fromDate(new Date(1982, 1, 1)), JulianDate.fromDate(new Date(2019, 1, 1)))
        
        setInterval(() => this.timer(), 200);
    }

    lastYear = 0;
    private loadEntitiesForYear(year: number, LGPC3: any, LGPC3Layer: any, LGPC4: any, LGPC4Layer: any, LOGPC3: any, LOGPC3Layer: any, LOGPC4: any, LOGPC4Layer: any) {
        const availability = new TimeIntervalCollection([
            new TimeInterval({
                start: JulianDate.fromDate(new Date(year, 1, 1)),
                stop: JulianDate.fromDate(new Date(year + 1, 1, 1))
            })
        ]);

        for (const feature of LGPC3.features) {
            this.createBar({ feature, hue: 0, stackIndex: 0, year, showProperty: availability, width: 3000.0, alpha: 1, crop: 'C3', layer: LGPC3Layer, kind: 'LGP' });
        }

        for (const feature of LGPC4.features) {
            this.createBar({ feature, hue: 0.36, stackIndex: 1, year, showProperty: availability, width: 3000.0, alpha: 1, crop: 'C4', layer: LGPC4Layer, kind: 'LGP' });
        }

        for (const feature of LOGPC3.features) {
            this.createBar({ feature, hue: 0, stackIndex: 0, year, showProperty: availability, width: 5000.0, alpha: 0.5, crop: 'C3', layer: LOGPC3Layer, kind: 'LOGP' });
        }

        for (const feature of LOGPC4.features) {
            this.createBar({ feature, hue: 0.36, stackIndex: 1, year, showProperty: availability, width: 5000.0, alpha: 0.5, crop: 'C4', layer: LOGPC4Layer, kind: 'LOGP' });
        }
    }

    timer() {
        if(!this.viewer || this.viewer.isDestroyed()) return;
        if (JulianDate.toDate(this.viewer.clock.currentTime).getFullYear() != this.lastYear) {
            this.lastYear = JulianDate.toDate(this.viewer.clock.currentTime).getFullYear();
            this.viewer.entities.suspendEvents();
            this.viewer.entities.removeAll();
            if(!this.entitiesByYear[this.lastYear])
                this.loadEntitiesForYear(this.lastYear, this.LGPC3, this.LGPC3Layer, this.LGPC4, this.LGPC4Layer, this.LOGPC3, this.LOGPC3Layer, this.LOGPC4, this.LOGPC4Layer);
            else {
                for(let entity of <Array<Entity>>this.entitiesByYear[this.lastYear]){
                    this.viewer.entities.add(entity);
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
            for (let entity of this.viewer.entities.values) {
                if (entity.properties.layer.getValue() == e.target) {
                    entity.show = show;
                }
                if (!entity.isAvailable(this.viewer.clock.currentTime))
                    continue;
                this.calcEntityStackPosition(entity, kind, stackIndex);
            }
        });
    }

    private calcEntityStackPosition(entity: Entity, kind: any, stackIndex: any) {
        const entityStackIndex = entity.properties.stackIndex.getValue();
        if (entity.properties.kind.getValue() == kind && entityStackIndex > stackIndex) {
            const longitude = entity.properties.longitude.getValue();
            const latitude = entity.properties.latitude.getValue();
            const year = entity.properties.year.getValue();
            let newSurfaceHeight = 0;
            for (let i = 0; i < entityStackIndex; i++) {
                if (this.stackPartsStatus[`${kind} ${i}`]) {
                    const increment = this.barOffsets[`${kind} ${year} ${i} ${longitude} ${latitude}`] - (i > 0 ? this.barOffsets[`${kind} ${year} ${i - 1} ${longitude} ${latitude}`] : 0);
                    newSurfaceHeight += increment;
                }
            }

            entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(
                longitude,
                latitude,
                newSurfaceHeight + entity.properties.halfHeight.getValue())
            );
        }
    }

    createBar({ feature, hue, stackIndex, year, showProperty, width, alpha, crop, layer, kind }) {
        const heightScale = 100;
        const latitude = feature.geometry.coordinates[1];
        const longitude = feature.geometry.coordinates[0];
        const height = feature.properties['LGP' + year];

        let offset = 0;
        if (stackIndex > 0) {
            offset = this.barOffsets[`${kind} ${year} ${stackIndex - 1} ${longitude} ${latitude}`];
        }
        const halfHeight = height * heightScale / 2
        const surfacePosition = Cartesian3.fromDegrees(
            longitude,
            latitude,
            offset + halfHeight
        );
        this.barOffsets[`${kind} ${year} ${stackIndex} ${longitude} ${latitude}`] = offset + height * heightScale;

        //The polyline instance itself needs to be on an entity.
        var entity = new Entity({
            position: surfacePosition,
            show: layer.getVisible(),
            availability: showProperty,
            properties: new PropertyBag({ layer, stackIndex, kind, longitude, latitude, halfHeight, year }),
            box: {
                dimensions: new Cartesian3(width, width, height * heightScale),
                material: Color.fromHsl(hue, 0.65, 0.48).withAlpha(alpha),
                outline: true,
                outlineColor: Color.fromHsl(hue, 0.8, 0.3).withAlpha(alpha),
            },
        });
        if(this.entitiesByYear[year] == undefined) this.entitiesByYear[year] = [];
        this.entitiesByYear[year].push(entity);

        //Add the entity to the collection.
        this.viewer.entities.add(entity);
    }
}