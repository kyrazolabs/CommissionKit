const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  const workspaceId = localStorage.getItem("ck_active_workspace");
  
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    let errorMessage = "An error occurred";
    try {
      const data = await res.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch (e) {
      // Not JSON
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  return res.json();
}
