import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes: everything is public; admin pages can be visited directly
const isPublicRoute = createRouteMatcher([
  '/',
  '/poems(.*)',
  '/about',
  '/sign-in(.*)',
  // '/sign-up(.*)', // disabled signup
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
};


