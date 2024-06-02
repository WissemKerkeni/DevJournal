import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';
import {environment} from "@env/environment";

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly socket;

  constructor() {
    this.socket = io(environment.websocket_url);
  }

  onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(eventName, (data: T) => observer.next(data));
    });
  }
}
