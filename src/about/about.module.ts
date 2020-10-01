import {CommonModule} from '@angular/common';
import {AcAboutComponent as AcAboutComponent} from './about.component';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [AcAboutComponent],
  imports: [CommonModule],
  entryComponents: [AcAboutComponent],
  providers: [],
  exports: [AcAboutComponent],
})
export class AcAboutModule {}
