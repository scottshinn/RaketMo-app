const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3070';

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_type: string;
  profile_image: string | null;
  zip_code: string | null;
  overall_rating: string;
  is_verified: number;
  isProfileCompleted: string;
  isSubscription: string;
  stripe_enabled: string;
  access_token: string;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const json: ApiResponse<T> = await res.json();
  return json;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type SignupPayload = {
  first_name: string;
  email: string;
  password: string;
  profile_type: 'JobPoster' | 'Worker';
};

export async function signup(payload: SignupPayload): Promise<ApiResponse<AuthUser>> {
  const form = new FormData();
  form.append('first_name', payload.first_name);
  form.append('email', payload.email);
  form.append('password', payload.password);
  form.append('profile_type', payload.profile_type);

  return apiFetch<AuthUser>('/user/signup', { method: 'POST', body: form });
}

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<ApiResponse<AuthUser>> {
  return apiFetch<AuthUser>('/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function logout(token: string): Promise<ApiResponse<null>> {
  return apiFetch<null>('/user/logout', { method: 'GET' }, token);
}

export async function getMyProfile(token: string): Promise<ApiResponse<AuthUser>> {
  return apiFetch<AuthUser>('/user/getMyProfile', { method: 'GET' }, token);
}

// ── Categories ────────────────────────────────────────────────────────────────

export type Category = {
  id: number;
  name: string;
  icon: string;
};

export async function getCategoriesListing(token: string): Promise<ApiResponse<Category[]>> {
  return apiFetch<Category[]>('/user/categoriesListing', { method: 'GET' }, token);
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export type Job = {
  id: number;
  title: string;
  description: string;
  job_poster_id: number;
  category_id: string;
  category_name?: string;
  price: number;
  min_bids: number;
  max_bids: number;
  is_bids_more: boolean;
  jobs_date: string;
  jobs_time: string;
  longitude: number;
  latitude: number;
  address: string;
  distance?: number;
  status: 'posted' | 'onwork' | 'completed';
  action: 'Enable' | 'Disable';
  created_at?: string;
  job_image?: string[];
  bid_count?: number;
  poster_rating?: string;
  poster_name?: string;
};

export type GetAllJobsParams = {
  longitude: number;
  latitude: number;
  category_id?: string;
  area?: number;
  page?: number;
};

export type AddJobPayload = {
  title: string;
  description: string;
  category_id: string;
  price: number;
  min_bids: number;
  max_bids: number;
  is_bids_more: boolean;
  jobs_date: string;
  jobs_time: string;
  longitude: number;
  latitude: number;
  address: string;
};

export async function addJob(payload: AddJobPayload, token: string): Promise<ApiResponse<Job>> {
  const form = new FormData();
  (Object.entries(payload) as [string, string | number | boolean][]).forEach(([k, v]) => {
    form.append(k, String(v));
  });
  return apiFetch<Job>('/jobPoster/addJob', { method: 'POST', body: form }, token);
}

export async function getAllJobs(
  params: GetAllJobsParams,
  token: string,
): Promise<ApiResponse<Job[]>> {
  const qs = new URLSearchParams({
    longitude: String(params.longitude),
    latitude: String(params.latitude),
    ...(params.category_id && { category_id: params.category_id }),
    ...(params.area !== undefined && { area: String(params.area) }),
    ...(params.page !== undefined && { page: String(params.page) }),
  });
  return apiFetch<Job[]>(`/worker/getAllJobs?${qs}`, { method: 'GET' }, token);
}
