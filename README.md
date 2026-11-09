# QuietCue frontend prototype

QuietCue is an Expo prototype. Install Node.js 22 or newer, then run:

```sh
cd mobile
npm ci
npm run web
```

For Expo Go, run `npm start -- --go` from `mobile` and scan the QR code
with an SDK 58 compatible version of Expo Go.

From the splash screen, choose **Sign Up** to create an account with a name,
email, password, and role. Use that email and password to sign back in.

In a Parent account, open **Tasks** to add, edit, complete, or delete a task.
Open **Family** to copy the family code, then log out from **Profile**.
Create a Child account with a different email in the same browser or app
installation. Enter the code under **Profile**, then send a request.
Switch back to Parent to see it under **Family** and **Notifications**.

Accounts and activity stay in the current browser or app installation. To keep
an existing passwordless profile, sign up with its previous email and role to
add a password and retain its data.

## Checks and static build

```sh
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

Serve the generated `mobile/dist/` folder with a static host. Configure the host
to serve `index.html` for app routes such as `/parent/tasks`.
