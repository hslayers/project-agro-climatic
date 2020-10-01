
import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from 'hslayers-ng/components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from 'hslayers-ng/components/layout/dialogs/dialog-container.service';
import {HsDialogItem} from 'hslayers-ng/components/layout/dialogs/dialog-item';
@Component({
  selector: 'ac-about',
  template: require('./about.html'),
})
export class AcAboutComponent implements HsDialogComponent {

    dialogItem: HsDialogItem;
    constructor(private HsDialogContainerService: HsDialogContainerService) {}
    viewRef: ViewRef;
    data: any;
  
    dismiss(): void {
      this.HsDialogContainerService.destroy(this);
    }
}
