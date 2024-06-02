import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Notifications, User } from '@infordevjournal/core/api-types';

@Component({
  selector: 'cdt-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  user = input.required<User>();
  isLoggedIn = input.required<boolean>()
  notifications = input.required<Notifications>();


  isNotificationsOpen = false;

  toggleNotifications() {
    const element = document.getElementById('notifList');
    if (element) {
      element.style.display = this.isNotificationsOpen ? 'none' : 'block';
      this.isNotificationsOpen = !this.isNotificationsOpen;
    }
  }
}
