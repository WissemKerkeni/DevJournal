import { Notifications } from '@infordevjournal/core/api-types';

export interface NotificationsState {
  notifications: Notifications;
}

export const notificationsInitialState: NotificationsState = {
  notifications: {
    articles: [],
    tags: [],
    likeUnlike: [],
  },
};
