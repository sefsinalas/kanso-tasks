import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PACKAGE_NAME = 'com.kanso.tasks';
const SERVICE_ACCOUNT_PATH = path.resolve('android/play-service-account.json');
const AAB_PATH = path.resolve('android/app/build/outputs/bundle/release/app-release.aab');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claims}`);
  const signature = sign.sign(sa.private_key).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Failed to obtain Google access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function publishToPlayStore({ track = 'internal', releaseNotes = 'Versión inicial de Kanso Tasks para pruebas.' } = {}) {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(`Service account not found at ${SERVICE_ACCOUNT_PATH}`);
  }
  if (!fs.existsSync(AAB_PATH)) {
    throw new Error(`AAB file not found at ${AAB_PATH}. Run "npm run build:android" first.`);
  }

  const sa = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  console.log(`[PlayStore] Authenticating as ${sa.client_email}...`);
  const token = await getAccessToken(sa);

  console.log(`[PlayStore] Creating new edit for ${PACKAGE_NAME}...`);
  const editRes = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!editRes.ok) {
    const err = await editRes.json();
    throw new Error(`Failed to create edit (${editRes.status}): ${JSON.stringify(err)}`);
  }

  const { id: editId } = await editRes.json();
  console.log(`[PlayStore] Active edit ID: ${editId}`);

  // Upload AAB
  console.log(`[PlayStore] Uploading bundle ${AAB_PATH}...`);
  const aabBuffer = fs.readFileSync(AAB_PATH);
  const uploadRes = await fetch(`https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE_NAME}/edits/${editId}/bundles?uploadType=media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(aabBuffer.length)
    },
    body: aabBuffer
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Failed to upload AAB bundle (${uploadRes.status}): ${JSON.stringify(err)}`);
  }

  const bundleData = await uploadRes.json();
  console.log(`[PlayStore] Bundle uploaded successfully! VersionCode: ${bundleData.versionCode}, SHA1: ${bundleData.sha1}`);

  // Update Track
  console.log(`[PlayStore] Updating track "${track}" with versionCode ${bundleData.versionCode}...`);
  const trackBody = {
    track,
    releases: [
      {
        name: `1.0.0 (${bundleData.versionCode})`,
        versionCodes: [String(bundleData.versionCode)],
        status: 'completed',
        releaseNotes: [
          {
            language: 'es-419',
            text: releaseNotes
          }
        ]
      }
    ]
  };

  const trackRes = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/edits/${editId}/tracks/${track}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(trackBody)
  });

  if (!trackRes.ok) {
    const err = await trackRes.json();
    throw new Error(`Failed to update track (${trackRes.status}): ${JSON.stringify(err)}`);
  }

  console.log(`[PlayStore] Track "${track}" updated. Committing edit...`);
  const commitRes = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/edits/${editId}:commit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!commitRes.ok) {
    const err = await commitRes.json();
    throw new Error(`Failed to commit edit (${commitRes.status}): ${JSON.stringify(err)}`);
  }

  const commitData = await commitRes.json();
  console.log(`[PlayStore] SUCCESS! Release committed to track "${track}".`, commitData);
  return { editId, versionCode: bundleData.versionCode, track };
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('publish-playstore.mjs')) {
  const trackArg = process.argv[2] || 'internal';
  publishToPlayStore({ track: trackArg })
    .then(result => {
      console.log('Finished with result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error during Play Store publish:', err);
      process.exit(1);
    });
}
