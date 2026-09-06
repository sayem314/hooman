import type { Got, GotStream, GotPaginate, HTTPAlias, InstanceDefaults, RequestPromise, Response, StrictOptions } from 'got';

/**
Custom hooman options. They live inside got's `context` object, because got
v12+ rejects unknown top-level options.

@example
```
await hooman('https://sayem.eu.org', { context: { captchaKey: '...' } });
```
*/
export type HoomanContext = {
	/**
	Number of times to retry solving the cloudflare js challenge. Set `0` to
	disable the challenge handler, for example when you only probe a page.
	@default 5
	*/
	cloudflareRetry?: number;

	/**
	Number of times to retry a cloudflare redirect that lost its challenge token.
	@default 1
	*/
	notFoundRetry?: number;

	/**
	Maximum number of captcha solving attempts per request.
	@default 1
	*/
	captchaRetry?: number;

	/**
	Custom captcha solving function. Receives the captcha options and should
	return the captcha response string, or `undefined`.
	*/
	onCaptcha?: (captchaOptions: { key: string; pageurl: string; sitekey: string; method: string }) => Promise<string | undefined> | string | undefined;

	/**
	2captcha / rucaptcha API key. Also settable through the `HOOMAN_CAPTCHA_KEY`
	environment variable.
	*/
	captchaKey?: string;

	/**
	Use rucaptcha.com instead of 2captcha.com. Also settable through the
	`HOOMAN_RUCAPTCHA` environment variable.
	@default false
	*/
	rucaptcha?: boolean;

	/**
	Internal flag marking a request whose captcha was already solved once.
	*/
	ignoreInProgress?: boolean;
};

/**
Got request options with hooman's `context` narrowed to {@link HoomanContext}.
Everything else got supports stays available.
*/
export type HoomanOptions = Omit<StrictOptions, 'context'> & { context?: HoomanContext };

type HoomanCall = {
	(url: string | URL, options?: HoomanOptions): RequestPromise<Response<string>>;
	(url: string | URL, options?: HoomanOptions & { responseType: 'json' }): RequestPromise<Response<unknown>>;
	(url: string | URL, options?: HoomanOptions & { responseType: 'buffer' }): RequestPromise<Response<Uint8Array<ArrayBuffer>>>;
	(url: string | URL, options?: HoomanOptions & { resolveBodyOnly: true }): RequestPromise<string>;
	(url: string | URL, options?: HoomanOptions & { resolveBodyOnly: true; responseType: 'json' }): RequestPromise<unknown>;
	(url: string | URL, options?: HoomanOptions & { resolveBodyOnly: true; responseType: 'buffer' }): RequestPromise<Uint8Array<ArrayBuffer>>;
};

/**
Http interceptor using got to bypass Cloudflare DDOS protection / JavaScript
challenge.

@example
```
import hooman from 'hooman';

const response = await hooman('https://sayem.eu.org');
console.log(response.body);
```
*/
declare const hooman: HoomanCall & Got & Record<HTTPAlias, HoomanCall>;

export default hooman;
