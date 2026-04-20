# RaketMo API Reference

**Base URL:** `http://localhost:3000` (development) / Your deployed server URL (production)  
**Auth:** Bearer token in `Authorization` header — `Authorization: Bearer <access_token>`  
**Content-Type:** `application/json` unless noted (multipart for file uploads)  
**Image Base URL:** Prepend `process.env.image_baseUrl` to all image filename fields in responses

---

## Standard Response Envelope

All endpoints return a consistent JSON shape:

```json
{
  "code": 200,
  "message": "Success message",
  "data": { ... }
}
```

Errors return a `code` of `400`, `404`, or `500` with a descriptive `message`.

---

## Authentication

### POST /user/signup
Register a new user (Job Poster or Worker).

**Auth Required:** No  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `first_name` | string | ✅ | Can include last name — auto-split on space |
| `email` | string | ✅ | Lowercased and unique |
| `password` | string | ✅ | Hashed via bcrypt |
| `profile_type` | string | ✅ | `"JobPoster"` or `"Worker"` |
| `profile_image` | file | ❌ | Single image upload |

**Response:** User object with `access_token`

---

### POST /user/login
Login with email and password.

**Auth Required:** No

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response:** User object with `access_token`

---

### POST /user/socialLogin
Login or register via Google or Apple.

**Auth Required:** No

| Field | Type | Required | Notes |
|---|---|---|---|
| `social_id` | string | ✅ | OAuth provider user ID |
| `social_token` | string | ✅ | `"0"` = Google, `"1"` = Apple |
| `email` | string | ❌ | |
| `first_name` | string | ❌ | |
| `profile_type` | string | ❌ | `"JobPoster"` or `"Worker"` |
| `device_type` | string | ❌ | `"Android"`, `"Apple"`, `"Windows"` |
| `device_token` | string | ❌ | Push notification token |

**Response:** User object with `access_token`

---

### GET /user/verifyEmail
Verify email from link sent during signup.

**Auth Required:** No  
**Query Params:** `access_token`

---

### POST /user/forgotPassword
Send password reset email.

**Auth Required:** No

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |

---

### POST /user/changePassword
Change the authenticated user's password.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `old_password` | string | ✅ |
| `new_password` | string | ✅ |

---

### GET /user/logout
Invalidate the current access token.

**Auth Required:** ✅

---

### POST /user/deleteAccount
Soft-delete the authenticated user's account.

**Auth Required:** ✅

---

### POST /user/sendOtp
Send an OTP to the user's email for account deletion verification.

**Auth Required:** No

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |

---

### POST /user/account_Deletion
Delete account after OTP verification.

**Auth Required:** No

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `otp` | string | ✅ |

---

### GET /user/accountDeletion
Render the account deletion page (web view).

**Auth Required:** No

---

## User Profile

### GET /user/getMyProfile
Get the full profile of the authenticated user.

**Auth Required:** ✅

**Response:** Full user object including profile image URL, skills, categories, ratings, media, availability, and subscription status.

---

### PUT /user/editProfile
Update profile fields.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `first_name` | string | |
| `last_name` | string | |
| `zip_code` | string | |
| `experience_years` | integer | |
| `category_id` | string/array | Comma-separated category IDs |
| `skills` | string/array | Comma-separated skills |
| `payment` | string | `"Cash"`, `"Venmo"`, `"Zelle"` |
| `longitude` | float | |
| `latitude` | float | |
| `address` | string | |
| `user_introduction` | string | |
| `projects_and_media_link` | string | |
| `projects_and_media_case_study` | string | |
| `delete_imgs` | string | Comma-separated image IDs to delete |
| `profile_image` | file | Single |
| `work_imgs` | files | Max 5 |
| `job_imgs` | files | Max 6 |
| `work_video_thumbnail` | file | Max 1 |
| `job_video_thumbnail` | file | Max 1 |

---

### PUT /user/completeProfile
Complete the profile after initial signup (same fields as `editProfile`).

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`  
**Fields:** Same as `editProfile` (excluding `profile_image`)

---

### POST /user/update_location
Update the user's current GPS location.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `longitude` | float | ✅ |
| `latitude` | float | ✅ |

---

### GET /user/changeRole
Toggle the user's active role between `JobPoster` and `Worker`.

**Auth Required:** ✅

---

### POST /user/subscribe
Subscribe to a premium plan (Job Poster side).

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `subscription_id` | integer | ✅ | |

---

### GET /jobPoster/getSubscribe
Get the authenticated Job Poster's current subscription status.

**Auth Required:** ✅

---

---

## Jobs — Job Poster

### POST /jobPoster/addJob
Create a new job listing.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `description` | string | ✅ | |
| `category_id` | string | ✅ | Comma-separated |
| `price` | integer | ✅ | |
| `min_bids` | integer | ✅ | |
| `max_bids` | integer | ✅ | |
| `is_bids_more` | boolean | ✅ | Allow bids above `max_bids` |
| `jobs_date` | date | ✅ | `YYYY-MM-DD` |
| `jobs_time` | string | ✅ | |
| `longitude` | float | ✅ | |
| `latitude` | float | ✅ | |
| `address` | string | ✅ | |
| `job_image` | files | ❌ | Multiple images |

**Response:** Created job object

---

### GET /jobPoster/myJobs
Get all jobs posted by the authenticated user.

**Auth Required:** ✅

**Query Params:**

| Param | Type | Notes |
|---|---|---|
| `status` | string | Filter: `"posted"`, `"onwork"`, `"completed"` |
| `page` | integer | Pagination |

---

### GET /jobPoster/jobDetail
Get full detail of a specific job.

**Auth Required:** ✅

**Query Params:** `job_id`

---

### PUT /jobPoster/editJob
Edit an existing job.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

**Query Params:** `job_id`  
**Body:** Same fields as `addJob` (all optional)

---

### GET /jobPoster/deleteJob
Soft-delete a job.

**Auth Required:** ✅

**Query Params:** `job_id`

---

### GET /jobPoster/viewApplicants
Get all workers who applied to a job.

**Auth Required:** ✅

**Query Params:** `job_id`

---

### PUT /jobPoster/updateApplicantStatus
Accept or reject a worker's job application.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `booking_job_id` | integer | ✅ | |
| `status` | string | ✅ | `"accepted"` or `"rejected"` |

---

### POST /jobPoster/shareJob
Share a job into a chat room.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `room_id` | integer | ✅ |
| `job_id` | integer | ✅ |
| `msg_img` | files | ❌ |

---

---

## Workers

### POST /worker/identityProof
Upload identity verification document.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `identity_proof` | file | ✅ |

---

### POST /worker/skipIdentityProof
Skip the identity verification step.

**Auth Required:** ✅

---

### GET /worker/getAllJobs
Browse available job listings near the worker.

**Auth Required:** ✅

**Query Params:**

| Param | Type | Notes |
|---|---|---|
| `longitude` | float | ✅ Required |
| `latitude` | float | ✅ Required |
| `category_id` | string | Filter by category |
| `area` | integer | Radius in miles |
| `page` | integer | Pagination |

---

### POST /worker/applyJob
Apply for a job.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `job_id` | integer | ✅ | |
| `bid_amount` | integer | ✅ | Worker's bid price |
| `cover_letter` | string | ❌ | |

---

### GET /worker/getMyAppliedJob
Get all jobs the authenticated worker has applied to.

**Auth Required:** ✅

**Query Params:** `status` (filter: `"pending"`, `"accepted"`, `"rejected"`)

---

### GET /worker/jobDetail
Get full detail of a specific job (worker view).

**Auth Required:** ✅

**Query Params:** `job_id`

---

### PUT /worker/acceptDeclined
Accept or decline an appointment/booking from a Job Poster.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `appointment_id` | integer | ✅ | |
| `status` | string | ✅ | `"accepted"` or `"declined"` |

---

### PUT /worker/dislikeJob
Dislike / dismiss a job (removes from feed).

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `job_id` | integer | ✅ |

---

### POST /worker/addAvailability
Set the worker's available days/times.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `day` | string | ✅ | e.g. `"Monday"` |
| `start_time` | string | ✅ | e.g. `"09:00 AM"` |
| `end_time` | string | ✅ | e.g. `"05:00 PM"` |

---

### PUT /worker/editAvailability
Edit existing availability.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `availability_id` | integer | ✅ |
| `day` | string | ❌ |
| `start_time` | string | ❌ |
| `end_time` | string | ❌ |

---

### POST /worker/subscribe
Subscribe to a premium plan (Worker side).

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `subscription_id` | integer | ✅ |

---

### POST /worker/subscribeTopUser
Subscribe to be featured as a Top Worker.

**Auth Required:** ✅

---

### GET /worker/getSubscribe
Get the authenticated worker's current subscription status.

**Auth Required:** ✅

---

### PUT /worker/toggleRole
Toggle the worker's active role between Worker and Job Poster.

**Auth Required:** ✅

---

### POST /worker/completeJobFromWorker
Mark a job as completed from the worker's side.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `job_id` | integer | ✅ |

---

---

## Search & Discovery

### GET /jobPoster/searchWorker
Search for workers by name, skills, or category.

**Auth Required:** ✅

**Query Params:**

| Param | Type | Notes |
|---|---|---|
| `search` | string | Search keyword |
| `category_id` | string | Filter by category |
| `page` | integer | |

---

### GET /jobPoster/findNearOrRecentWorkers
Find workers who are nearby or recently active.

**Auth Required:** ✅

**Query Params:** `longitude`, `latitude`, `area`, `page`

---

### GET /jobPoster/findBothNearOrRecentWorkers
Find both nearby AND recently active workers in a single call.

**Auth Required:** ✅

**Query Params:** `longitude`, `latitude`, `area`, `page`

---

### POST /jobPoster/addRecentSearch
Save a search term to recent searches.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `search` | string | ✅ |

---

### GET /jobPoster/getRecentSearches
Get the user's recent search history.

**Auth Required:** ✅

---

### PUT /jobPoster/deleteRecentSearch
Delete a recent search entry.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `recent_id` | integer | ✅ |

---

---

## Profiles & Ratings

### GET /jobPoster/viewProfile_PreviousWork
View a worker's profile including previous work, media, and ratings.

**Auth Required:** ✅

**Query Params:** `worker_id`

---

### GET /worker/viewJobPoster_PreviousWork
View a Job Poster's profile and previous job history.

**Auth Required:** ✅

**Query Params:** `job_poster_id`

---

### GET /jobPoster/checkAvailability
Check a worker's availability schedule.

**Auth Required:** ✅

**Query Params:** `worker_id`

---

### GET /user/workerAllRating
Get all ratings for a worker.

**Auth Required:** ✅

**Query Params:** `worker_id`

---

### GET /worker/jobPosterAllRating
Get all ratings for a Job Poster.

**Auth Required:** ✅

**Query Params:** `job_poster_id`

---

### POST /user/rateNow
Submit a rating for a user.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `rated_user_id` | integer | ✅ | |
| `rating` | float | ✅ | 1.0 – 5.0 |
| `review` | string | ❌ | |
| `job_id` | integer | ❌ | |

---

---

## Appointments & Scheduling

### POST /jobPoster/sheduleMetting
Schedule a meeting/appointment with a worker.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `worker_id` | integer | ✅ |
| `job_id` | integer | ✅ |
| `date` | date | ✅ |
| `time` | string | ✅ |
| `message` | string | ❌ |

---

### GET /user/getSheduledMetting
Get all scheduled meetings for the authenticated user.

**Auth Required:** ✅

---

### PUT /jobPoster/editAppointment
Edit an existing appointment.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `appointment_id` | integer | ✅ |
| `date` | date | ❌ |
| `time` | string | ❌ |
| `message` | string | ❌ |

---

### PUT /jobPoster/deleteAppointment
Cancel/delete an appointment.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `appointment_id` | integer | ✅ |

---

---

## Messaging

### POST /user/createRoom
Create a new chat room between two users.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `receiver_id` | integer | ✅ |

**Response:** Room object with `room_id`

---

### POST /user/sendMessage
Send a message in a chat room.

**Auth Required:** ✅  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `room_id` | integer | ✅ | |
| `message` | string | ❌ | Text or image required |
| `msg_img` | files | ❌ | Multiple images |
| `msg_type` | string | ❌ | `"text"`, `"image"`, `"job"` |

---

### GET /user/getAllRooms
Get all chat rooms for the authenticated user.

**Auth Required:** ✅

---

### GET /user/getAllMessages
Get all messages in a specific chat room.

**Auth Required:** ✅

**Query Params:** `room_id`, `page`

---

### GET /user/is_seen
Mark messages in a room as seen.

**Auth Required:** ✅

**Query Params:** `room_id`

---

### POST /user/deleteRoom
Delete a chat room.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `room_id` | integer | ✅ |

---

### GET /jobPoster/share_users_lisitng
Get a list of users to share a job with.

**Auth Required:** ✅

**Query Params:** `search` (optional)

---

---

## Notifications

### GET /user/getAllNotifications
Get all notifications for the authenticated user.

**Auth Required:** ✅

---

### PUT /user/deleteNotification
Delete one or all notifications.

**Auth Required:** ✅

| Field | Type | Required | Notes |
|---|---|---|---|
| `notification_id` | integer | ❌ | Omit to delete all |

---

---

## Social — Block & Report

### POST /user/blockUnblock
Block or unblock another user.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `blocked_user_id` | integer | ✅ |

---

### GET /user/myBlockList
Get the authenticated user's block list.

**Auth Required:** ✅

---

### POST /user/report
Report a user.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `reported_user_id` | integer | ✅ |
| `report_id` | integer | ✅ | Reason ID from `/user/reportsListing` |

---

### GET /user/reportsListing
Get all available report reason options.

**Auth Required:** No

---

---

## Categories

### GET /user/categoriesListing
Get all active job categories.

**Auth Required:** ✅

**Response:** Array of `{ id, name, icon }` objects

---

---

## Payments (Stripe)

### GET /payment/connect_stripe
Initiate Stripe Connect onboarding for a worker to receive payments.

**Auth Required:** ✅

**Response:** Stripe onboarding URL

---

### GET /payment/stripeConnected
Stripe redirect callback after successful onboarding.

**Auth Required:** No

---

### POST /payment/add_card
Add a payment card for a Job Poster.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `card_token` | string | ✅ | Stripe card token |

---

### GET /payment/list_all_card
List all saved cards for the authenticated user.

**Auth Required:** ✅

---

### POST /payment/update_card
Set a card as the default payment method.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `card_id` | string | ✅ | Stripe card ID |

---

### POST /payment/delete_card
Remove a saved card.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `card_id` | string | ✅ |

---

### POST /payment/send_payment
Initiate a payment from Job Poster to Worker.

**Auth Required:** ✅

| Field | Type | Required |
|---|---|---|
| `worker_id` | integer | ✅ |
| `job_id` | integer | ✅ |
| `amount` | float | ✅ |
| `card_id` | string | ✅ |

---

### GET /payment/disconnect_stripe
Disconnect the worker's Stripe account.

**Auth Required:** ✅

---

### GET /payment/stripe_login
Get a Stripe Express Dashboard login link for a connected worker.

**Auth Required:** ✅

---

### POST /stripe/skip
Skip the Stripe onboarding step.

**Auth Required:** ✅

---

---

## Admin

> Admin routes use session-based auth (`admin_auth` middleware), not Bearer tokens.

### GET/POST /admin/login
Admin panel login page and form submit.

---

### GET /admin/logout
Admin logout.

---

### POST /admin/editProfile
Edit the admin profile (with profile image upload).

---

### GET /admin/renderWorkers
Render all workers list in admin panel.

---

### GET /admin/getAllWorkersJobs
Get all workers and their job history.

---

### GET /admin/renderJobposters
Render all job posters in admin panel.

---

### GET /admin/getAllPostedJobs
Get all posted jobs.

---

### GET /admin/viewApplicants
View all applicants for a job (admin view).

**Query Params:** `job_id`

---

### GET /admin/enableDisableUser
Enable or disable a user account.

**Query Params:** `user_id`, `action` (`"Enable"` or `"Disable"`)

---

### GET /admin/enableDisableJob
Enable or disable a job listing.

**Query Params:** `job_id`, `action` (`"Enable"` or `"Disable"`)

---

### GET /admin/verificationRequest
Get all pending identity verification requests.

---

### GET /admin/get-requested-users
Get users who have submitted identity proof.

---

### POST /admin/proof-accept-reject
Accept or reject an identity proof submission.

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | integer | ✅ | |
| `status` | string | ✅ | `"accept"` or `"reject"` |

---

### GET /admin/getSubscriptions
Get all subscription plans.

---

### GET /admin/verifiedUsers
Get all verified users.

---

### POST /admin/addCategory
Add a new job category.

| Field | Type | Required |
|---|---|---|
| `name` | string | ✅ |

---

### POST /admin/addOrUpdateCategory
Add or update a category with an icon image.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `name` | string | ✅ |
| `category_id` | integer | ❌ | Include to update existing |
| `category_icon` | file | ❌ |

---

### GET /admin/massPushPage / POST /admin/sendMassPush
Send a mass push notification to all users.

**POST Body:**

| Field | Type | Required |
|---|---|---|
| `title` | string | ✅ |
| `message` | string | ✅ |

---

### GET /admin/termsAndConditions
Render Terms & Conditions page.

---

### GET /admin/privacyPolicy
Render Privacy Policy page.

---

### GET /admin/aboutUs
Render About Us page.

---

---

## Data Models Reference

### User Object
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "profile_type": "JobPoster",
  "profile_image": "filename.jpg",
  "profile_goal": null,
  "zip_code": "90210",
  "longitude": -118.243683,
  "latitude": 34.052235,
  "address": "Los Angeles, CA",
  "experience_years": 3,
  "category_id": "1,2",
  "skills": "cleaning,painting",
  "payment": "Cash",
  "overall_rating": "4.5",
  "is_verified": 1,
  "isProfileCompleted": "1",
  "isAvailability": "1",
  "isSubscription": "0",
  "top_verified": "0",
  "stripe_enabled": "0",
  "stripe_skip": "0",
  "total_earning": 0.00,
  "access_token": "jwt_token_string"
}
```

### Job Object
```json
{
  "id": 1,
  "title": "Move furniture",
  "description": "Need help moving 3 rooms of furniture",
  "job_poster_id": 5,
  "category_id": "1,3",
  "price": 150,
  "min_bids": 50,
  "max_bids": 200,
  "is_bids_more": false,
  "jobs_date": "2026-05-01",
  "jobs_time": "10:00 AM",
  "longitude": -118.243683,
  "latitude": 34.052235,
  "address": "West Hollywood, CA",
  "status": "posted",
  "action": "Enable"
}
```

### Booking/Application Object
```json
{
  "id": 1,
  "job_id": 5,
  "worker_id": 12,
  "bid_amount": 120,
  "cover_letter": "I can do this job...",
  "status": "pending"
}
```

---

*Generated from raketmo-backend source — routes, controllers, and models. Last updated: April 2026.*
