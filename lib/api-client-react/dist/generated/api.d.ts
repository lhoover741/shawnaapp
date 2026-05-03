import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { ErrorResponse, HealthStatus, Review, SubmitReviewRequest } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns all admin-approved client reviews
 * @summary List approved reviews
 */
export declare const getListReviewsUrl: () => string;
export declare const listReviews: (options?: RequestInit) => Promise<Review[]>;
export declare const getListReviewsQueryKey: () => readonly ["/api/reviews"];
export declare const getListReviewsQueryOptions: <TData = Awaited<ReturnType<typeof listReviews>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof listReviews>>>;
export type ListReviewsQueryError = ErrorType<unknown>;
/**
 * @summary List approved reviews
 */
export declare function useListReviews<TData = Awaited<ReturnType<typeof listReviews>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Submits a new client review for admin approval
 * @summary Submit a review
 */
export declare const getSubmitReviewUrl: () => string;
export declare const submitReview: (submitReviewRequest: SubmitReviewRequest, options?: RequestInit) => Promise<Review>;
export declare const getSubmitReviewMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitReview>>, TError, {
        data: BodyType<SubmitReviewRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitReview>>, TError, {
    data: BodyType<SubmitReviewRequest>;
}, TContext>;
export type SubmitReviewMutationResult = NonNullable<Awaited<ReturnType<typeof submitReview>>>;
export type SubmitReviewMutationBody = BodyType<SubmitReviewRequest>;
export type SubmitReviewMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Submit a review
 */
export declare const useSubmitReview: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitReview>>, TError, {
        data: BodyType<SubmitReviewRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitReview>>, TError, {
    data: BodyType<SubmitReviewRequest>;
}, TContext>;
/**
 * Returns a curated set of featured reviews for homepage display
 * @summary List featured reviews
 */
export declare const getListFeaturedReviewsUrl: () => string;
export declare const listFeaturedReviews: (options?: RequestInit) => Promise<Review[]>;
export declare const getListFeaturedReviewsQueryKey: () => readonly ["/api/reviews/featured"];
export declare const getListFeaturedReviewsQueryOptions: <TData = Awaited<ReturnType<typeof listFeaturedReviews>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFeaturedReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listFeaturedReviews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListFeaturedReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof listFeaturedReviews>>>;
export type ListFeaturedReviewsQueryError = ErrorType<unknown>;
/**
 * @summary List featured reviews
 */
export declare function useListFeaturedReviews<TData = Awaited<ReturnType<typeof listFeaturedReviews>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFeaturedReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map