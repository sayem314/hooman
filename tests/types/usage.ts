import { createWriteStream } from 'node:fs';
import hooman, { type HoomanContext, type HoomanOptions } from 'hooman';

async function main() {
	// Plain request through the interceptor
	const response = await hooman('https://example.com');
	console.log(response.statusCode, response.body);

	// HTTP aliases
	const get = await hooman.get('https://example.com');
	console.log(get.body);

	await hooman.post('https://httpbin.org/anything', {
		json: { hello: 'world' },
		responseType: 'json',
	});

	// Custom hooman options live inside context
	const options: HoomanOptions = {
		headers: { 'x-test': '1' },
		context: {
			cloudflareRetry: 3,
			captchaKey: 'key',
			rucaptcha: true,
			onCaptcha: async ({ pageurl, sitekey, method }: Parameters<NonNullable<HoomanContext['onCaptcha']>>[0]) =>
				`${pageurl} ${sitekey} ${method}`,
		},
	};
	await hooman('https://example.com', options);

	// Stream download
	const image = createWriteStream('image.jpg');
	hooman.stream('https://example.com/img.jpg').pipe(image);
}

void main();
