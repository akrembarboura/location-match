import "dotenv/config"; // load env if needed

async function testAdminApi() {
  console.log("1. Logging in as admin...");
  
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@locmaison.com",
      password: "adminpassword"
    })
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    console.error("Login failed:", errorText);
    process.exit(1);
  }

  console.log("Login successful!");
  
  // Extract the set-cookie header
  const cookies = loginRes.headers.get("set-cookie");
  if (!cookies) {
    console.error("No session cookie received!");
    process.exit(1);
  }

  console.log("2. Fetching protected /api/admin/requests...");
  
  const reqsRes = await fetch("http://localhost:3000/api/admin/requests", {
    headers: {
      "Cookie": cookies
    }
  });

  if (!reqsRes.ok) {
    console.error("Failed to fetch admin requests:", reqsRes.status);
    const errorText = await reqsRes.text();
    console.error("Error details:", errorText);
    process.exit(1);
  }

  const data = await reqsRes.json();
  console.log("SUCCESS! Fetched admin requests:");
  console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...\n(truncated)");
}

testAdminApi().catch(console.error);

