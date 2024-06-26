import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import {
  Articles,
  ArticlesListConfig,
  ArticlesListState,
  articlesListInitialState,
} from './models/articles-list.model';
import { computed, inject } from '@angular/core';
import { ArticlesService } from './services/articles.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, pipe, tap } from 'rxjs';
import { setLoaded, setLoading, withCallState } from '@infordevjournal/core/data-access';
import { tapResponse } from '@ngrx/operators';
import { ActionsService } from './services/actions.service';
import { Article } from '@infordevjournal/core/api-types';
import { NotificationsStore } from '@default/data-access/src';

export const ArticlesListStore = signalStore(
  { providedIn: 'root' },
  withState<ArticlesListState>(articlesListInitialState),
  withComputed(({ listConfig, articles }) => ({
    totalPages: computed(() =>
      Array.from(
        new Array(Math.ceil(articles()?.articlesCount / (listConfig()?.filters?.limit ?? 1))),
        (_, index) => index + 1,
      ),
    ),
  })),
  withMethods(
    (
      store,
      articlesService = inject(ArticlesService),
      actionsService = inject(ActionsService),
      notificationStore = inject(NotificationsStore),
    ) => ({
      loadArticles: rxMethod<ArticlesListConfig>(
        pipe(
          tap(() => setLoading('getArticles')),
          concatMap((listConfig) =>
            articlesService.query(listConfig).pipe(
              tapResponse({
                next: ({ articles, articlesCount }) => {
                  const entities = store.listConfig().loadMore ? [...store.articles().entities, ...articles] : articles;
                  patchState(store, {
                    articles: { articlesCount, entities },
                    ...setLoaded('getArticles'),
                  });
                },
                error: () => {
                  patchState(store, { ...articlesListInitialState, ...setLoaded('getArticles') });
                },
              }),
            ),
          ),
        ),
      ),
      addArticle: rxMethod<Article>(
        pipe(
          concatMap((article) =>
            articlesService.publishArticle(article).pipe(
              tapResponse({
                next: ({ article }) => {
                  patchState(store, {
                    articles: addArticle(store.articles(), article),
                  });
                  notificationStore.addNotification({ article });
                },
                error: (error) => console.error('Error occurred while adding an article: ', error),
              }),
            ),
          ),
        ),
      ),
      favouriteArticle: rxMethod<string>(
        pipe(
          concatMap((slug) =>
            actionsService.favorite(slug).pipe(
              tapResponse({
                next: ({ article }) => {
                  patchState(store, {
                    articles: replaceArticle(store.articles(), article),
                  });
                },
                error: () => {
                  patchState(store, articlesListInitialState);
                },
              }),
            ),
          ),
        ),
      ),
      unFavouriteArticle: rxMethod<string>(
        pipe(
          concatMap((slug) =>
            actionsService.unfavorite(slug).pipe(
              tapResponse({
                next: ({ article }) => {
                  patchState(store, {
                    articles: replaceArticle(store.articles(), article),
                  });
                },
                error: () => {
                  patchState(store, articlesListInitialState);
                },
              }),
            ),
          ),
        ),
      ),
      updateArticle: (article: Article) => {
        patchState(store, { articles: replaceArticle(store.articles(), article) });
        notificationStore.addNotification({ likeUnlike: article });
      },
      setListConfig: (listConfig: ArticlesListConfig) => {
        patchState(store, { listConfig });
      },
      setListPage: (page: number) => {
        const filters = {
          ...store.listConfig.filters(),
          offset: (store.listConfig().filters.limit ?? 10) * (page - 1),
        };
        const listConfig: ArticlesListConfig = {
          ...store.listConfig(),
          currentPage: page,
          loadMore: page > 1,
          filters,
        };
        patchState(store, { listConfig });
      },
    }),
  ),
  withCallState({ collection: 'getArticles' }),
);

function replaceArticle(articles: Articles, payload: Article): Articles {
  const articleIndex = articles.entities.findIndex((a) => a.slug === payload.slug);
  const entities = [
    ...articles.entities.slice(0, articleIndex),
    Object.assign({}, articles.entities[articleIndex], payload),
    ...articles.entities.slice(articleIndex + 1),
  ];
  return { ...articles, entities };
}

function addArticle(articles: Articles, newArticle: Article) {
  articles.entities.unshift(newArticle);
  return { articlesCount: articles.entities.length, entities: articles.entities };
}
