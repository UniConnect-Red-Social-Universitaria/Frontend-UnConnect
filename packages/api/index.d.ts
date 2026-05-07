export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
};

export type AsyncKeyValueStorage = {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
};

export type CreateApiClientOptions = {
    baseUrl: string;
    storage: AsyncKeyValueStorage;
};

export type ApiClient = {
    getBaseUrl(): string;

    getToken(): Promise<string | null>;
    setToken(token: string): Promise<void>;
    removeToken(): Promise<void>;

    getUserId(): Promise<string | null>;
    setUserId(userId: string): Promise<void>;

    request<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;
    publicRequest<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;

    get<T = any>(endpoint: string): Promise<ApiResponse<T>>;
    post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>>;
    put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>>;
    patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>>;
    delete<T = any>(endpoint: string): Promise<ApiResponse<T>>;
};

export declare function createApiClient(options: CreateApiClientOptions): ApiClient;
