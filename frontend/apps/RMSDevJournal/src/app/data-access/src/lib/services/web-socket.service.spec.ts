import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { WebSocketService } from './web-socket.service';

describe('WebSocketService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WebSocketService],
    });
  });

  it('should be created', inject([WebSocketService], (service: WebSocketService) => {
    expect(service).toBeTruthy();
  }));
});
