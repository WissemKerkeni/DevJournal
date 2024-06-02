import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { concatMap, pipe } from 'rxjs';
import { notificationsInitialState, NotificationsState } from '@default/data-access/src/lib/models/notification.model';
import { NotificationsService } from '@default/data-access/src/lib/services/notifications.service';
import { NotificationRequest, Notifications } from '@infordevjournal/core/api-types';

export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationsState>(notificationsInitialState),
  withMethods((store, notificationsService = inject(NotificationsService)) => ({
    loadNotifications: rxMethod<void>(
      pipe(
        concatMap(() =>
          notificationsService.getNotifications().pipe(
            tapResponse({
              next: ({ notifications }) =>
                patchState(store, { notifications }),
              error: (error) => console.error('Error occurred while loading notifications: ', error),
            }),
          ),
        ),
      ),
    ),

    addNotification: rxMethod<NotificationRequest>(
      pipe(
        concatMap((notificationRequest) =>
          notificationsService.addNotification(notificationRequest).pipe(
            tapResponse({
              next: ({ notification }) =>
                patchState(store, {
                  notifications: addNotification(store.notifications(), notification),
                }),
              error: (error) => console.error('Error occurred while adding a notification: ', error),
            }),
          ),
        ),
      ),
    ),
  })),
);

function addNotification(notifications: Notifications, newNotification: NotificationRequest) {
  if (newNotification.article) {
    notifications.articles.push(newNotification.article);
  }
  if (newNotification.tag) {
    notifications.tags.push(newNotification.tag);
  }
  if (newNotification.likeUnlike) {
    notifications.likeUnlike.push(newNotification.likeUnlike);
  }
  return { ...notifications };
}
