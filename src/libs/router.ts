import { useState, useEffect } from 'react';

export type RouteParams =
  | { name: 'find' }
  | { name: 'my-meetups' }
  | { name: 'chats' }
  | { name: 'create' }
  | { name: 'profile' }
  | { name: 'filter' }
  | { name: 'map'; mode: 'discover' | 'select'; meetupId?: string }
  | { name: 'chat'; meetupId: string }
  | { name: 'meetup-detail'; meetupId: string }
  | { name: 'user-profile'; userId: string };

export const CHILD_ROUTES: RouteParams['name'][] = ['filter', 'map', 'chat', 'meetup-detail', 'user-profile'];

let _route: RouteParams = { name: 'find' };
let _history: RouteParams[] = [];
const listeners = new Set<(route: RouteParams) => void>();

export function currentRoute(): RouteParams {
  return _route;
}

export function parseHash(hash: string): RouteParams {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleanHash || cleanHash === '/' || cleanHash === '/find') {
    return { name: 'find' };
  }
  if (cleanHash === '/my-meetups') {
    return { name: 'my-meetups' };
  }
  if (cleanHash === '/chats') {
    return { name: 'chats' };
  }
  if (cleanHash === '/create') {
    return { name: 'create' };
  }
  if (cleanHash === '/profile') {
    return { name: 'profile' };
  }
  if (cleanHash === '/filter') {
    return { name: 'filter' };
  }
  if (cleanHash === '/map/discover') {
    return { name: 'map', mode: 'discover' };
  }
  if (cleanHash === '/map/select') {
    return { name: 'map', mode: 'select' };
  }

  const parts = cleanHash.split('/');
  if (parts.length >= 3) {
    const routeName = parts[1];
    const subParam = parts[2];
    if (routeName === 'map') {
      const mode = (subParam === 'select' ? 'select' : 'discover') as 'discover' | 'select';
      const meetupId = parts[3];
      return { name: 'map', mode, meetupId };
    }
    if (routeName === 'chat') {
      return { name: 'chat', meetupId: subParam };
    }
    if (routeName === 'meetup-detail') {
      return { name: 'meetup-detail', meetupId: subParam };
    }
    if (routeName === 'user-profile') {
      return { name: 'user-profile', userId: subParam };
    }
  }

  return { name: 'find' };
}

export function buildHash(route: RouteParams): string {
  if (route.name === 'find') return '#/find';
  if (route.name === 'my-meetups') return '#/my-meetups';
  if (route.name === 'chats') return '#/chats';
  if (route.name === 'create') return '#/create';
  if (route.name === 'profile') return '#/profile';
  if (route.name === 'filter') return '#/filter';
  if (route.name === 'map') {
    return route.meetupId ? `#/map/${route.mode}/${route.meetupId}` : `#/map/${route.mode}`;
  }
  if (route.name === 'chat') return `#/chat/${route.meetupId}`;
  if (route.name === 'meetup-detail') return `#/meetup-detail/${route.meetupId}`;
  if (route.name === 'user-profile') return `#/user-profile/${route.userId}`;
  return '#/find';
}

function notifyListeners() {
  listeners.forEach(fn => fn(_route));
}

export function navigate(to: RouteParams) {
  _history.push(_route);
  _route = to;
  window.location.hash = buildHash(to);
  notifyListeners();
}

export function goBack() {
  if (_history.length > 0) {
    const prev = _history.pop()!;
    _route = prev;
    window.location.hash = buildHash(prev);
  } else {
    _route = { name: 'find' };
    window.location.hash = '#/find';
  }
  notifyListeners();
}

export function navigateToTab(tab: 'find' | 'my-meetups' | 'chats' | 'create' | 'profile') {
  _history = [];
  _route = { name: tab };
  window.location.hash = `#/${tab}`;
  notifyListeners();
}

export function isChildRoute(routeName: RouteParams['name']): boolean {
  return CHILD_ROUTES.includes(routeName);
}

export function useRoute(): RouteParams {
  const [route, setRoute] = useState<RouteParams>(_route);

  useEffect(() => {
    const syncRoute = () => {
      const parsed = parseHash(window.location.hash);
      _route = parsed;
      setRoute(parsed);
    };

    syncRoute();

    const handleHashChange = () => {
      syncRoute();
    };

    window.addEventListener('hashchange', handleHashChange);
    listeners.add(setRoute);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      listeners.delete(setRoute);
    };
  }, []);

  return route;
}
