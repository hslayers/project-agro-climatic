
import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from 'hslayers-ng';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsDialogItem} from 'hslayers-ng';
@Component({
  selector: 'ac-about',
  templateUrl: './about.html',
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
