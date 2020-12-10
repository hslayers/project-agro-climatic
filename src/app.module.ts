import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {HsCesiumModule} from 'hslayers-cesium';
import {HslayersModule} from 'hslayers-ng';
import {AcAboutModule} from './about/about.module';
import { MainService } from 'main.service';
import { AcVisualizer } from 'ac-visualizer';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HslayersModule, HsCesiumModule, AcAboutModule],
  providers: [MainService, AcVisualizer],
  bootstrap: [AppComponent],
})
export class AppModule {}
