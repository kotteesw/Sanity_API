const fetch = require('node-fetch');

// -- CONFIG --
const SANITY_URL = 'https://dkzin53m.api.sanity.io/v1/data/query/production?query=*[_type == "post"]{_id, title, body}';

const SFMC = {
  auth_url: 'https://mc0xrhx0xwsj30mffysv22w-lqs1.auth.marketingcloudapis.com/v2/token',
  post_url: 'https://mc0xrhx0xwsj30mffysv22w-lqs1.rest.marketingcloudapis.com/hub/v1/dataeventsasync/key:73B18CB1-6114-4AB9-BD2F-2D77401927ED/rowset',
  client_id: 'nvchrrupmbk78wdh0jola9q7',
  client_secret: 'DUfXv8BZe6JybReDtztMEuCi'
};

// -- HELPER: Extract plain text from Sanity's block content --
function extractPlainText(bodyArray) {
  if (!Array.isArray(bodyArray)) return '';
  return bodyArray
    .map(block => (block.children || [])
      .map(child => child.text || '')
      .join(' ')
    ).join('\n\n');
}

// -- Get blog posts from Sanity CMS --
async function getSanityPosts() {
  const res = await fetch(SANITY_URL);
  const data = await res.json();
  return data.result || [];
}

// -- Get OAuth token from SFMC --
async function getSFMCAuthToken() {
  const response = await fetch(SFMC.auth_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: SFMC.client_id,
      client_secret: SFMC.client_secret
    })
  });
  const result = await response.json();
  return result.access_token;
}

// -- Push data to SFMC DE --
async function pushToSFMC(posts, token) {
  const payload = posts.map(post => {
    const cleanBody = extractPlainText(post.body);

    const row = {
      keys: {
        PostID: post._id
      },
      values: {
        Title: post.title || 'Untitled',
        Body: cleanBody
      }
    };

    // LOG EACH PAYLOAD ROW BEFORE SENDING
    console.log('\n🧪 Prepared Row:');
    console.log(JSON.stringify(row, null, 2));

    return row;
  });

  console.log('\n📦 Payload being sent to SFMC:\n', JSON.stringify(payload, null, 2));

  const res = await fetch(SFMC.post_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log(`\n✅ SFMC Response Status: ${res.status}`);
  console.log(`🧾 SFMC Response Body:\n${text}`);

  if (res.status !== 202) {
    console.error('❌ Something went wrong — check field mappings and DE key.');
  } else {
    console.log('🎉 Data push successful!');
  }
}

// -- MAIN EXECUTION --
(async () => {
  try {
    console.log('🔄 Fetching Sanity posts...');
    const posts = await getSanityPosts();
    if (posts.length === 0) {
      console.warn('⚠️ No posts returned from Sanity. Aborting.');
      return;
    }

    console.log(`✅ Fetched ${posts.length} posts.`);

    console.log('\n🔐 Getting SFMC token...');
    const token = await getSFMCAuthToken();
    console.log('🔓 Auth token retrieved.');

    console.log('\n🚀 Sending data to SFMC DE...');
    await pushToSFMC(posts, token);
  } catch (error) {
    console.error('🔥 Fatal error:', error);
  }
})();
