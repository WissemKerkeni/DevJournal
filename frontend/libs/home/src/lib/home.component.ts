import { Component, ChangeDetectionStrategy, inject, effect, untracked } from '@angular/core';
import { ArticlesListStore, ListType, articlesListInitialState } from '@infordevjournal/articles/data-access';
import { AsyncPipe, NgClass } from '@angular/common';
import { TagsListComponent } from './tags-list/tags-list.component';
import { ArticleListComponent } from '@infordevjournal/articles/feature-articles-list/src';
import { HomeStoreService } from './home.store';
import { AuthStore } from '@infordevjournal/auth/data-access';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'cdt-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, TagsListComponent, ArticleListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly articlesListStore = inject(ArticlesListStore);
  private readonly authStore = inject(AuthStore);
  private readonly homeStore = inject(HomeStoreService);

  $listConfig = this.articlesListStore.listConfig;
  tags$ = this.homeStore.tags$;

  searchControl = new FormControl('');

  constructor() {
    this.articlesListStore.loadArticles(this.$listConfig());
    this.homeStore.loadTags();
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((searchText) =>
        this.articlesListStore.setListConfig({
          ...articlesListInitialState.listConfig,
          filters: {
            ...articlesListInitialState.listConfig.filters,
            title: searchText ?? undefined,
          }
        }),
      );
  }

  readonly loadArticlesOnLogin = effect(() => {
    const isLoggedIn = this.authStore.loggedIn();
    untracked(() => this.getArticles(isLoggedIn));
  });

  readonly loadArticlesOnListConfigChanged = effect(() => {
    const isLoggedIn = untracked(() => this.authStore.loggedIn());
    if (!isLoggedIn) {
      return;
    }
    const config = this.$listConfig();
    this.articlesListStore.loadArticles(config);
  });

  setListTo(type: ListType = 'ALL') {
    const config = { ...articlesListInitialState.listConfig, type };
    this.articlesListStore.setListConfig(config);
  }

  getArticles(isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.setListTo('FEED');
    } else {
      this.setListTo('ALL');
    }
  }

  setListTag(tag: string) {
    this.articlesListStore.setListConfig({
      ...articlesListInitialState.listConfig,
      filters: {
        ...articlesListInitialState.listConfig.filters,
        title: '',
        tag,
      },
    });
  }
}
