import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { pipe } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { concatMap, switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { HomeService } from './home.service';
import { NotificationsStore } from '@default/data-access/src';

export interface HomeState {
  tags: string[];
  isLoading: boolean;
}

@Injectable({ providedIn: 'root' })
export class HomeStoreService extends ComponentStore<HomeState> {
  private readonly notificationsStore = inject(NotificationsStore);

  constructor(private readonly homeService: HomeService) {
    super({ tags: [], isLoading: true });
  }

  // SELECTORS
  tags$ = this.select((store) => store.tags);
  isLoading$ = this.select((store) => store.isLoading);

  // EFFECTS
  readonly loadTags = this.effect<void>(
    pipe(
      switchMap(() =>
        this.homeService.getTags().pipe(
          tap(() => this.patchState({ isLoading: false })),
          tapResponse({
            next: (response) => this.patchState({ tags: response.tags }),
            error: (error) => console.error('Error occurred while loading tags: ', error),
            finalize: () => this.patchState({ isLoading: false }),
          }),
        ),
      ),
    ),
  );

  addTag = this.effect<string>(
    pipe(
      withLatestFrom(this.tags$),
      concatMap(([newTag, tags_]) =>
        this.homeService.addTag(newTag).pipe(
          tapResponse({
            next: () => {
              this.patchState({ tags: [...tags_, newTag] });
              this.notificationsStore.addNotification({ tag: newTag });
            },
            error: (error) => console.error('Error occurred while adding a tag: ', error),
          }),
        ),
      ),
    ),
  );
}
