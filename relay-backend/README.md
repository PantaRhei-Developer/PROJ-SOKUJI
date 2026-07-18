# SOKUJI Allo — Relay Backend

Lets the "API利用" mode work without the end user ever creating a Gemini API key.
See `docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md` for the full design.

## Local development

```bash
npm install
gcloud auth application-default login   # once, so firebase-admin can find credentials
cp .env.example .env                    # then fill in GEMINI_API_KEY
npm run dev
```

## Deploying (Cloud Run, project `pantarhei-int-sandbox-prd`)

```bash
gcloud run deploy allo-relay-backend \
  --source . \
  --project pantarhei-int-sandbox-prd \
  --region <pick-a-region> \
  --set-env-vars GEMINI_API_KEY=<value>
```

The service account Cloud Run runs as needs:
- `roles/firebaseauth.admin` (or equivalent) to verify ID tokens
- Firestore read/write access, for the `alloAllowlist` and `alloUsageLog` collections

## Firestore setup

Add allowed testers by creating a document in the `alloAllowlist` collection
whose document ID is their email address (the document's contents don't
matter — only its existence is checked). No document = not allowed.
