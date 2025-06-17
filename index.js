const express = require('express');
const axios = require('axios');
const app = express();

const SANITY_PROJECT_ID = 'dkzin53m';
const SANITY_DATASET = 'production';
const SANITY_TOKEN = 'skKDo0O05MrGYr9uvw8MnBLyUkRlFWDIweQYrIvzJWcUcU1j3HX9Cg5oc6PEIOmi5a8fjw41suoc16xhEhL7xZQaNG1FJNOJkxBDTibWEu9FOkbSXkFsb8ICwToE0LXx1vptsaLhMjQ3ncvVBXzZ1Z128eRHweCzUzm9PPsIOdmJL0vdGrYB'; // Replace later

app.get('/posts', async (req, res) => {
  const query = encodeURIComponent("*[_type=='post']{title, body}");
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}?query=${query}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${SANITY_TOKEN}`
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch from Sanity' });
  }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
