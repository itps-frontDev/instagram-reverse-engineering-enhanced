# Profile Followers Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Profile followers read flow (Spring endpoint + frontend feature integration + migration artifacts)

## 1. Objective

Migrate followers retrieval from legacy Next API routes to one Spring private endpoint:
`GET /api/priv/profiles/{username}/followers`.

### Expected outcome
1. Backend exposes one followers endpoint with privacy-aware access checks and item-level follow status.
2. Frontend followers modal consumes profile feature action that calls Spring directly.
3. Legacy followers API routes in Next are removed from active architecture.
4. Postman and route migration report are updated.

## 2. Scope Boundaries

### In scope
1. Profile controller/service/repository changes needed for followers read.
2. DTOs/exceptions for followers response and forbidden access.
3. Frontend profile feature action + FollowersModal integration.
4. Postman request and `reports/api_routes.csv` updates.

### Out of scope
1. Following endpoint migration.
2. Follow mutation flows (follow/unfollow/accept/reject).
3. Pagination redesign for follower lists.

## 3. Endpoint Contract

| Field | Value |
|---|---|
| Method | `GET` |
| Path | `/api/priv/profiles/{username}/followers` |
| Auth | Required (`JwtAuthenticationFilter` + `SecurityContext`) |
| Controller | `ProfileController` |
| Service | `ProfileReadService#getFollowers` |

### Success response
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "username": "johnsmith",
      "fullName": "John Smith",
      "profileImageUrl": "https://cdn.example/avatar.jpg",
      "followStatus": "accepted"
    }
  ],
  "error": null,
  "message": "Followers fetched successfully"
}
```

`followStatus` values: `accepted` | `pending` | `none` (never `self` in followers list).

## 4. Privacy and Access Rules

| Scenario | Result |
|---|---|
| Target profile not found or soft-deleted | 404 |
| `isOwner = true` | Full followers list, no privacy block |
| Target profile public | Full followers list |
| Target profile private + viewer follows target with `accepted` | Full followers list |
| Target profile private + viewer relation `pending` or absent | 403 |

## 5. Implementation Notes

1. Service resolves both current profile and target profile.
2. Service enforces privacy checks and throws domain exceptions (`ProfileNotFoundException`, `ProfileForbiddenException`).
3. Repository query returns accepted followers plus viewer->follower `followStatus`.
4. Frontend action maps backend camelCase DTO to existing modal-friendly shape.
5. No manual token validation in controller/service.

## 6. Anti-Patterns (DO NOT)

| ❌ Don’t | ✅ Do instead | Why |
|---|---|---|
| Add a second `/me/followers` Spring endpoint with duplicated business logic | Keep one endpoint and one service method (`getFollowers`) | Avoids contract duplication and drift |
| Parse/validate JWT manually in profile classes | Use `Authentication` from Spring Security context | Security is centralized and consistent |
| Put privacy checks in controller | Keep checks in service | Controller stays transport-only |
| Return raw SQL/stack traces to client | Throw domain exceptions handled by `ProfileExceptionHandler` | Prevents sensitive data exposure |
| Keep frontend tied to deleted legacy API routes | Use profile feature server action to call Spring | Strangler migration target |

## 7. Test Case Specifications

### Unit tests required
| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-PROFILE-FOL-001 | ProfileReadService#getFollowers | missing target username | throws `ProfileNotFoundException` | soft-deleted profile |
| TC-PROFILE-FOL-002 | ProfileReadService#getFollowers | owner access | returns followers list | empty list |
| TC-PROFILE-FOL-003 | ProfileReadService#getFollowers | private target + pending/no relation | throws `ProfileForbiddenException` | pending status |
| TC-PROFILE-FOL-004 | ProfileReadService#getFollowers | private target + accepted relation | returns followers list | mixed followStatus values |
| TC-PROFILE-FOL-005 | frontend getProfileFollowersAction | valid payload | maps to modal shape (`is_following`, `isPending`) | invalid backend payload |

### Integration tests required
| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-PROFILE-FOL-001 | GET followers public profile | seed viewer + public target + followers | `200`, `success=true`, array payload | remove seed rows |
| IT-PROFILE-FOL-002 | GET followers private blocked | seed private target, no accepted follow | `403`, `PROFILE_FORBIDDEN` | remove seed rows |
| IT-PROFILE-FOL-003 | Frontend modal read via action | authenticated session + mocked Spring | users list populated from action result | reset mocks/session |

## 8. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Target profile not found | repository empty | 404 `PROFILE_NOT_FOUND` | none | `warn` |
| Viewer profile not found | repository empty | 404 `PROFILE_NOT_FOUND` | none | `warn` |
| Private profile forbidden | service privacy check fails | 403 `PROFILE_FORBIDDEN` | none | `warn` |
| Invalid/expired token | Spring security entry point | 401 JSON auth error | login flow | security handler |
| Unexpected backend failure | unhandled exception | 500 `PROFILE_INTERNAL_ERROR` | none | `error` |
| Invalid frontend action payload | Zod input parse fails | `{ success:false, error }` | no request | client/server action error path |

## 9. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Profile controller | `backend/src/main/java/it/evodev/instagram/profile/controller/ProfileController.java` | `@RequestMapping("/api/priv/profiles")` |
| Profile read service | `backend/src/main/java/it/evodev/instagram/profile/service/impl/ProfileReadServiceImpl.java` | `getFollowers` |
| Followers repository query | `backend/src/main/java/it/evodev/instagram/profile/repository/ProfileVisibilityFollowJpaRepository.java` | `findFollowersWithViewerStatus` |
| Frontend modal | `frontend/src/components/profile/FollowersModal.tsx` | `fetchUsers` |
| Profile read actions | `frontend/src/features/profile/read/actions.ts` | `getProfileFollowersAction` |
| Migration report | `reports/api_routes.csv` | followers rows |
| Postman request | `postman/collections/Profile/Read Profile/Get Profile Followers By Username.request.yaml` | full file |
