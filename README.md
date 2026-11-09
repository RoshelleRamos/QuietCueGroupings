# QuietCue frontend prototype

QuietCue is an Expo prototype. Install Node.js 22 or newer, then run:

```sh
cd mobile
npm ci
npm run web
```

From the splash screen, open **Demo Login** and enter one of these sample emails:

- **Parent** · `parent@example.com`
- **Child** · `child@example.com`

In the Parent profile, open **Tasks** to add, edit, complete, or delete a task.
Open **Family** to copy the demo family code, then log out from **Profile**.
Open the Child profile in the same browser, enter the code under **Profile**,
and send a sample request. Switch back to Parent to see it under **Family**
and **Notifications**.

Demo profiles and changes are stored in the current browser or app installation.
Sign-up creates a local demo profile using a sample name and email.

## Checks and static build

```sh
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

Serve the generated `mobile/dist/` folder with a static host. Configure the host
to serve `index.html` for app routes such as `/parent/tasks`.
