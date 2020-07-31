import { Injectable } from '@angular/core';
import Color from 'cesium/Source/Core/Color';
import Entity from 'cesium/Source/DataSources/Entity';
import { ScreenSpaceEventType, PostProcessStageLibrary, defined, Viewer, Property, ConstantProperty, DataSource } from 'cesium';
@Injectable({
    providedIn: 'root',
})
export class AcFeaturePicker {
    // Information about the currently selected feature
    selected = {
        feature: undefined,
        originalColor: new Color(),
    };
    // An entity object which will hold info about the currently selected feature for infobox display
    selectedEntity = new Entity();
    clickHandler: any;
    silhouetteBlue: import("cesium").PostProcessStageComposite;
    silhouetteGreen: any;
    nameOverlay: HTMLDivElement;
    viewer: Viewer;
    barsDataSource: DataSource;

    createOverlay(viewer: Viewer) {
        const nameOverlay = document.createElement("div");
        this.nameOverlay = nameOverlay;
        viewer.container.appendChild(nameOverlay);
        nameOverlay.className = "backdrop";
        nameOverlay.style.display = "none";
        nameOverlay.style.position = "absolute";
        nameOverlay.style.bottom = "0";
        nameOverlay.style.left = "0";
        nameOverlay.style["pointer-events"] = "none";
        nameOverlay.style.padding = "4px";
        nameOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        nameOverlay.style.color = "white";

    }

    init(viewer: Viewer, barsDataSource: DataSource) {
        this.viewer = viewer;
        this.barsDataSource = barsDataSource;
        this.createOverlay(viewer);
        // Get default left click handler for when a feature is not picked on left click
        this.clickHandler = viewer.screenSpaceEventHandler.getInputAction(
            ScreenSpaceEventType.LEFT_CLICK
        );

        // If silhouettes are supported, silhouette features in blue on mouse over and silhouette green on mouse click.
        // If silhouettes are not supported, change the feature color to yellow on mouse over and green on mouse click.
        if (
            PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)
        ) {
            // Silhouettes are supported
            this.silhouetteBlue = PostProcessStageLibrary.createEdgeDetectionStage();
            this.silhouetteBlue.uniforms.color = Color.BLUE;
            this.silhouetteBlue.uniforms.length = 0.01;
            this.silhouetteBlue.selected = [];

            this.silhouetteGreen = PostProcessStageLibrary.createEdgeDetectionStage();
            this.silhouetteGreen.uniforms.color = Color.LIME;
            this.silhouetteGreen.uniforms.length = 0.01;
            this.silhouetteGreen.selected = [];

            viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createSilhouetteStage([
                    this.silhouetteBlue,
                    this.silhouetteGreen,
                ])
            );

            // Silhouette a feature on selection and show metadata in the InfoBox.
            viewer.screenSpaceEventHandler.setInputAction((
                movement
            ) => {
                // If a feature was previously selected, undo the highlight
                this.silhouetteGreen.selected = [];

                // Pick a new feature
                var pickedFeature = viewer.scene.pick(movement.position);
                if (!defined(pickedFeature)) {
                    this.clickHandler(movement);
                    return;
                }
                pickedFeature = pickedFeature.id;
                // Select the feature if it's not already selected
                if (this.silhouetteGreen.selected[0] === pickedFeature) {
                    return;
                }

                // Save the selected feature's original color
                var highlightedFeature = this.silhouetteBlue.selected[0];
                if (pickedFeature === highlightedFeature) {
                    this.silhouetteBlue.selected = [];
                }

                // Highlight newly selected feature
                this.silhouetteGreen.selected = [pickedFeature];

                // Set feature infobox description
                var featureName = pickedFeature.properties.crop.valueOf();
                this.selectedEntity.name = featureName;
                this.selectedEntity.description = new ConstantProperty(
                    'Loading <div class="cesium-infoBox-loading"></div>');
                viewer.selectedEntity = this.selectedEntity;
                this.selectedEntity.description = new ConstantProperty(
                    `<table class="cesium-infoBox-defaultTable"><tbody>
                    <tr><th>Kind</th><td>
                    ${pickedFeature.properties.kind.valueOf()}
                    </td></tr>
                    <tr><th>Year</th><td>
                    ${pickedFeature.properties.crop.valueOf()}
                    </td></tr>
                    <tr><th>Year</th><td>
                    ${pickedFeature.properties.year.valueOf()}
                    </td></tr>
                    <tr><th>Value</th><td>
                    ${pickedFeature.properties.height.valueOf()}
                    </td></tr>
                    </tbody></table>`);
            },
                ScreenSpaceEventType.LEFT_CLICK);
        } else {
            // Silhouettes are not supported. Instead, change the feature color.

            // Information about the currently highlighted feature
            var highlighted = {
                feature: undefined,
                originalColor: new Color(),
            };

            // Color a feature yellow on hover.
            viewer.screenSpaceEventHandler.setInputAction((
                movement
            ) => {
                // If a feature was previously highlighted, undo the highlight
                if (defined(highlighted.feature)) {
                    highlighted.feature.color = highlighted.originalColor;
                    highlighted.feature = undefined;
                }
                // Pick a new feature
                var pickedFeature = viewer.scene.pick(movement.endPosition);
                if (!defined(pickedFeature)) {
                    this.nameOverlay.style.display = "none";
                    return;
                }
                // A feature was picked, so show it's overlay content
                this.nameOverlay.style.display = "block";
                this.nameOverlay.style.bottom =
                    viewer.canvas.clientHeight - movement.endPosition.y + "px";
                this.nameOverlay.style.left = movement.endPosition.x + "px";
                var name = pickedFeature.properties.name.valueOf();
                if (!defined(name)) {
                    name = pickedFeature.properties.id.valueOf();
                }
                this.nameOverlay.textContent = name;
                // Highlight the feature if it's not already selected.
                if (pickedFeature !== this.selected.feature) {
                    highlighted.feature = pickedFeature;
                    Color.clone(
                        pickedFeature.color,
                        highlighted.originalColor
                    );
                    pickedFeature.color = Color.YELLOW;
                }
            },
                ScreenSpaceEventType.MOUSE_MOVE);

            // Color a feature on selection and show metadata in the InfoBox.
            viewer.screenSpaceEventHandler.setInputAction((
                movement
            ) => {
                // If a feature was previously selected, undo the highlight
                if (defined(this.selected.feature)) {
                    this.selected.feature.color = this.selected.originalColor;
                    this.selected.feature = undefined;
                }
                // Pick a new feature
                var pickedFeature = viewer.scene.pick(movement.position);
                if (!defined(pickedFeature)) {
                    this.clickHandler(movement);
                    return;
                }
                // Select the feature if it's not already selected
                if (this.selected.feature === pickedFeature) {
                    return;
                }
                this.selected.feature = pickedFeature;
                // Save the selected feature's original color
                if (pickedFeature === highlighted.feature) {
                    Color.clone(
                        highlighted.originalColor,
                        this.selected.originalColor
                    );
                    highlighted.feature = undefined;
                } else {
                    Color.clone(pickedFeature.color, this.selected.originalColor);
                }
                // Highlight newly selected feature
                pickedFeature.color = Color.LIME;
                // Set feature infobox description
                var featureName = pickedFeature.properties.crop.valueOf();
                this.selectedEntity.name = featureName;
                this.selectedEntity.description = new ConstantProperty(
                    'Loading <div class="cesium-infoBox-loading"></div>');
                viewer.selectedEntity = this.selectedEntity;
                this.selectedEntity.description =
                    new ConstantProperty(`<table class="cesium-infoBox-defaultTable"><tbody>
                        <tr><th>Kind</th><td>
                        ${pickedFeature.properties.kind.valueOf()}
                        </td></tr>
                        <tr><th>Crop</th><td>
                        ${pickedFeature.properties.crop.valueOf()}
                        </td></tr>
                        <tr><th>Year</th><td>
                        ${pickedFeature.properties.year.valueOf()}
                        </td></tr>
                        <tr><th>Longitude</th><td>
                        ${pickedFeature.properties.longitude.valueOf()}
                        </td></tr>
                        <tr><th>Latitude</th><td>
                        ${pickedFeature.properties.latitude.valueOf()}
                        </td></tr>
                        <tr><th>Value</th><td>
                        ${pickedFeature.properties.height.valueOf()}
                        </td></tr>
                        </tbody></table>`);
            },
                ScreenSpaceEventType.LEFT_CLICK);
        }
    }

    mouseMoved(movement){
        // If a feature was previously highlighted, undo the highlight
        this.silhouetteBlue.selected = [];

        // Pick a new feature
        var pickedFeature = this.viewer.scene.pick(movement.endPosition);
        if (!defined(pickedFeature) || !this.barsDataSource.entities.contains(pickedFeature.id)) {
            this.nameOverlay.style.display = "none";
            return;
        }
        pickedFeature = pickedFeature.id;

        // A feature was picked, so show it's overlay content
        this.nameOverlay.style.display = "block";
        this.nameOverlay.style.bottom =
        this.viewer.canvas.clientHeight - movement.endPosition.y + "px";
        this.nameOverlay.style.left = movement.endPosition.x + "px";
        var name = `${pickedFeature.properties.kind.valueOf()} ${pickedFeature.properties.crop.valueOf()} ${pickedFeature.properties.height.valueOf()}`;
        this.nameOverlay.textContent = name;

        // Highlight the feature if it's not already selected.
        if (pickedFeature !== this.selected.feature) {
            this.silhouetteBlue.selected = [pickedFeature];
        }
    }

}
