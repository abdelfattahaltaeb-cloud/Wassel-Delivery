# Android Firebase App Distribution

This document sets up Android-first real-device distribution for the independent Wassel Delivery project. It covers all three Flutter apps:

- customer app
- driver app
- admin mobile

The repository changes in this phase do not include iOS distribution.

## What This Adds

- a manual GitHub Actions workflow for Android Firebase App Distribution
- CI-side release signing support for Flutter Android builds
- artifact upload to GitHub Actions for traceability
- Firebase App Distribution upload for internal tester groups

## Android App Registration Plan

Use one Firebase project for the independent Wassel Delivery mobile testing lane.

Recommended Firebase project placeholder:

- `<FIREBASE_PROJECT_ID>`

Current Android package names in the repository are:

| App | App folder | Current package name | Placeholder for future final package |
| --- | --- | --- | --- |
| Customer app | `apps/customer-app` | `com.wassel.customer_app` | `<CUSTOMER_ANDROID_APPLICATION_ID>` |
| Driver app | `apps/driver-app` | `com.wassel.driver_app` | `<DRIVER_ANDROID_APPLICATION_ID>` |
| Admin mobile | `apps/admin-mobile` | `com.wassel.admin_mobile` | `<ADMIN_MOBILE_ANDROID_APPLICATION_ID>` |

If you change package names later, update the matching Android registration in Firebase before running distribution again.

## Required Firebase Setup

Create the following in Firebase:

1. Create a Firebase project for the independent Wassel Delivery project.
2. Open Firebase App Distribution in that project.
3. Register one Android app in Firebase for each Flutter app listed above.
4. Record the Firebase Android App ID for each app. These are the values shaped like `<FIREBASE_ANDROID_APP_ID>` and not the package name.
5. Create an internal tester group for Android distribution, for example `<ANDROID_INTERNAL_TESTERS_GROUP>`.
6. Add your internal tester email addresses to that tester group.
7. Create a service account with Firebase App Distribution access for this project.
8. Export the service account JSON and store it only in GitHub Secrets.

Recommended Firebase secret placeholders:

- `<FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_JSON>`
- `<FIREBASE_APP_ID_CUSTOMER_ANDROID>`
- `<FIREBASE_APP_ID_DRIVER_ANDROID>`
- `<FIREBASE_APP_ID_ADMIN_MOBILE_ANDROID>`
- `<FIREBASE_APP_DISTRIBUTION_GROUPS_ANDROID>`

## Required GitHub Secrets

Create these repository secrets in GitHub for the Wassel-Delivery repository:

| Secret name | Purpose |
| --- | --- |
| `FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_JSON` | Full Firebase service account JSON for App Distribution uploads |
| `FIREBASE_APP_ID_CUSTOMER_ANDROID` | Firebase Android App ID for the customer app |
| `FIREBASE_APP_ID_DRIVER_ANDROID` | Firebase Android App ID for the driver app |
| `FIREBASE_APP_ID_ADMIN_MOBILE_ANDROID` | Firebase Android App ID for the admin mobile app |
| `FIREBASE_APP_DISTRIBUTION_GROUPS_ANDROID` | Default comma-separated internal tester groups |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Android keystore password |
| `ANDROID_KEY_ALIAS` | Android key alias |
| `ANDROID_KEY_PASSWORD` | Android key password |

Notes:

- Keep all values out of git.
- The workflow writes temporary CI-only files from secrets at runtime.
- The repository ignores generated `key.properties` and keystore files.

## GitHub Actions Workflow

Workflow file:

- `.github/workflows/android-firebase-app-distribution.yml`

Behavior:

- manual trigger only through `workflow_dispatch`
- select one app per run:
  - `customer-app`
  - `driver-app`
  - `admin-mobile`
- optional tester group override per run
- optional release note suffix per run
- builds a release APK
- uploads the APK as a GitHub Actions artifact
- uploads the APK to Firebase App Distribution
- writes a human-readable step summary

## How To Trigger The Workflow

From GitHub:

1. Open the repository Actions tab.
2. Open `Android Firebase Distribution`.
3. Click `Run workflow`.
4. Select the app to distribute.
5. Optionally override tester groups.
6. Optionally add a short release note suffix.
7. Start the workflow.

## Release Notes Format

Each Firebase release includes:

- app name
- branch name
- commit SHA
- optional operator-supplied notes

This keeps repeated internal test releases easy to track.

## What Testers Receive

Internal testers receive the build through Firebase App Distribution:

- email invitation if they are newly added
- email release notification for new builds
- access through the Firebase App Distribution tester portal or tester app

The workflow also keeps the generated APK in GitHub Actions artifacts for internal traceability.

## Real Android Phone Testing Flow

After a workflow run succeeds:

1. The tester opens the Firebase App Distribution email or tester app.
2. The tester downloads the Android build for the selected Wassel app.
3. The tester installs the app on a real Android phone.
4. The tester runs the smoke or manual validation flow on the device.
5. The team records pass or fail against the workflow run, commit SHA, and Firebase release entry.

## Verification Checklist

Use this checklist after each workflow run:

1. GitHub Actions logs show Flutter setup, dependency install, APK build, artifact upload, and Firebase upload.
2. GitHub Actions artifact output includes the generated release APK.
3. Firebase CLI upload step completes successfully in workflow logs.
4. Firebase App Distribution shows a new release for the selected Android app.
5. Internal tester group receives the release.
6. Repository git status stays clean after the repo changes are committed.

## Sample Successful Workflow Result

Example expected outcome for a successful run:

```text
Workflow: Android Firebase Distribution
Input app: driver-app
Artifact: driver-app-android-release-<SHORT_SHA>.apk
Firebase upload: completed
Tester groups: <ANDROID_INTERNAL_TESTERS_GROUP>
Release notes:
  App: Driver App
  Branch: <BRANCH_NAME>
  Commit: <COMMIT_SHA>
  Notes: <OPTIONAL_RELEASE_NOTES_SUFFIX>
```

## Scope Guardrails

- Android first only in this phase
- no iOS CI distribution in this phase
- no secrets committed to the repository
- no force-push required or expected
