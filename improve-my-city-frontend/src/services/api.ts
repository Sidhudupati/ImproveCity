import { API_URL } from "@/config"
import { useAuthStore } from "@/stores/authStore"

export interface ApiOptions extends Omit<RequestInit, 'headers'> {
    headers?: Record<string, any>
    body?: any
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
): ApiOptions => {
    return {
        ...options,
        headers: createHeaders(authToken, options.headers, { noContentType }),
        body: options.body ? (stringify ? JSON.stringify(options.body) : options.body) : undefined,
    }
}

export async function callApi(
    endpoint: string,
    options: ApiOptions = {},
    { noContentType = false, stringify = true }: { noContentType?: boolean, stringify?: boolean } = {}
): Promise<unknown> {
    const { token, setToken, setUser } = useAuthStore.getState();
    const fetchOptions = createFetchOptions(options, token, { stringify, noContentType });

    const response = await fetch(`${API_URL}/v1${endpoint}`, fetchOptions);
    const responseData = await response.json();

    if (!response.ok) {
        if (responseData.authFailed) {
            setToken('');
            setUser(null)
        }
        throw new Error(responseData.message);
    }
    return responseData;
}