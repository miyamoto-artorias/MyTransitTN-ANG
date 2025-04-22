import { Component } from '@angular/core';
import { Notification, NotificationDefDirective, NotificationListComponent } from '@elementar-ui/components';

import { RouterLink } from '@angular/router';
import { MatAnchor, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { PopoverComponent } from '@elementar-ui/components';


@Component({
  selector: 'emr-notifications-popover',
  standalone: true,
  imports: [
    PopoverComponent,
    NotificationDefDirective,
    NotificationListComponent,
    RouterLink,
    MatAnchor,
    MatIcon,
    MatIconButton,
    MatRipple
  ],
  templateUrl: './notifications-popover.component.html',
  styleUrl: './notifications-popover.component.scss'
})
export class NotificationsPopoverComponent {
  notifications: Notification[] = [
    {
      actor: {
        id: 1,
        name: 'Train Station',
        username: 'system',
        avatarUrl: 'assets/train.png'
      },
      notifier: 'System',
      type: 'trainArrived',
      payload: {
        trainNumber: 'ICE 789',
        platform: '5B'
      },
      createdAt: '2 mins ago'
    },
    {
      actor: {
        id: 2,
        name: 'Train Assistant',
        username: 'assistant.bot',
        avatarUrl: 'assets/train.png'
      },
      notifier: 'Assistant Bot',
      type: 'destinationReached',
      payload: {
        destination: 'Berlin Central',
        trainNumber: 'ICE 123'
      },
      createdAt: '10 mins ago'
    },
    {
      actor: {
        id: 3,
        name: 'System Alert',
        username: 'system',
        avatarUrl: 'assets/train.png'
      },
      notifier: 'System',
      type: 'trainCancelled',
      payload: {
        trainNumber: 'ICE 456',
        reason: 'Weather conditions'
      },
      createdAt: '30 mins ago'
    },
    {
      actor: {
        id: 4,
        name: 'Booking System',
        username: 'booking.bot',
        avatarUrl: 'assets/train.png'
      },
      notifier: 'Booking Bot',
      type: 'ticketReserved',
      payload: {
        seat: '12A',
        coach: 'B',
        trainNumber: 'ICE 321'
      },
      createdAt: '1 hour ago'
    }
  ];


}
