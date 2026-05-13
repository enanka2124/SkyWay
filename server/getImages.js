const fs = require('fs');

async function run() {
  const cities = ['Mumbai', 'Goa', 'Delhi', 'Bangalore', 'Chennai', 'Dubai', 'Jaipur', 'Kolkata', 'Hyderabad', 'Udaipur', 'Kerala', 'Manali', 'Singapore', 'Bangkok'];
  const map = {};
  for (const c of cities) {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${c}&prop=pageimages&format=json&pithumbsize=600`);
      const data = await res.json();
      const pages = data.query.pages;
      const page = Object.values(pages)[0];
      map[c] = page.thumbnail ? page.thumbnail.source : '';
    } catch (e) {
      console.error(e);
    }
  }
  console.log(JSON.stringify(map, null, 2));
}

run();
