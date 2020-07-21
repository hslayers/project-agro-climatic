import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import JulianDate from 'cesium/Source/Core/JulianDate';
import TimeInterval from 'cesium/Source/Core/TimeInterval';
import TimeIntervalCollection from 'cesium/Source/Core/TimeIntervalCollection';
import Entity from 'cesium/Source/DataSources/Entity';
import Color from 'cesium/Source/Core/Color';

export class AcVisualizer {
    barOffsets: any = {};
    constructor(private viewer: any) {

        const LGPC3 = require('./annual_LGP_C3_1982-2019.json');
        const LGPC4 = require('./annual_LGP_C4_1982-2019.json');
        const LOGPC3 = require('./annual_LOGP_C3_1982-2019.json');
        const LOGPC4 = require('./annual_LOGP_C4_1982-2019.json');
        viewer.clock.multiplier = 10000000;
        viewer.clock.currentTime = JulianDate.fromDate(new Date(1982, 1, 1));
        viewer.timeline.zoomTo(JulianDate.fromDate(new Date(1982, 1, 1)), JulianDate.fromDate(new Date(2019, 1, 1)))
        for (let year = 1982; year < 2019; year++) {
            const availability = new TimeIntervalCollection([
                new TimeInterval({
                    start: JulianDate.fromDate(new Date(year, 1, 1)),
                    stop: JulianDate.fromDate(new Date(year + 1, 1, 1))
                })
            ]);

            for (const feature of LGPC3.features) {
                this.createBar(feature, 0, 0, year, availability, 3000.0, 1, 'C4')
            }

            for (const feature of LGPC4.features) {
                this.createBar(feature, 0.36, 1, year, availability, 3000.0, 1, 'C3')
            }

            for (const feature of LOGPC3.features) {
                this.createBar(feature, 0, 0, year, availability, 5000.0, 0.5, 'C3')
            }

            for (const feature of LOGPC4.features) {
                this.createBar(feature, 0.36, 1, year, availability, 5000.0, 0.5, 'C4')
            }
        }
    }

    createBar(feature, hue, stackOffset, year, showProperty, width, alpha, crop) {
        const heightScale = 100;
        var latitude = feature.geometry.coordinates[1];
        var longitude = feature.geometry.coordinates[0];
        var height = feature.properties['LGP' + year];

        let offset = 0;
        if (stackOffset > 0) {
            offset = this.barOffsets[`${stackOffset - 1} ${longitude} ${latitude}`];
        }
        var surfacePosition = Cartesian3.fromDegrees(
            longitude,
            latitude,
            offset + height * heightScale / 2
        );
        this.barOffsets[`${stackOffset} ${longitude} ${latitude}`] = offset + height * heightScale;

        //The polyline instance itself needs to be on an entity.
        var entity = new Entity({
            position: surfacePosition,
            availability: showProperty,
            box: {
                dimensions: new Cartesian3(width, width, height * heightScale),
                material: Color.fromHsl(hue, 0.65, 0.48).withAlpha(alpha),
                outline: true,
                outlineColor: Color.fromHsl(hue, 0.8, 0.3).withAlpha(alpha),
            },
        });

        //Add the entity to the collection.
        this.viewer.entities.add(entity);
    }
}