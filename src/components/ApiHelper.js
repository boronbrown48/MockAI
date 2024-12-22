const BASE_URL = "https://yourapi.com/api";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch(`${BASE_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
  } else {
    console.error("Failed to refresh token");
    localStorage.clear();
    window.location.href = "/login";
  }
};

const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem("access_token");

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    await refreshAccessToken();
    token = localStorage.getItem("access_token");
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return response.json();
};

export { refreshAccessToken, fetchWithAuth };
