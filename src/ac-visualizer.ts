import * as Cesium from 'cesium/Source/Cesium.js';
export class AcVisualizer {
    barOffsets: any = {};
    constructor(private viewer: any) {

        const LGPC3 = require('./annual_LGP_C3_1982-2019.json');
        const LGPC4 = require('./annual_LGP_C4_1982-2019.json');
        viewer.clock.multiplier = 10000000;
        viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(1982, 1, 1));
        viewer.timeline.zoomTo(Cesium.JulianDate.fromDate(new Date(1982, 1, 1)), Cesium.JulianDate.fromDate(new Date(2019, 1, 1)))
        for (let year = 1982; year < 2019; year++) {
            const showProperty = new Cesium.CallbackProperty(function (time, result) {
                return Cesium.JulianDate.compare(Cesium.JulianDate.fromDate(new Date(year, 1, 1)), time) <= 0 &&
                    Cesium.JulianDate.compare(Cesium.JulianDate.fromDate(new Date(year + 1, 1, 1)), time) > 0
            }, false);

            for (const feature of LGPC3.features) {
                this.createBar(feature, 0, 0, year, showProperty)

            }

            for (const feature of LGPC4.features) {
                this.createBar(feature, 0.36, 1, year, showProperty)
            }
        }
    }

    createBar(feature, hue, stackOffset, year, showProperty) {
        const heightScale = 100;
        var latitude = feature.geometry.coordinates[1];
        var longitude = feature.geometry.coordinates[0];
        var height = feature.properties['LGP' + year];

        let offset = 0;
        if (stackOffset > 0) {
            offset = this.barOffsets[`${stackOffset - 1} ${longitude} ${latitude}`];
        }
        var surfacePosition = Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
            offset + height * heightScale / 2
        );
        this.barOffsets[`${stackOffset} ${longitude} ${latitude}`] = offset + height * heightScale;

        //The polyline instance itself needs to be on an entity.
        var entity = new Cesium.Entity({
            position: surfacePosition,
            box: {
                show: showProperty,
                dimensions: new Cesium.Cartesian3(3000.0, 3000.0, height * heightScale),
                material: Cesium.Color.fromHsl(hue, 0.65, 0.48),
                outline: true,
                outlineColor: Cesium.Color.fromHsl(hue, 0.8, 0.3),
            },
        });

        //Add the entity to the collection.
        this.viewer.entities.add(entity);
    }
}