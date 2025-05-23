import { Component, inject, OnInit, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Location } from '@angular/common';
import { LogoComponent, NavigationItem } from '@elementar-ui/components';
import { v7 as uuid } from 'uuid';
import {
  SidebarBodyComponent,
  SidebarCompactViewModeDirective,
  SidebarComponent as EmrSidebarComponent,
  SidebarFooterComponent,
  SidebarFullViewModeDirective,
  SidebarHeaderComponent,
  SidebarNavComponent
} from '@elementar-ui/components';
import { DicebearComponent } from '@elementar-ui/components';
import { MatIconButton } from '@angular/material/button';
import { ToolbarComponent } from '@store/sidebar';

@Component({
  selector: 'app-sidebar',
  imports: [
    MatIcon,
    RouterLink,
    ToolbarComponent,
    SidebarBodyComponent,
    SidebarCompactViewModeDirective,
    SidebarFullViewModeDirective,
    EmrSidebarComponent,
    SidebarFooterComponent,
    SidebarHeaderComponent,
    SidebarNavComponent,
    DicebearComponent,
    MatIconButton,
    LogoComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    'class': 'sidebar',
    '[class.compact]': 'compact'
  }
})
export class SidebarComponent implements OnInit {
  router = inject(Router);
  location = inject(Location);
  height: string | null = '200px';
  compact = false;

  readonly navigation = viewChild.required<any>('navigation');

  navItems: NavigationItem[] = [
    {
      key: 'dashboard',
      type: 'group',
      name: 'Dashboard',
      icon: 'dashboard',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Basic',
          link: '/pages/dashboard/basic'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Map',
          link: '/pages/dashboard/map'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Book Journey',
          link: '/pages/dashboard/book-journey'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Book with Map',
          link: '/pages/dashboard/book-with-map'
        }
        ,
        {
          key: uuid(),
          type: 'link',
          name: 'User Journeys',
          link: '/pages/dashboard/user-journeys'
        }
      ]
    },
    {
      key: 'user',
      type: 'group',
      name: 'User',
      icon: 'person',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Profile',
          link: '/pages/user/profile'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Purchase History',
          link: '/pages/dashboard/purchase-history'
        }
      ]
    },
    {
      key: 'ticket',
      type: 'group',
      name: 'Ticket',
      icon: 'confirmation_number',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Purchase Ticket',
          link: '/pages/ticket/purchase-ticket'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Purchase History',
          link: '/pages/ticket/purchase-history'
        }
      ]
    }
  ];
  navItemLinks: NavigationItem[] = [];
  activeKey: null | string = null;

  ngOnInit() {
    this.navItems.forEach(navItem => {
      this.navItemLinks.push(navItem);

      if (navItem.children) {
        this.navItemLinks = this.navItemLinks.concat(navItem.children as NavigationItem[]);
      }
    });
    this._activateLink();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this._activateLink();
      })
    ;
  }

  private _activateLink() {
    const activeLink = this.navItemLinks.find(
      navItem => {
        if (navItem.link === this.location.path()) {
          return true;
        }

        if (navItem.type === 'group') {
          return (this.location.path() !== '/' && this.location.path().includes(navItem.link as string));
        }

        return false;
      }
    );

    if (activeLink) {
      this.activeKey = activeLink.key;
    } else {
      this.activeKey = null;
    }
  }
}
