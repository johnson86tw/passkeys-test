# Passkeys Test

- **RP:** The Relying Party is our backend server, responsible for storing the user's public key in the database.
- **Authenticator:** The authenticator refers to the passkey, such as TouchID or FaceID on a mobile device.

There are two major steps: **Registration (Attestation)** and **Authentication (Assertion)**.

### Registration
1. **GET** generate registration options
2. **POST** verify registration response
   - Accept the value returned by `startRegistration()`.
   - Upon successful verification, store the user's credential in the database.

### Authentication
3. **GET** generate authentication options
4. **POST** verify authentication response
   - Accept the value returned by `startAuthentication()`.
   - If verified, update the user's authenticator's `counter` in the database.
     - During testing on MacOS, the counter in the authentication response from the frontend did not increase, so the server did not update the counter. Relevant [issue](https://stackoverflow.com/questions/78776653/passkey-counter-always-0-macos).

## References
- 實作參考這篇 [使用 SimpleWebAuthn 實現 Passkeys 無密碼登入](https://fullstackladder.dev/blog/2023/06/11/passkeys-using-simplewebauthn/)
- 概念介紹 [使用 WebAuthn 實作無密碼驗證與 Passkey 介紹](https://yishiashia.github.io/posts/passkey-and-webauthn-passwordless-authentication/)

Projects using Cloudflare for the backend:
- [Passkeys demo using Cloudflare Workers, KV, and D1](https://github.com/nealfennimore/passkeys)
- [Password-less login through WebAuthn in Cloudflare Workers and Deno](https://github.com/worker-tools/webauthn-example)