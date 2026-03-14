

## Problem

Race condition in `useAuth.tsx`: `loading` is set to `false` in the `.finally()` block of `getSession()`, but `resolveRoles()` runs asynchronously and hasn't finished yet. This means:

1. User logs in → redirected to `/education/admin`
2. `EduProtectedRoute` checks `loading` → it's `false`
3. `isAdmin` is still `null` (roles not resolved yet) → treated as falsy
4. Route either redirects back to `/login` or renders blank content
5. Roles finally resolve → Login redirects to `/education/admin` again → loop or blank page

## Fix

**`src/hooks/useAuth.tsx`**: Keep `loading` as `true` until `resolveRoles()` completes. Change `resolveRoles` to explicitly set `loading = false` at the end, and remove the `.finally(() => setLoading(false))` from `getSession()`. For the `onAuthStateChange` listener, set `loading = true` before resolving roles and `false` after.

**`src/pages/Login.tsx`**: Simplify the redirect condition — only redirect when `loading` is `false` (which now guarantees roles are resolved).

This is a 2-file fix, no database changes needed.

