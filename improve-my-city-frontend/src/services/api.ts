import { API_URL } from "@/config"
import { useAuthStore } from "@/stores/authStore"

export type ApiBody = BodyInit | object | undefined

export interface ApiOptions extends Omit<RequestInit, 'headers' | 'body'> {
    headers?: Record<string, string>
    body?: ApiBody
}

const createHeaders = (
    authToken?: string,
    additionalHeaders?: Record<string, string>,
    { noContentType = false }: { noContentType?: boolean } = {}
): Record<string, string> => {
    const headers: Record<string, string> = noContentType ? { ...additionalHeaders } : {
        'Content-Type': 'application/json',
        ...additionalHeaders,
    }
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
    }
    return headers
}

const createFetchOptions = (
    options: ApiOptions,
    authToken?: string,
    { noContentType = false, stringify = true }: { noContentType?: boolean, stringify?: boolean } = {}
): RequestInit => {
    const body = options.body === undefined
        ? undefined
        : stringify
            ? JSON.stringify(options.body)
            : options.body as BodyInit

    return {
        ...options,
        headers: createHeaders(authToken, options.headers, { noContentType }),
        body,
    }
}

export async function callApi<TResponse>(
    endpoint: string,
    options: ApiOptions = {},
    { noContentType = false, stringify = true }: { noContentType?: boolean, stringify?: boolean } = {}
): Promise<TResponse> {
    const { token, setToken, setUser } = useAuthStore.getState();
    const fetchOptions = createFetchOptions(options, token, { stringify, noContentType });

    let response: Response;

    try {
        response = await fetch(`${API_URL}/v1${endpoint}`, fetchOptions);
    } catch {
        throw new Error('Unable to reach the server. Check that the backend is running and VITE_API_URL is correct.');
    }

    const contentType = response.headers.get('content-type') || '';
    const responseData = contentType.includes('application/json')
        ? await response.json() as { authFailed?: boolean; message?: string } & TResponse
        : { message: await response.text() } as { authFailed?: boolean; message?: string } & TResponse;

    if (!response.ok) {
        if (responseData.authFailed) {
            setToken('');
            setUser(null)
        }
        throw new Error(responseData.message || `Request failed with status ${response.status}`);
    }
    return responseData;
}
