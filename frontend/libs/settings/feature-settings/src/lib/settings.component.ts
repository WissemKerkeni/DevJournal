import {
  DynamicFormComponent,
  Field,
  formsActions,
  ListErrorsComponent,
  ngrxFormsQuery,
} from '@infordevjournal/core/forms';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, untracked } from '@angular/core';
import { Validators } from '@angular/forms';
import { AuthStore } from '@infordevjournal/auth/data-access';
import { SettingsStoreService } from './settings.store';
import { Store } from '@ngrx/store';
import { ThemeService } from '@default/data-access/src';


@Component({
  standalone: true,
  selector: 'cdt-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [DynamicFormComponent, ListErrorsComponent],
  providers: [SettingsStoreService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly authStore = inject(AuthStore);
  private readonly themeService = inject(ThemeService);

  structure$ = this.store.select(ngrxFormsQuery.selectStructure);
  data$ = this.store.select(ngrxFormsQuery.selectData);
  $theme = this.themeService.theme;

  readonly fillInForm = effect(() => {
    const isLoggedIn = this.authStore.loggedIn();
    if (isLoggedIn) {
      untracked(() => this.store.dispatch(formsActions.setData({ data: this.authStore.user() })));
    }
  });

  ngOnInit() {
  }

  switchTheme() {
    console.log("switchTheme");
    this.themeService.switchTheme();
  }

  logout() {
    this.authStore.logout();
  }
}
