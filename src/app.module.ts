import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
import 'zone.js';
import app from './app-js';
import {APP_BOOTSTRAP_LISTENER} from '@angular/core';
import {ApplicationRef, ComponentRef, NgModule} from '@angular/core';
import {BootstrapComponent} from 'hslayers-ng/bootstrap.component';
import {BrowserModule} from '@angular/platform-browser';
import {HsCoreModule} from 'hslayers-ng/components/core/core.module';
import {UpgradeModule} from '@angular/upgrade/static';
import { HsCesiumModule } from 'hslayers-ng/components/hscesium/hscesium.module';
import { AcVisualizer } from './ac-visualizer';

@NgModule({
  imports: [BrowserModule, UpgradeModule, HsCoreModule, HsCesiumModule],
  declarations: [],
  entryComponents: [],
  providers: [
    AcVisualizer,
    {
      provide: APP_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: () => {
        return (component: ComponentRef<BootstrapComponent>) => {
          //When ng9 part is bootstrapped continue with AngularJs modules
          if(component.instance.upgrade) component.instance.upgrade.bootstrap(
            document.documentElement,
            [app.name],
            {strictDi: true}
          );
        };
      },
    },
  ],
})
export class AppModule {
  constructor() {}
  ngDoBootstrap(appRef: ApplicationRef) {
    //First bootstrap Angular 9 app part on hs element
    appRef.bootstrap(BootstrapComponent);
  }
}
