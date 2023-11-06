export interface Request extends Omit<RequestInit, 'url'> {
  action?: string;
  form?: Record<string, string>;
}

export default function fetchAction(request: Request): Promise<Response> {
  return fetch(request.action ?? '/', {
    ...request,
    method: request.method ?? 'GET',
    headers: {
      ...request.headers,
      'X-Sveltekit-Action': 'true',
    },
    body: request.form ? createFormData(request.form) : request.body || undefined,
  });
}

function createFormData(data: Record<string, string>): FormData {
  const form = new FormData();
  for (const key in data) {
    if (typeof data[key] !== 'string') continue;
    form.set(key, data[key]);
  }
  return form;
}
