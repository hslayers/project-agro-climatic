import {Component, ComponentFactoryResolver} from '@angular/core';
import { AcAboutComponent } from 'about/about.component';
import {HsConfig, HsDialogContainerService} from 'hslayers-ng';
import { MainService } from 'main.service';

@Component({
  selector: 'hs-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent {
  constructor(
    public HsConfig: HsConfig,
    private mainService: MainService,
    private hsDialogContainerService: HsDialogContainerService
  ) {
  }
  title = 'Agroclimatic zones visualizer';

  ngOnInit(): void {
   this.mainService.init();
   this.hsDialogContainerService.create(
    AcAboutComponent,
    {
      message: 'You do not have access rights to see this model! Please contact the Admin or owner of the model to get access rights!',
      title: 'Access denied!',
    }
  );
  }
}
