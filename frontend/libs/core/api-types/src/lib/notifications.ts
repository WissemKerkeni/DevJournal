import { Article } from '@infordevjournal/core/api-types';

export interface Notifications {
  articles: Article[];
  tags: string[];
  likeUnlike: Partial<Article>[];
}

export interface NotificationRequest {
  article?: Article;
  tag?: string;
  likeUnlike?: Partial<Article>;
}

export interface NotificationResponse {
  notification: NotificationRequest;
}
