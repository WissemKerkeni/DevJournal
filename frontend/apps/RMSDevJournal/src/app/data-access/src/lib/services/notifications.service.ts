import { inject, Injectable } from '@angular/core';
import { ApiService } from '@infordevjournal/core/http-client';
import { Observable } from 'rxjs';
import {
  NotificationRequest,
  NotificationResponse,
  Notifications,
} from '@infordevjournal/core/api-types';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly apiService = inject(ApiService);

  getNotifications(): Observable<{ notifications :Notifications }> {
    return this.apiService.get<{ notifications :Notifications }>('/notifications');
  }

  addNotification(data: NotificationRequest): Observable<NotificationResponse> {
    return this.apiService.post<NotificationResponse, NotificationRequest>(`/notifications`, data);
  }

}
