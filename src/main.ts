import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_setTimeout = true;
import 'zone.js';
import * as angular from 'angular';
import {AppModule} from './app.module';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {setAngularJSGlobal} from '@angular/upgrade/static';

setAngularJSGlobal(angular);
platformBrowserDynamic().bootstrapModule(AppModule);
