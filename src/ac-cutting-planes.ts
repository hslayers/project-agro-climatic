import { Injectable } from '@angular/core';
import Color from 'cesium/Source/Core/Color';
import Entity from 'cesium/Source/DataSources/Entity';
import { ScreenSpaceEventType, PostProcessStageLibrary, defined, Viewer, Property, ConstantProperty, CustomDataSource, Cartesian3, PropertyBag, SceneMode, Cartographic, PositionProperty, ConstantPositionProperty, ColorBlendMode, TranslationRotationScale, Quaternion } from 'cesium';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AcCuttingPlanes {
    cornersDataSource = new CustomDataSource("Corner stones");
    movingSizer: Entity;
    viewer: Viewer;
    boundsCalculated: Subject<any> = new Subject();

    init(viewer: Viewer, LGPC3) {
        this.viewer = viewer;
        let bounds = { maxX: Number.MIN_VALUE, minX: Number.MAX_VALUE, maxY: Number.MIN_VALUE, minY: Number.MAX_VALUE }
        for (const feature of LGPC3.features) {
            const latitude = feature.geometry.coordinates[1];
            const longitude = feature.geometry.coordinates[0];
            if (latitude > bounds.maxY) bounds.maxY = latitude;
            if (latitude < bounds.minY) bounds.minY = latitude;
            if (longitude > bounds.maxX) bounds.maxX = longitude;
            if (longitude < bounds.minX) bounds.minX = longitude;
        }
        this.createSizer(bounds.minX - 0.1, bounds.minY - 0.1, 'left-bottom');
        this.createSizer(bounds.maxX + 0.1, bounds.minY - 0.1, 'right-bottom');
        this.createSizer(bounds.maxX + 0.1, bounds.maxY + 0.1, 'right-top');
        this.createSizer(bounds.minX - 0.1, bounds.maxY + 0.1, 'left-top');
        viewer.dataSources.add(this.cornersDataSource);

        viewer.screenSpaceEventHandler.setInputAction((
            movement
        ) => {
            var pickedFeature = viewer.scene.pick(movement.position);
            if (defined(pickedFeature) && this.cornersDataSource.entities.contains(pickedFeature.id)) {
                this.movingSizer = pickedFeature.id;
                this.viewer.scene.screenSpaceCameraController.enableInputs = false;
                return;
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        viewer.screenSpaceEventHandler.setInputAction((
            movement
        ) => {
            if (this.movingSizer) {
                this.viewer.scene.screenSpaceCameraController.enableInputs = true;
                this.movingSizer = null;
            }

        }, ScreenSpaceEventType.LEFT_UP);
    }


    mouseMoved(movement: any) {
        if (this.viewer.scene.pickPositionSupported) {
            if (this.movingSizer && this.viewer.scene.mode === SceneMode.SCENE3D) {
                const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition);
                if (defined(cartesian)) {
                    this.movingSizer.position = new ConstantPositionProperty(cartesian);
                    const moverCartographic = Cartographic.fromCartesian(cartesian);
                    for (let corner of this.cornersDataSource.entities.values) {
                        const sides = this.movingSizer.properties.name.valueOf().split('-');
                        if (corner != this.movingSizer) {
                            const cornerCartographic = Cartographic.fromCartesian(corner.position.getValue(this.viewer.clock.currentTime));
                            if (corner.properties.name.valueOf().indexOf(sides[0]) > -1) {
                                if (sides[0] == 'left' || sides[0] == 'right') {
                                    corner.position = new ConstantPositionProperty(Cartesian3.fromRadians(moverCartographic.longitude, cornerCartographic.latitude, 500));
                                }
                                if (sides[0] == 'top' || sides[0] == 'bottom') {
                                    corner.position = new ConstantPositionProperty(Cartesian3.fromRadians(cornerCartographic.longitude, moverCartographic.latitude, 500));
                                }
                            }
                            if (corner.properties.name.valueOf().indexOf(sides[1]) > -1) {
                                if (sides[1] == 'left' || sides[1] == 'right') {
                                    corner.position = new ConstantPositionProperty(Cartesian3.fromRadians(moverCartographic.longitude, cornerCartographic.latitude, 500));
                                }
                                if (sides[1] == 'top' || sides[1] == 'bottom') {
                                    corner.position = new ConstantPositionProperty(Cartesian3.fromRadians(cornerCartographic.longitude, moverCartographic.latitude, 500));
                                }
                            }
                        }
                    }

                    let bounds = { maxX: Number.MIN_VALUE, minX: Number.MAX_VALUE, maxY: Number.MIN_VALUE, minY: Number.MAX_VALUE };
                    for (let corner of this.cornersDataSource.entities.values) {
                        const cornerCartographic = Cartographic.fromCartesian(corner.position.getValue(this.viewer.clock.currentTime));
                        const latitude = cornerCartographic.latitude;
                        const longitude = cornerCartographic.longitude;
                        if (latitude > bounds.maxY)
                            bounds.maxY = latitude;
                        if (latitude < bounds.minY)
                            bounds.minY = latitude;
                        if (longitude > bounds.maxX)
                            bounds.maxX = longitude;
                        if (longitude < bounds.minX)
                            bounds.minX = longitude;
                    }
                    this.boundsCalculated.next(bounds);
                }
            }
        }
        else {
            console.log('Not supported');
        }
    }

    private createSizer(x, y, name) {
        this.cornersDataSource.entities.add(new Entity({
            position: Cartesian3.fromDegrees(x, y, 500),
            properties: new PropertyBag({ name }),
            ellipsoid: {
                radii: new Cartesian3(3000.0, 3000.0, 3000.0),
                material: Color.fromCssColorString('#0099FF').withAlpha(0.7),
            },
        }));
    }
}